import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import {
  getNotion,
  getResend,
  getClaude,
  BRAIN_ROOT,
  NOTION_DB_ID,
  REVIEW_FROM_EMAIL,
  readFile,
  writeFile,
  listDir,
  getReviewers,
} from "../outputs/config.js";

// Re-export shared clients and config
export {
  getNotion,
  getResend,
  getClaude,
  BRAIN_ROOT,
  NOTION_DB_ID,
  REVIEW_FROM_EMAIL,
  readFile,
  writeFile,
  listDir,
  getReviewers,
};

// --- Marketing-specific config ---

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";
export const MAX_TOKENS = 4096;

export type Platform = "linkedin" | "twitter" | "instagram";
export type ContentType = "post" | "reel" | "carousel" | "story" | "email" | "intelligence";

export const MARKETING_OUTPUT_DIR = path.join(BRAIN_ROOT, "outputs");
export const LEARNINGS_DIR = path.join(BRAIN_ROOT, "skills", "social-media-content");
export const EXAMPLES_DIR = path.join(LEARNINGS_DIR, "examples");
export const FEEDBACK_LOG = path.join(BRAIN_ROOT, "decisions", "marketing-feedback-log.jsonl");

// --- Entity context loading ---

/** Load full entity context: config + brand + goals */
export async function loadEntityContext(entitySlug: string): Promise<string> {
  const parts: string[] = [];
  for (const fname of ["config.md", "brand.md", "goals.md"]) {
    try {
      const content = await readFile(`entities/${entitySlug}/${fname}`);
      if (content) parts.push(`## ${fname.replace(".md", "").toUpperCase()}\n${content}`);
    } catch {
      // File may not exist for every entity
    }
  }
  return parts.join("\n\n---\n\n");
}

/** Load skill definition */
export async function loadSkillContext(skillName: string): Promise<string> {
  try {
    return await readFile(`skills/${skillName}/SKILL.md`);
  } catch {
    return "";
  }
}

/** Load learnings (global + entity-specific) */
export async function loadLearnings(entitySlug: string): Promise<string> {
  const parts: string[] = [];

  // Global skill learnings
  try {
    const global = await readFile("skills/social-media-content/learnings.md");
    if (global.trim()) parts.push(`## Global Learnings\n${global}`);
  } catch { /* empty */ }

  // Entity-specific learnings
  try {
    const entity = await readFile(`entities/${entitySlug}/learnings.md`);
    if (entity.trim()) parts.push(`## ${entitySlug} Learnings\n${entity}`);
  } catch { /* empty */ }

  // Load last 2 approved examples for few-shot
  try {
    const exampleDir = `skills/social-media-content/examples/${entitySlug}`;
    const files = await listDir(exampleDir);
    const mdFiles = files
      .filter((f) => f.name.endsWith(".md") && f.type === "file")
      .slice(-2);
    for (const file of mdFiles) {
      const content = await readFile(`${exampleDir}/${file.name}`);
      parts.push(`## Approved Example\n${content}`);
    }
  } catch { /* no examples yet */ }

  return parts.join("\n\n---\n\n");
}

/** Save a learning rule to both global and entity learnings.md */
export async function saveLearning(
  entitySlug: string,
  rule: string,
  commitMessage: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  const entry = `\n- [${timestamp}] ${rule}`;

  // Append to global learnings
  try {
    let global = "";
    try { global = await readFile("skills/social-media-content/learnings.md"); } catch { /* empty */ }
    if (!global.includes("## Rules")) {
      global += "\n\n## Rules\n";
    }
    global += entry;
    await writeFile("skills/social-media-content/learnings.md", global, commitMessage);
  } catch (err) {
    console.error("Failed to save global learning:", err);
  }

  // Append to entity learnings
  try {
    let entity = "";
    try { entity = await readFile(`entities/${entitySlug}/learnings.md`); } catch { /* empty */ }
    if (!entity.includes("## Rules")) {
      entity = `# ${entitySlug} Learnings\n\n## Rules\n`;
    }
    entity += entry;
    await writeFile(`entities/${entitySlug}/learnings.md`, entity, commitMessage);
  } catch (err) {
    console.error("Failed to save entity learning:", err);
  }
}

/** Save an approved example for few-shot learning */
export async function saveApprovedExample(
  entitySlug: string,
  platform: string,
  content: string
): Promise<void> {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `skills/social-media-content/examples/${entitySlug}/${platform}-${ts}.md`;
  await writeFile(filename, content, `Save approved ${platform} example for ${entitySlug}`);
}

/** Log feedback to the marketing feedback JSONL log */
export function logFeedback(entry: {
  entity: string;
  platform: string;
  contentType: string;
  action: "approved" | "rejected";
  feedback?: string;
  extractedRule?: string;
  marketer?: string;
}): void {
  const logEntry = { timestamp: new Date().toISOString(), ...entry };
  try {
    fs.mkdirSync(path.dirname(FEEDBACK_LOG), { recursive: true });
    fs.appendFileSync(FEEDBACK_LOG, JSON.stringify(logEntry) + "\n");
  } catch {
    // In cloud mode, log to console instead
    console.log("Feedback:", JSON.stringify(logEntry));
  }
}

// --- Notion helpers for marketing review queue ---

/** Push content to Notion as a marketing review item */
export async function pushToNotionReview(payload: {
  entity: string;
  platform: Platform | "email";
  contentType: ContentType;
  title: string;
  body: string;
  imageUrl?: string;
  prospectName?: string;
  prospectEmail?: string;
  campaign?: string;
}): Promise<{ pageId: string }> {
  const notion = getNotion();

  const properties: any = {
    Name: { title: [{ text: { content: `${payload.entity} / ${payload.platform} / ${payload.title}` } }] },
    Entity: { select: { name: payload.entity } },
    "Output Type": { rich_text: [{ text: { content: payload.contentType } }] },
    Status: { select: { name: "Review" } },
    Version: { number: 1 },
  };

  // Add platform as a rich_text property (will create if not exists)
  properties["Platform"] = { rich_text: [{ text: { content: payload.platform } }] };

  // Optional properties
  if (payload.imageUrl) {
    properties["File"] = { rich_text: [{ text: { content: payload.imageUrl } }] };
  }
  if (payload.prospectName) {
    properties["File"] = { rich_text: [{ text: { content: `${payload.prospectName} <${payload.prospectEmail || ""}>` } }] };
  }

  // Split content into chunks for Notion blocks
  const chunks = splitContent(payload.body, 2000);
  const children = chunks.map((chunk) => ({
    object: "block" as const,
    type: "paragraph" as const,
    paragraph: {
      rich_text: [{ type: "text" as const, text: { content: chunk } }],
    },
  }));

  const page = await notion.pages.create({
    parent: { database_id: NOTION_DB_ID },
    properties,
    children,
  });

  console.log(`Created Notion review page: ${payload.entity}/${payload.platform}/${payload.title}`);
  return { pageId: page.id };
}

function splitContent(text: string, maxLen: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push(text.slice(i, i + maxLen));
  }
  return chunks.length > 0 ? chunks : [""];
}

/** Fetch pending marketing review items from Notion */
export async function fetchPendingReviews(filters?: {
  entity?: string;
  platform?: string;
  contentType?: string;
}): Promise<any[]> {
  const notion = getNotion();

  const filterConditions: any[] = [
    { property: "Status", select: { equals: "Review" } },
  ];
  if (filters?.entity) {
    filterConditions.push({ property: "Entity", select: { equals: filters.entity } });
  }

  const response = await notion.databases.query({
    database_id: NOTION_DB_ID,
    filter: filterConditions.length === 1
      ? filterConditions[0]
      : { and: filterConditions },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  });

  return response.results;
}

// --- Utility ---

export function dateStamp(): string {
  return new Date().toISOString().split("T")[0];
}

export function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
