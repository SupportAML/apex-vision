import { task } from "@trigger.dev/sdk";
import { getClaude, readOutput, readFile, writeFile } from "./config.js";
import { pushToNotion } from "./push-to-notion.js";
import { sendReviewEmail } from "./send-review-email.js";

/**
 * Revise content based on reviewer feedback using Claude API.
 * Writes the revised version back to the repo (local or GitHub) and sends a new review email.
 */
export const reviseContent = task({
  id: "revise-content",
  run: async (payload: {
    entitySlug: string;
    outputType: string;
    fileName: string;
    notionPageId: string;
    feedback: string;
    currentVersion: number;
  }) => {
    const claude = getClaude();
    const originalContent = await readOutput(
      payload.entitySlug,
      payload.outputType,
      payload.fileName
    );

    const newVersion = payload.currentVersion + 1;

    // Read entity config for context
    let entityConfig = "";
    try {
      entityConfig = await readFile(`entities/${payload.entitySlug}/config.md`);
    } catch {}

    let brandGuide = "";
    try {
      brandGuide = await readFile(`entities/${payload.entitySlug}/brand.md`);
    } catch {}

    const response = await claude.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are revising content for ${payload.entitySlug}. Apply the reviewer's feedback to improve the content while maintaining the same format and structure.

## Entity Context
${entityConfig}

## Brand Guide
${brandGuide}

## Current Content (v${payload.currentVersion})
${originalContent}

## Reviewer Feedback
${payload.feedback}

## Instructions
- Apply the feedback precisely
- Keep the same markdown format
- Don't add meta-commentary, just output the revised content
- Maintain brand voice and tone from the brand guide`,
        },
      ],
    });

    const revisedContent =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Write revised content back (locally or commit to GitHub)
    await writeFile(
      `outputs/${payload.entitySlug}/${payload.outputType}/${payload.fileName}`,
      revisedContent,
      `Revise ${payload.entitySlug} ${payload.outputType}/${payload.fileName} to v${newVersion}\n\nFeedback: ${payload.feedback.slice(0, 200)}`
    );

    // Update Notion with new version
    const notionResult = await pushToNotion.triggerAndWait({
      entitySlug: payload.entitySlug,
      outputType: payload.outputType,
      fileName: payload.fileName,
      version: newVersion,
    });

    // Send new review email
    await sendReviewEmail.trigger({
      entitySlug: payload.entitySlug,
      outputType: payload.outputType,
      fileName: payload.fileName,
      notionPageId: payload.notionPageId,
      version: newVersion,
    });

    console.log(
      `Revised ${payload.entitySlug}/${payload.outputType}/${payload.fileName} to v${newVersion}`
    );
    return {
      version: newVersion,
      notionResult,
      feedbackApplied: payload.feedback.slice(0, 200),
    };
  },
});
