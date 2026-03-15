import { schedules, task } from "@trigger.dev/sdk";
import {
  getClaude,
  getResend,
  getReviewers,
  readFile,
  REVIEW_FROM_EMAIL,
} from "./config.js";

// Hardcoded fallback — ensures emails send even if reviewers.md isn't on main yet
const NLC_FALLBACK_RECIPIENTS = ["ahkapuria@gmail.com"];

/**
 * Generate a daily infographic-style email for NLC, targeting lawyers.
 * Highlights NLC services, case stats, and value props in a visual HTML format.
 *
 * Schedule in Trigger.dev dashboard:
 *   Task: daily-infographic-email
 *   Cron: 0 13 * * 1-5 (9am ET weekdays)
 */
export const dailyInfographicEmail = schedules.task({
  id: "daily-infographic-email",
  maxDuration: 300,
  run: async () => {
    let reviewers = await getReviewers("nlc");
    console.log(`getReviewers("nlc") returned: ${JSON.stringify(reviewers)}`);

    if (reviewers.length === 0) {
      console.log("No reviewers from config, using fallback recipients");
      reviewers = NLC_FALLBACK_RECIPIENTS;
    }

    const result = await generateAndSendInfographic.triggerAndWait({
      entitySlug: "nlc",
      recipients: reviewers,
    });
    return result;
  },
});

/**
 * Core task: generate infographic content via Claude, render as HTML email, send via Resend.
 */
export const generateAndSendInfographic = task({
  id: "generate-and-send-infographic",
  run: async (payload: { entitySlug: string; recipients: string[] }) => {
    if (!payload.recipients || payload.recipients.length === 0) {
      console.log("No recipients provided");
      return { sent: false, reason: "no_recipients" };
    }

    console.log(`Generating infographic for ${payload.entitySlug}, sending to: ${payload.recipients.join(", ")}`);

    const claude = getClaude();

    // Read NLC context
    let config = "";
    let brand = "";
    let goals = "";
    try { config = await readFile(`entities/${payload.entitySlug}/config.md`); } catch (e) { console.log("No config.md found, continuing"); }
    try { brand = await readFile(`entities/${payload.entitySlug}/brand.md`); } catch (e) { console.log("No brand.md found, continuing"); }
    try { goals = await readFile(`entities/${payload.entitySlug}/goals.md`); } catch (e) { console.log("No goals.md found, continuing"); }

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });

    console.log("Calling Claude to generate infographic content...");
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are a medical-legal marketing strategist for NLC (Neurology Legal Consulting). Create content for a daily infographic email that would be sent to personal injury and medical malpractice attorneys.

## About NLC
${config}

## Brand Voice
${brand}

## Current Goals
${goals}

## Today
${dayOfWeek}, ${dateStr}

## Instructions
Generate a JSON object (no markdown fencing) with these fields:

{
  "headline": "A compelling 5-8 word headline for today's infographic (rotate themes: case win insights, neurology expertise, turnaround speed, physician network depth, etc.)",
  "subheadline": "One sentence expanding the headline, directed at attorneys",
  "stat1_number": "A realistic impressive stat (e.g., '200+', '48hr', '95%')",
  "stat1_label": "What the stat measures (e.g., 'Cases Reviewed', 'Avg Turnaround', 'Attorney Satisfaction')",
  "stat2_number": "Second stat",
  "stat2_label": "Second label",
  "stat3_number": "Third stat",
  "stat3_label": "Third label",
  "services": ["3-4 service bullet points highlighting what NLC offers attorneys"],
  "tip_title": "Today's Neuro-Legal Insight",
  "tip_body": "A 2-3 sentence educational tip about neurology cases that attorneys would find valuable. Reference specific case types (TBI, spinal cord, stroke, seizure disorders, etc.). Make it genuinely useful.",
  "cta_text": "Call-to-action button text",
  "cta_subtext": "One line under the CTA"
}

Vary the theme each day. Today focus on something fresh and specific, not generic. Use real neurology terminology. Sound like a confident physician-run consulting firm, not a marketing agency.`,
        },
      ],
    });

    console.log("Claude response received, parsing JSON...");
    const contentText =
      response.content[0].type === "text" ? response.content[0].text : "";

    let infographicData;
    try {
      infographicData = JSON.parse(contentText);
    } catch {
      // Try extracting JSON from the response
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        infographicData = JSON.parse(jsonMatch[0]);
      } else {
        console.error("Failed to parse infographic JSON:", contentText.slice(0, 200));
        return { sent: false, reason: "parse_error" };
      }
    }

    const html = renderInfographicEmail(infographicData, dateStr);

    console.log(`Sending email via Resend from ${REVIEW_FROM_EMAIL} to ${payload.recipients.join(", ")}...`);
    const resend = getResend();
    const result = await resend.emails.send({
      from: REVIEW_FROM_EMAIL,
      to: payload.recipients,
      subject: `NLC Daily: ${infographicData.headline}`,
      html,
    });
    console.log("Resend response:", JSON.stringify(result));

    if (result.error) {
      console.error("Resend error:", JSON.stringify(result.error));
      return { sent: false, error: result.error };
    }

    console.log(
      `Sent NLC infographic email to ${payload.recipients.join(", ")}: ${infographicData.headline}`
    );
    return {
      sent: true,
      emailId: result.data?.id,
      recipients: payload.recipients,
      headline: infographicData.headline,
      date: dateStr,
    };
  },
});

function renderInfographicEmail(data: any, dateStr: string): string {
  const services = (data.services || [])
    .map(
      (s: string) =>
        `<tr><td style="padding: 10px 16px; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9;">
          <span style="color: #1e3a5f; font-weight: 600; margin-right: 8px;">&#9654;</span>${s}
        </td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f4f8; padding: 24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%); padding: 32px 40px; text-align: center;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align: center;">
            <p style="margin: 0 0 4px; font-size: 12px; letter-spacing: 2px; color: #8bb8e8; text-transform: uppercase; font-weight: 600;">Neurology Legal Consulting</p>
            <h1 style="margin: 0; font-size: 26px; color: #ffffff; font-weight: 700; line-height: 1.3;">${escapeHtml(data.headline)}</h1>
            <p style="margin: 12px 0 0; font-size: 15px; color: #c5d9ed; line-height: 1.5;">${escapeHtml(data.subheadline)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Stats Row -->
  <tr>
    <td style="padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc;">
        <tr>
          <td width="33%" style="text-align: center; padding: 28px 12px; border-right: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 32px; font-weight: 800; color: #1e3a5f;">${escapeHtml(data.stat1_number)}</p>
            <p style="margin: 6px 0 0; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">${escapeHtml(data.stat1_label)}</p>
          </td>
          <td width="34%" style="text-align: center; padding: 28px 12px; border-right: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 32px; font-weight: 800; color: #1e3a5f;">${escapeHtml(data.stat2_number)}</p>
            <p style="margin: 6px 0 0; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">${escapeHtml(data.stat2_label)}</p>
          </td>
          <td width="33%" style="text-align: center; padding: 28px 12px;">
            <p style="margin: 0; font-size: 32px; font-weight: 800; color: #1e3a5f;">${escapeHtml(data.stat3_number)}</p>
            <p style="margin: 6px 0 0; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">${escapeHtml(data.stat3_label)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Services -->
  <tr>
    <td style="padding: 32px 40px 24px;">
      <p style="margin: 0 0 16px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; font-weight: 700;">What We Bring to Your Cases</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #fafbfc; border-radius: 8px; overflow: hidden;">
        ${services}
      </table>
    </td>
  </tr>

  <!-- Daily Insight -->
  <tr>
    <td style="padding: 0 40px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f7ff; border-radius: 8px; border-left: 4px solid #2d5a8e;">
        <tr>
          <td style="padding: 20px 24px;">
            <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #1e3a5f;">${escapeHtml(data.tip_title)}</p>
            <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">${escapeHtml(data.tip_body)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="padding: 0 40px 36px; text-align: center;">
      <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="background: #1e3a5f; border-radius: 8px; padding: 14px 36px;">
            <a href="mailto:info@neurologylegalconsulting.com" style="color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; display: block;">${escapeHtml(data.cta_text)}</a>
          </td>
        </tr>
      </table>
      <p style="margin: 12px 0 0; font-size: 13px; color: #94a3b8;">${escapeHtml(data.cta_subtext)}</p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background: #1e293b; padding: 24px 40px; text-align: center;">
      <p style="margin: 0 0 4px; font-size: 13px; color: #94a3b8; font-weight: 600;">Neurology Legal Consulting</p>
      <p style="margin: 0; font-size: 12px; color: #64748b;">Board-Certified Neurologists &middot; Nationwide Medical-Legal Consulting</p>
      <p style="margin: 12px 0 0; font-size: 11px; color: #475569;">${dateStr}</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
