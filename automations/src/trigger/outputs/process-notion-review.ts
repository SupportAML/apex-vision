import { task } from "@trigger.dev/sdk";
import {
  getNotion,
  getClaude,
  readFile,
  writeFile,
  readOutput,
} from "./config.js";
import { reviseContent } from "./revise-content.js";
import { publishApproved } from "./publish-approved.js";

/**
 * Process a Notion review action (webhook-driven, replaces polling).
 *
 * Handles three status transitions:
 * - "Approved" → save learnings from approval + publish
 * - "Revision" → extract feedback comment + save learnings + trigger revision
 * - "Rejected" → save learnings from rejection
 *
 * Every action feeds the global learnings system so future content improves.
 */
export const processNotionReview = task({
  id: "process-notion-review",
  maxDuration: 120,
  run: async (payload: { pageId: string }) => {
    const notion = getNotion();

    // Fetch the page
    const page = await notion.pages.retrieve({ page_id: payload.pageId });
    if (!("properties" in page)) {
      throw new Error("Could not read page properties");
    }

    const props = page.properties as Record<string, any>;
    const status = props.Status?.select?.name;
    const entity = props.Entity?.select?.name;
    const outputType = props["Output Type"]?.rich_text?.[0]?.plain_text;
    const fileName = props.File?.rich_text?.[0]?.plain_text;
    const version = props.Version?.number || 1;

    if (!entity || !outputType || !fileName) {
      console.log("Missing required properties on page", payload.pageId);
      return { status: "skipped", reason: "missing_properties" };
    }

    console.log(
      `Review action: ${status} for ${entity}/${outputType}/${fileName} (v${version})`
    );

    // Get the content that was reviewed
    let content = "";
    try {
      content = await readOutput(entity, outputType, fileName);
    } catch {
      console.log("Could not read output file, continuing without content");
    }

    // Get the latest comment (feedback)
    let feedback = "";
    try {
      const comments = await notion.comments.list({
        block_id: payload.pageId,
      });
      if (comments.results.length > 0) {
        const latest = comments.results[comments.results.length - 1];
        feedback = (latest as any).rich_text
          ?.map((rt: any) => rt.plain_text)
          .join("");
        // Skip system-generated comments
        if (feedback.startsWith("Feedback from ")) {
          feedback = feedback.replace(/^Feedback from [^:]+:\n/, "");
        }
      }
    } catch {
      // Comments may not be accessible
    }

    switch (status) {
      case "Approved": {
        // Save the approved content as a learning example
        await saveLearning({
          entity,
          outputType,
          fileName,
          content,
          feedback,
          action: "approved",
          version,
        });

        // Trigger publish
        await publishApproved.trigger({
          entitySlug: entity,
          outputType,
          fileName,
          notionPageId: payload.pageId,
        });

        return { action: "approved", entity, fileName };
      }

      case "Revision": {
        if (!feedback) {
          // Add a comment asking for feedback
          await notion.comments.create({
            parent: { page_id: payload.pageId },
            rich_text: [
              {
                type: "text",
                text: {
                  content:
                    "Status changed to Revision but no feedback comment found. Please add a comment with your feedback, then set status to Revision again.",
                },
              },
            ],
          });
          return { action: "revision_no_feedback", entity, fileName };
        }

        // Save the revision feedback as a learning
        await saveLearning({
          entity,
          outputType,
          fileName,
          content,
          feedback,
          action: "revision",
          version,
        });

        // Update status to Revising so we don't re-trigger
        await notion.pages.update({
          page_id: payload.pageId,
          properties: {
            Status: { select: { name: "Revising" } },
          },
        });

        // Trigger content revision
        await reviseContent.trigger({
          entitySlug: entity,
          outputType,
          fileName,
          notionPageId: payload.pageId,
          feedback,
          currentVersion: version,
        });

        return { action: "revision", entity, fileName, feedback };
      }

      case "Rejected": {
        // Save the rejection as a learning (what NOT to do)
        await saveLearning({
          entity,
          outputType,
          fileName,
          content,
          feedback,
          action: "rejected",
          version,
        });

        return { action: "rejected", entity, fileName };
      }

      default:
        console.log(`Unhandled status: ${status}`);
        return { action: "ignored", status };
    }
  },
});

// --- Global Learnings System ---

interface LearningEntry {
  date: string;
  entity: string;
  outputType: string;
  action: "approved" | "revision" | "rejected";
  feedback: string;
  contentSnippet: string;
  version: number;
}

/**
 * Save a learning from a review action.
 * Appends to two files:
 * 1. Global learnings file (apex-brain/skills/social-media-content/learnings.md)
 *    — Used by ALL entities in future content generation
 * 2. Entity-specific learnings (apex-brain/entities/[entity]/learnings.md)
 *    — Entity-specific patterns
 */
async function saveLearning(params: {
  entity: string;
  outputType: string;
  fileName: string;
  content: string;
  feedback: string;
  action: "approved" | "revision" | "rejected";
  version: number;
}) {
  const claude = getClaude();
  const date = new Date().toISOString().split("T")[0];

  // Use Claude to extract the actionable learning from this review
  const response = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Extract a concise, actionable learning from this content review.

Entity: ${params.entity}
Content type: ${params.outputType}
Action: ${params.action}
Version: ${params.version}
${params.feedback ? `Reviewer feedback: ${params.feedback}` : "No explicit feedback (content was approved as-is)"}

Content snippet (first 500 chars):
${params.content.slice(0, 500)}

Return ONE learning rule in this exact format (no other text):
- [${params.action.toUpperCase()}] {specific, reusable rule about what to do or avoid}

Examples:
- [APPROVED] Lead tweets with specific case statistics rather than generic claims
- [REVISION] Instagram captions should be under 150 words for this entity
- [REJECTED] Never use stock-sounding language like "unlock your potential"`,
      },
    ],
  });

  const learning =
    response.content[0].type === "text" ? response.content[0].text.trim() : "";

  if (!learning) return;

  // 1. Append to global learnings
  const globalPath = "skills/social-media-content/learnings.md";
  let globalLearnings = "";
  try {
    globalLearnings = await readFile(globalPath);
  } catch {
    globalLearnings = `# Content Learnings\n\nRules extracted from reviewer feedback across all entities.\nThese are loaded into every content generation prompt.\n\n## Rules\n`;
  }

  const globalEntry = `${learning} _(${params.entity}, ${date})_\n`;

  // Only add if we don't already have a very similar rule
  if (!globalLearnings.includes(learning.slice(10, 60))) {
    globalLearnings += globalEntry;
    await writeFile(
      globalPath,
      globalLearnings,
      `Add learning from ${params.action}: ${params.entity}/${params.fileName}`
    );
  }

  // 2. Append to entity-specific learnings
  const entityPath = `entities/${params.entity}/learnings.md`;
  let entityLearnings = "";
  try {
    entityLearnings = await readFile(entityPath);
  } catch {
    entityLearnings = `# ${params.entity} Content Learnings\n\nEntity-specific rules from reviewer feedback.\n\n## Rules\n`;
  }

  const entityEntry = `${learning} _(v${params.version}, ${date})_\n`;
  if (!entityLearnings.includes(learning.slice(10, 60))) {
    entityLearnings += entityEntry;
    await writeFile(
      entityPath,
      entityLearnings,
      `Add ${params.entity} learning from ${params.action}: ${params.fileName}`
    );
  }

  // 3. If approved, save the content as an example
  if (params.action === "approved" && params.content) {
    const examplePath = `skills/social-media-content/examples/${params.entity}-${params.fileName}`;
    await writeFile(
      examplePath,
      `<!-- Approved v${params.version} on ${date} -->\n${params.content}`,
      `Save approved example: ${params.entity}/${params.fileName}`
    );
  }

  console.log(`Saved learning (${params.action}): ${learning}`);
}
