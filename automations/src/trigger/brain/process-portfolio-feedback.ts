import { task } from "@trigger.dev/sdk";
import { getClaude, getResend, getOctokit, REVIEW_FROM_EMAIL } from "../outputs/config.js";

const GITHUB_OWNER = process.env.GITHUB_OWNER || "SupportAML";
const GITHUB_REPO = process.env.GITHUB_REPO || "apex-vision";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const CONTENT_FILE_PATH =
  "automations/src/trigger/brain/portfolio-summary-content.ts";

export const processPortfolioFeedback = task({
  id: "process-portfolio-feedback",
  maxDuration: 120,
  run: async (payload: { from: string; subject: string; text: string }) => {
    const { from, text } = payload;

    console.log(`Processing portfolio feedback from ${from}`);

    // 1. Read the current content file from GitHub
    const octokit = getOctokit();
    const { data: fileData } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: CONTENT_FILE_PATH,
      ref: GITHUB_BRANCH,
    });

    if (!("content" in fileData) || !fileData.content) {
      throw new Error(`Could not read ${CONTENT_FILE_PATH}`);
    }

    const currentContent = Buffer.from(fileData.content, "base64").toString("utf-8");
    const fileSha = fileData.sha;

    // 2. Ask Claude to apply the feedback
    const claude = getClaude();
    const response = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `You are updating a TypeScript file that generates an HTML email for a portfolio summary.

The user sent this feedback about the email:
<feedback>
${text.trim()}
</feedback>

Here is the current TypeScript source file:
<file>
${currentContent}
</file>

Instructions:
- Apply the user's feedback to improve the HTML template inside \`buildPortfolioSummaryHtml()\`
- If the user asks to add data, add reasonable placeholder rows or sections
- Update \`PORTFOLIO_SUMMARY_VERSION\` to today's date: ${new Date().toISOString().slice(0, 10)}
- Preserve all existing imports, exports, and the overall file structure
- Return ONLY the complete updated TypeScript file — no explanation, no markdown fences, no commentary`,
        },
      ],
    });

    const updatedContent =
      response.content[0].type === "text" ? response.content[0].text.trim() : null;

    if (!updatedContent) {
      throw new Error("Claude returned no content");
    }

    // 3. Commit the updated file back to GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: CONTENT_FILE_PATH,
      message: `Update portfolio summary from email feedback (${new Date().toISOString().slice(0, 10)})`,
      content: Buffer.from(updatedContent).toString("base64"),
      branch: GITHUB_BRANCH,
      sha: fileSha,
    });

    console.log("portfolio-summary-content.ts updated and committed");

    // 4. Send a short confirmation back to Abhi
    const resend = getResend();
    await resend.emails.send({
      from: REVIEW_FROM_EMAIL,
      to: [from],
      subject: "Got it — portfolio summary updated",
      html: `<p style="font-family:sans-serif;font-size:14px;color:#18181b;">
        Your feedback has been applied to the portfolio summary template.
        The next time the report runs, it will reflect your changes.
      </p>
      <p style="font-family:sans-serif;font-size:13px;color:#71717a;">
        You can also reply to this email with more changes at any time.
      </p>`,
    });

    return { updated: true, commitFile: CONTENT_FILE_PATH };
  },
});
