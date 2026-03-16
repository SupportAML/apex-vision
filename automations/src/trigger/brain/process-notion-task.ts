import { task } from "@trigger.dev/sdk";
import Anthropic from "@anthropic-ai/sdk";
import { getNotion, readFile, listDir } from "../outputs/config.js";
import * as path from "path";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4096;

/**
 * Process a task submitted via Notion.
 *
 * Flow:
 * 1. Fetch the Notion page (task title, description, entity, etc.)
 * 2. Set status → "Processing"
 * 3. Build context from apex-brain for the relevant entity
 * 4. Call Claude with the task + context
 * 5. Write response back to the Notion page
 * 6. Set status → "Done"
 */
export const processNotionTask = task({
  id: "process-notion-task",
  maxDuration: 300,
  run: async (payload: { pageId: string }) => {
    const notion = getNotion();
    const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // 1. Fetch the page
    const page = await notion.pages.retrieve({ page_id: payload.pageId });

    if (!("properties" in page)) {
      throw new Error("Could not read page properties");
    }

    const props = page.properties as Record<string, any>;

    // Extract task details from page properties
    const taskTitle = extractTitle(props);
    const entity = extractSelect(props, "Entity");
    const taskType = extractSelect(props, "Task Type");

    // Read the page body (description / instructions)
    const blocks = await notion.blocks.children.list({
      block_id: payload.pageId,
    });
    const taskDescription = blocksToText(blocks.results);

    console.log(
      `Processing task: "${taskTitle}" for entity: ${entity || "general"}`
    );

    // 2. Set status to Processing
    await notion.pages.update({
      page_id: payload.pageId,
      properties: {
        Status: { select: { name: "Processing" } },
      },
    });

    // 3. Build context
    let entityContext = "";
    if (entity) {
      try {
        const configParts: string[] = [];
        for (const fname of ["config.md", "brand.md", "goals.md"]) {
          try {
            const content = await readFile(`entities/${entity}/${fname}`);
            configParts.push(content);
          } catch {
            // file may not exist
          }
        }
        entityContext = configParts.join("\n\n---\n\n");
      } catch {
        entityContext = "";
      }
    }

    // Load global priorities
    let priorities = "";
    try {
      priorities = await readFile("context/priorities.md");
    } catch {
      // optional
    }

    // Load user context
    let userContext = "";
    try {
      userContext = await readFile("context/me.md");
    } catch {
      // optional
    }

    // 4. Call Claude
    const systemPrompt = `You are the Apex Brain AI assistant for ${entity || "the Apex ecosystem"}.
You help execute tasks submitted by the team via the Notion dashboard.

${userContext ? `## About the User\n${userContext}\n` : ""}
${entityContext ? `## Entity Context\n${entityContext}\n` : ""}
${priorities ? `## Current Priorities\n${priorities}\n` : ""}

## Rules
- Be direct and actionable. No filler.
- Provide concrete deliverables, not vague advice.
- If the task asks for content, produce the actual content.
- If the task asks for analysis, provide specific insights with data points.
- If the task asks for a plan, provide numbered steps with owners and deadlines.
- Match the entity's brand voice if producing customer-facing content.
- Format your response in clean markdown.`;

    const userPrompt = `## Task: ${taskTitle}
${taskType ? `**Type:** ${taskType}\n` : ""}
${taskDescription ? `**Details:**\n${taskDescription}` : "No additional details provided."}

Execute this task now. Provide a complete, actionable response.`;

    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const aiResponse =
      response.content[0].type === "text" ? response.content[0].text : "";

    // 5. Write response back to Notion page
    // Clear existing "AI Response" blocks if any, then append
    const responseBlocks = markdownToNotionBlocks(aiResponse);

    // Add a divider + heading before AI response
    const fullBlocks = [
      {
        object: "block" as const,
        type: "divider" as const,
        divider: {},
      },
      {
        object: "block" as const,
        type: "heading_2" as const,
        heading_2: {
          rich_text: [
            { type: "text" as const, text: { content: "AI Response" } },
          ],
        },
      },
      ...responseBlocks,
    ];

    await notion.blocks.children.append({
      block_id: payload.pageId,
      children: fullBlocks,
    });

    // 6. Set status to Done
    await notion.pages.update({
      page_id: payload.pageId,
      properties: {
        Status: { select: { name: "Done" } },
      },
    });

    console.log(`Completed task: "${taskTitle}"`);

    return {
      pageId: payload.pageId,
      title: taskTitle,
      entity,
      responseLength: aiResponse.length,
      usage: response.usage,
    };
  },
});

// --- Helpers ---

function extractTitle(props: Record<string, any>): string {
  // Notion title can be under "Name", "Title", or "Task"
  for (const key of ["Name", "Title", "Task"]) {
    if (props[key]?.title?.[0]?.plain_text) {
      return props[key].title[0].plain_text;
    }
  }
  return "Untitled Task";
}

function extractSelect(
  props: Record<string, any>,
  key: string
): string | null {
  return props[key]?.select?.name || null;
}

function blocksToText(blocks: any[]): string {
  return blocks
    .map((block) => {
      const type = block.type;
      if (!block[type]?.rich_text) return "";
      return block[type].rich_text
        .map((t: any) => t.plain_text || "")
        .join("");
    })
    .filter(Boolean)
    .join("\n\n");
}

function markdownToNotionBlocks(markdown: string): any[] {
  // Split into chunks of 2000 chars (Notion block text limit)
  const lines = markdown.split("\n");
  const blocks: any[] = [];
  let currentParagraph: string[] = [];

  function flushParagraph() {
    if (currentParagraph.length === 0) return;
    const text = currentParagraph.join("\n");
    const chunks = splitText(text, 2000);
    for (const chunk of chunks) {
      blocks.push({
        object: "block" as const,
        type: "paragraph" as const,
        paragraph: {
          rich_text: [{ type: "text" as const, text: { content: chunk } }],
        },
      });
    }
    currentParagraph = [];
  }

  for (const line of lines) {
    // Headings
    const h3Match = line.match(/^###\s+(.+)/);
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      flushParagraph();
      blocks.push({
        object: "block" as const,
        type: "heading_3" as const,
        heading_3: {
          rich_text: [
            { type: "text" as const, text: { content: h2Match[1] } },
          ],
        },
      });
      continue;
    }
    if (h3Match) {
      flushParagraph();
      blocks.push({
        object: "block" as const,
        type: "heading_3" as const,
        heading_3: {
          rich_text: [
            { type: "text" as const, text: { content: h3Match[1] } },
          ],
        },
      });
      continue;
    }

    // Bullet points
    const bulletMatch = line.match(/^[-*]\s+(.+)/);
    if (bulletMatch) {
      flushParagraph();
      blocks.push({
        object: "block" as const,
        type: "bulleted_list_item" as const,
        bulleted_list_item: {
          rich_text: [
            { type: "text" as const, text: { content: bulletMatch[1] } },
          ],
        },
      });
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^\d+\.\s+(.+)/);
    if (numMatch) {
      flushParagraph();
      blocks.push({
        object: "block" as const,
        type: "numbered_list_item" as const,
        numbered_list_item: {
          rich_text: [
            { type: "text" as const, text: { content: numMatch[1] } },
          ],
        },
      });
      continue;
    }

    // Empty line = paragraph break
    if (line.trim() === "") {
      flushParagraph();
      continue;
    }

    currentParagraph.push(line);
  }

  flushParagraph();
  return blocks;
}

function splitText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push(text.slice(i, i + maxLen));
  }
  return chunks;
}
