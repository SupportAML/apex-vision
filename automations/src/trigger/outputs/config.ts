import { Client } from "@notionhq/client";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import { Octokit } from "@octokit/rest";
import * as fs from "fs";
import * as path from "path";

// --- Clients ---

export function getNotion() {
  return new Client({ auth: process.env.NOTION_API_KEY });
}

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export function getClaude() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export function getOctokit() {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

// --- Config ---

export const NOTION_DB_ID = process.env.APEX_OUTPUTS_NOTION_DB_ID!;
export const REVIEW_FROM_EMAIL =
  process.env.REVIEW_FROM_EMAIL || "review@updates.apexmedlaw.com";

// GitHub repo info
const GITHUB_OWNER = process.env.GITHUB_OWNER || "SupportAML";
const GITHUB_REPO = process.env.GITHUB_REPO || "apex-vision";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

// Local path (used when running locally, also exported for orchestrator)
export const BRAIN_ROOT =
  process.env.APEX_BRAIN_ROOT ||
  path.resolve(__dirname, "../../../../apex-brain");

// Are we running in the cloud (Trigger.dev deployed) or locally?
const isCloud = !!process.env.GITHUB_TOKEN && !process.env.FORCE_LOCAL;

// --- File Operations (local or GitHub) ---

/** Read a file from apex-brain — local or GitHub */
export async function readFile(relativePath: string): Promise<string> {
  if (!isCloud) {
    const fullPath = path.join(BRAIN_ROOT, relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }
    return fs.readFileSync(fullPath, "utf-8");
  }

  const octokit = getOctokit();
  const { data } = await octokit.repos.getContent({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path: `apex-brain/${relativePath}`,
    ref: GITHUB_BRANCH,
  });

  if ("content" in data && data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }
  throw new Error(`Could not read: apex-brain/${relativePath}`);
}

/** Write a file to apex-brain — local or GitHub (with commit) */
export async function writeFile(
  relativePath: string,
  content: string,
  commitMessage: string
): Promise<void> {
  if (!isCloud) {
    const fullPath = path.join(BRAIN_ROOT, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf-8");
    return;
  }

  const octokit = getOctokit();
  const filePath = `apex-brain/${relativePath}`;

  // Get current file SHA if it exists (needed for updates)
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: filePath,
      ref: GITHUB_BRANCH,
    });
    if ("sha" in data) sha = data.sha;
  } catch {
    // File doesn't exist yet, that's fine
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path: filePath,
    message: commitMessage,
    content: Buffer.from(content).toString("base64"),
    branch: GITHUB_BRANCH,
    ...(sha ? { sha } : {}),
  });
}

/** List directory contents — local or GitHub */
export async function listDir(
  relativePath: string
): Promise<{ name: string; type: "file" | "dir" }[]> {
  if (!isCloud) {
    const fullPath = path.join(BRAIN_ROOT, relativePath);
    if (!fs.existsSync(fullPath)) return [];
    return fs.readdirSync(fullPath).map((name) => ({
      name,
      type: fs.statSync(path.join(fullPath, name)).isDirectory()
        ? ("dir" as const)
        : ("file" as const),
    }));
  }

  const octokit = getOctokit();
  const { data } = await octokit.repos.getContent({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path: `apex-brain/${relativePath}`,
    ref: GITHUB_BRANCH,
  });

  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    name: item.name,
    type: item.type === "dir" ? ("dir" as const) : ("file" as const),
  }));
}

// --- Helper functions built on file operations ---

/** Read a reviewer config for an entity. Returns list of email addresses. */
export async function getReviewers(entitySlug: string): Promise<string[]> {
  try {
    const content = await readFile(`entities/${entitySlug}/reviewers.md`);
    return content
      .split("\n")
      .filter((line) => line.match(/^-\s+\S+@\S+/))
      .map((line) => line.replace(/^-\s+/, "").trim());
  } catch {
    return [];
  }
}

/** Read an output file from apex-brain/outputs/ */
export async function readOutput(
  entitySlug: string,
  outputType: string,
  fileName: string
): Promise<string> {
  return readFile(`outputs/${entitySlug}/${outputType}/${fileName}`);
}

/** List all output files for an entity */
export async function listOutputs(
  entitySlug: string
): Promise<{ type: string; file: string }[]> {
  const typeDirs = await listDir(`outputs/${entitySlug}`);
  const results: { type: string; file: string }[] = [];

  for (const dir of typeDirs) {
    if (dir.type !== "dir") continue;
    const files = await listDir(`outputs/${entitySlug}/${dir.name}`);
    for (const file of files) {
      if (file.name === ".gitkeep" || file.type === "dir") continue;
      results.push({ type: dir.name, file: file.name });
    }
  }
  return results;
}
