import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

function getNotion() {
  return new Client({ auth: process.env.NOTION_API_KEY });
}

const NOTION_DB_ID = process.env.APEX_OUTPUTS_NOTION_DB_ID!;

/**
 * GET /api/marketing/content
 * Fetch all pending marketing content from Notion, categorized by type.
 */
export async function GET(request: NextRequest) {
  try {
    const notion = getNotion();

    // Query all review items
    const response = await notion.databases.query({
      database_id: NOTION_DB_ID,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
      page_size: 100,
    });

    const social: any[] = [];
    const emails: any[] = [];
    const intelligence: any[] = [];

    for (const page of response.results) {
      const props = (page as any).properties;

      // Extract properties safely
      const entity = props.Entity?.select?.name || "";
      const outputType = props["Output Type"]?.rich_text?.[0]?.plain_text || "";
      const platform = props.Platform?.rich_text?.[0]?.plain_text || "";
      const status = props.Status?.select?.name || "Review";
      const title = props.Name?.title?.[0]?.plain_text || "";
      const file = props.File?.rich_text?.[0]?.plain_text || "";
      const createdAt = (page as any).created_time?.split("T")[0] || "";

      // Read content from blocks
      let content = "";
      try {
        const blocks = await notion.blocks.children.list({
          block_id: page.id,
          page_size: 20,
        });
        content = blocks.results
          .map((block: any) => {
            if (block.type === "paragraph") {
              return block.paragraph.rich_text
                ?.map((t: any) => t.plain_text)
                .join("") || "";
            }
            return "";
          })
          .filter(Boolean)
          .join("\n\n");
      } catch {
        // blocks may fail
      }

      const baseItem = {
        id: page.id,
        notionPageId: page.id,
        entity,
        title,
        createdAt,
        status,
      };

      if (outputType === "intelligence") {
        // Parse intelligence findings
        const findings = parseIntelligenceFindings(content, createdAt);
        intelligence.push(...findings);
      } else if (outputType === "email" || platform === "email") {
        // Parse email content
        const emailItem = parseEmailContent(content, baseItem);
        emails.push(emailItem);
      } else if (
        platform === "linkedin" ||
        platform === "twitter" ||
        platform === "instagram" ||
        outputType.startsWith("social-")
      ) {
        // Parse social content
        const socialItem = parseSocialContent(content, platform || outputType.replace("social-", ""), baseItem);
        social.push(socialItem);
      }
    }

    return NextResponse.json({ social, emails, intelligence });
  } catch (err: any) {
    console.error("Marketing content fetch error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch content" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketing/content
 * Approve or reject a content item.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, notionPageId, feedback, id } = body;

    const notion = getNotion();

    if (action === "approve") {
      // Update Notion status
      await notion.pages.update({
        page_id: notionPageId,
        properties: {
          Status: { select: { name: "Approved" } },
        },
      });

      // Trigger auto-post (fire and forget via internal API)
      try {
        await fetch(`${process.env.TRIGGER_API_URL || ""}/api/trigger`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: "marketing-auto-post",
            payload: { notionPageId },
          }),
        });
      } catch {
        // Trigger may not be available in all environments
      }

      return NextResponse.json({ status: "approved", notionPageId });
    }

    if (action === "reject") {
      await notion.pages.update({
        page_id: notionPageId,
        properties: {
          Status: { select: { name: "Rejected" } },
        },
      });

      // Add feedback as comment
      if (feedback) {
        await notion.comments.create({
          parent: { page_id: notionPageId },
          rich_text: [{ text: { content: `Dashboard feedback: ${feedback}` } }],
        });
      }

      // Trigger feedback processing
      try {
        await fetch(`${process.env.TRIGGER_API_URL || ""}/api/trigger`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: "marketing-process-feedback",
            payload: { notionPageId, action: "rejected", feedback },
          }),
        });
      } catch {
        // non-critical
      }

      return NextResponse.json({ status: "rejected", notionPageId });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Marketing content action error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process action" },
      { status: 500 }
    );
  }
}

// --- Parsers ---

function parseSocialContent(content: string, platform: string, base: any) {
  // Extract hashtags
  const hashtagMatch = content.match(/Hashtags?:\s*(.*)/i);
  const hashtags = hashtagMatch
    ? hashtagMatch[1]
        .split(/[\s,]+/)
        .map((t) => t.replace(/^#/, "").trim())
        .filter(Boolean)
    : [];

  // Extract image prompt
  const imagePromptMatch = content.match(/Image Prompt:\s*(.*)/is);
  const imagePrompt = imagePromptMatch?.[1]?.trim();

  // Extract caption
  const captionMatch = content.match(/Caption:\s*(.*?)(?:\n---|$)/is);
  const caption = captionMatch?.[1]?.trim();

  // Main text (before any --- separator)
  const text = content.split("\n---\n")[0].trim();

  return {
    ...base,
    platform: platform as "linkedin" | "twitter" | "instagram",
    text,
    hashtags,
    imagePrompt,
    caption,
  };
}

function parseEmailContent(content: string, base: any) {
  const toMatch = content.match(/To:\s*(.+)/);
  const locationMatch = content.match(/Location:\s*(.+)/);
  const scoreMatch = content.match(/Relevance Score:\s*(\d+)/);
  const needsMatch = content.match(/Needs:\s*(.+)/);
  const subjectMatch = content.match(/Subject:\s*(.+)/);

  const prospectName = toMatch?.[1]?.replace(/<[^>]+>/, "").trim() || "Unknown";
  const emailMatch = content.match(/<([^>]+@[^>]+)>/);

  // Body is everything between Subject line and the trailing ---
  const subjectLine = subjectMatch?.[1]?.trim() || "";
  const bodyStart = content.indexOf(subjectLine) + subjectLine.length;
  const trailingSeparator = content.lastIndexOf("\n---\n");
  const body = content
    .slice(bodyStart, trailingSeparator > bodyStart ? trailingSeparator : undefined)
    .trim();

  return {
    ...base,
    prospectName,
    prospectEmail: emailMatch?.[1]?.trim(),
    location: locationMatch?.[1]?.trim(),
    relevanceScore: scoreMatch ? parseInt(scoreMatch[1]) : undefined,
    needsAnalysis: needsMatch?.[1]?.trim(),
    subject: subjectLine,
    body,
  };
}

function parseIntelligenceFindings(content: string, date: string) {
  const findings: any[] = [];
  // Split by ### headers
  const sections = content.split(/###\s+\d+\.\s+/);

  for (const section of sections) {
    if (!section.trim()) continue;

    const titleMatch = section.match(/^(.+?)(?:\s*\[(\w+)\])?\s*\n/);
    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    const category = titleMatch[2]?.toLowerCase() || "trend";

    const entitiesMatch = section.match(/\*\*Entities?:\*\*\s*(.+)/i);
    const recommendationMatch = section.match(/\*\*Recommendation:\*\*\s*(.+)/i);
    const actionableMatch = section.match(/\*\*Actionable:\*\*\s*(.+)/i);

    const summary = section
      .replace(/^.+?\n/, "")
      .replace(/\*\*.*?\*\*.+/g, "")
      .replace(/---/g, "")
      .trim()
      .split("\n")[0] || "";

    findings.push({
      id: `intel-${date}-${findings.length}`,
      date,
      title,
      summary,
      relevantEntities: entitiesMatch?.[1]?.split(",").map((e) => e.trim()) || [],
      recommendation: recommendationMatch?.[1]?.trim() || "",
      actionable: actionableMatch?.[1]?.toLowerCase().includes("yes") ?? true,
      category,
    });
  }

  return findings;
}
