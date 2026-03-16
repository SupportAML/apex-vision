/**
 * One-off script: Push the NLC infographic to Notion and print the database URL.
 * Run with: npx tsx scripts/push-nlc-infographic.ts
 */
import { Client } from "@notionhq/client";
import * as fs from "fs";
import * as path from "path";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DB_ID = process.env.APEX_OUTPUTS_NOTION_DB_ID;

if (!NOTION_API_KEY || !DB_ID) {
  console.error("Missing env: NOTION_API_KEY and APEX_OUTPUTS_NOTION_DB_ID required");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

const BRAIN_ROOT = path.resolve(__dirname, "../apex-brain");
const ENTITY = "nlc";
const OUTPUT_TYPE = "infographic";
const FILE_NAME = "neuro-malpractice-stats-2026.md";

async function main() {
  // Read the infographic content
  const filePath = path.join(BRAIN_ROOT, "outputs", ENTITY, OUTPUT_TYPE, FILE_NAME);
  const content = fs.readFileSync(filePath, "utf-8");
  const title = `${ENTITY} / ${OUTPUT_TYPE} / ${FILE_NAME}`;

  // Split into 2000-char chunks (Notion API limit)
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += 2000) {
    chunks.push(content.slice(i, i + 2000));
  }

  const children = chunks.map((chunk) => ({
    object: "block" as const,
    type: "paragraph" as const,
    paragraph: {
      rich_text: [{ type: "text" as const, text: { content: chunk } }],
    },
  }));

  // Check if page already exists
  const existing = await notion.databases.query({
    database_id: DB_ID,
    filter: {
      and: [
        { property: "Entity", select: { equals: ENTITY } },
        { property: "Output Type", rich_text: { equals: OUTPUT_TYPE } },
        { property: "File", rich_text: { equals: FILE_NAME } },
      ],
    },
  });

  let pageId: string;

  if (existing.results.length > 0) {
    pageId = existing.results[0].id;
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Status: { select: { name: "Review" } },
        Version: { number: 1 },
      },
    });
    // Clear old content
    const oldBlocks = await notion.blocks.children.list({ block_id: pageId });
    for (const block of oldBlocks.results) {
      await notion.blocks.delete({ block_id: block.id });
    }
    await notion.blocks.children.append({ block_id: pageId, children });
    console.log(`Updated existing page: ${pageId}`);
  } else {
    const page = await notion.pages.create({
      parent: { database_id: DB_ID },
      properties: {
        Name: { title: [{ text: { content: title } }] },
        Entity: { select: { name: ENTITY } },
        "Output Type": { rich_text: [{ text: { content: OUTPUT_TYPE } }] },
        File: { rich_text: [{ text: { content: FILE_NAME } }] },
        Status: { select: { name: "Review" } },
        Version: { number: 1 },
      },
      children,
    });
    pageId = page.id;
    console.log(`Created new page: ${pageId}`);
  }

  // Print links
  const cleanPageId = pageId.replace(/-/g, "");
  const cleanDbId = DB_ID.replace(/-/g, "");
  console.log(`\n✅ NLC Infographic pushed to Notion!`);
  console.log(`\nPage: https://notion.so/${cleanPageId}`);
  console.log(`Database: https://notion.so/${cleanDbId}`);
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
