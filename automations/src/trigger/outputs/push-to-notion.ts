import { task } from "@trigger.dev/sdk";
import { getNotion, NOTION_DB_ID, readOutput, listOutputs } from "./config.js";

/**
 * Push an output file to the Apex Outputs Notion database.
 * Creates a new page with the rendered markdown content.
 */
export const pushToNotion = task({
  id: "push-to-notion",
  run: async (payload: {
    entitySlug: string;
    outputType: string;
    fileName: string;
    version?: number;
  }) => {
    const notion = getNotion();
    const content = await readOutput(
      payload.entitySlug,
      payload.outputType,
      payload.fileName
    );
    const version = payload.version || 1;
    const title = `${payload.entitySlug} / ${payload.outputType} / ${payload.fileName}`;

    // Check if page already exists (same entity + type + file)
    const existing = await notion.databases.query({
      database_id: NOTION_DB_ID,
      filter: {
        and: [
          {
            property: "Entity",
            select: { equals: payload.entitySlug },
          },
          {
            property: "Output Type",
            rich_text: { equals: payload.outputType },
          },
          {
            property: "File",
            rich_text: { equals: payload.fileName },
          },
        ],
      },
    });

    // Split content into chunks of 2000 chars (Notion block limit)
    const chunks = splitContent(content, 2000);
    const children = chunks.map((chunk) => ({
      object: "block" as const,
      type: "paragraph" as const,
      paragraph: {
        rich_text: [{ type: "text" as const, text: { content: chunk } }],
      },
    }));

    if (existing.results.length > 0) {
      // Update existing page
      const pageId = existing.results[0].id;
      await notion.pages.update({
        page_id: pageId,
        properties: {
          Status: { select: { name: "Review" } },
          Version: { number: version },
        },
      });

      // Clear old content and add new
      const existingBlocks = await notion.blocks.children.list({
        block_id: pageId,
      });
      for (const block of existingBlocks.results) {
        await notion.blocks.delete({ block_id: block.id });
      }
      await notion.blocks.children.append({
        block_id: pageId,
        children,
      });

      console.log(`Updated Notion page: ${title} (v${version})`);
      return { pageId, action: "updated", version };
    }

    // Create new page
    const page = await notion.pages.create({
      parent: { database_id: NOTION_DB_ID },
      properties: {
        Name: { title: [{ text: { content: title } }] },
        Entity: { select: { name: payload.entitySlug } },
        "Output Type": {
          rich_text: [{ text: { content: payload.outputType } }],
        },
        File: {
          rich_text: [{ text: { content: payload.fileName } }],
        },
        Status: { select: { name: "Review" } },
        Version: { number: version },
      },
      children,
    });

    console.log(`Created Notion page: ${title}`);
    return { pageId: page.id, action: "created", version };
  },
});

/**
 * Push ALL outputs for an entity to Notion.
 */
export const pushAllOutputs = task({
  id: "push-all-outputs",
  run: async (payload: { entitySlug: string }) => {
    const outputs = await listOutputs(payload.entitySlug);
    const results = [];

    for (const output of outputs) {
      const result = await pushToNotion.triggerAndWait({
        entitySlug: payload.entitySlug,
        outputType: output.type,
        fileName: output.file,
      });
      results.push(result);
    }

    console.log(
      `Pushed ${results.length} outputs for ${payload.entitySlug}`
    );
    return { count: results.length, results };
  },
});

function splitContent(text: string, maxLen: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push(text.slice(i, i + maxLen));
  }
  return chunks;
}
