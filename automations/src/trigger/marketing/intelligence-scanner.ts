import { task } from "@trigger.dev/sdk";
import {
  getClaude,
  pushToNotionReview,
  writeFile,
  dateStamp,
  CLAUDE_MODEL,
} from "./config.js";

interface IntelligenceFinding {
  title: string;
  summary: string;
  relevantEntities: string[];
  recommendation: string;
  actionable: boolean;
  category: "tool" | "technique" | "algorithm" | "trend" | "competitor";
}

interface IntelligenceReport {
  date: string;
  findings: IntelligenceFinding[];
}

/**
 * Daily marketing intelligence scanner.
 * Uses Claude to research the latest marketing tools, techniques, algorithm changes,
 * and industry trends. Saves reports and notifies the marketing team.
 *
 * Schedule: Daily (register in Trigger.dev dashboard)
 */
export const intelligenceScanner = task({
  id: "marketing-intelligence-scanner",
  maxDuration: 300,
  run: async (payload?: {
    date?: string;
    focusAreas?: string[];
  }) => {
    const claude = getClaude();
    const date = payload?.date || dateStamp();

    const systemPrompt = `You are a marketing intelligence analyst for Apex Brain, a holding company managing multiple business entities:

- NLC (Neurology Legal Consulting): medical-legal consulting connecting neurologists with law firms
- ApexMedLaw: parent medical-legal holding company
- Club Haus: barbershop/grooming business
- Titan Renovations: construction/renovation company
- A2Z Equity: investment/real estate firm
- Porcupine Edu: educational content platform

Your job is to scan the marketing landscape and identify actionable intelligence.

## Focus Areas
1. New marketing tools and platforms (especially AI-powered)
2. Social media algorithm changes (LinkedIn, Instagram, X/Twitter, TikTok)
3. Content marketing techniques and trends
4. Email marketing best practices and deliverability changes
5. Industry-specific marketing trends for medical-legal, construction, education, finance
6. Competitor strategies in each vertical
7. SEO and search marketing updates
8. Video and visual content trends
${payload?.focusAreas ? `\nAdditional focus: ${payload.focusAreas.join(", ")}` : ""}

Return a JSON object with findings array. Be specific and actionable.`;

    const userPrompt = `Generate today's marketing intelligence report for ${date}.

Consider recent developments in:
- AI marketing tools (new features in Claude, GPT, Midjourney, etc.)
- Social media platform changes (algorithm updates, new features, API changes)
- Content format trends (short-form video, carousel posts, threads, etc.)
- Email marketing changes (deliverability rules, Gmail/Outlook updates)
- Industry-specific news for our verticals

Return JSON:
{
  "findings": [
    {
      "title": "Brief title",
      "summary": "2-3 sentence summary of the finding",
      "relevantEntities": ["nlc", "club-haus"],
      "recommendation": "What we should do about it",
      "actionable": true,
      "category": "tool" | "technique" | "algorithm" | "trend" | "competitor"
    }
  ]
}

Include 5-8 findings. Prioritize actionable intelligence over general news.`;

    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";

    let report: IntelligenceReport;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
      report = { date, findings: parsed.findings || [] };
    } catch {
      console.error("Failed to parse intelligence report");
      report = { date, findings: [] };
    }

    // Save report to outputs
    const filename = `intelligence/intel-${date}.json`;
    try {
      await writeFile(
        `outputs/${filename}`,
        JSON.stringify(report, null, 2),
        `Marketing intelligence report for ${date}`
      );
    } catch (err) {
      console.error("Failed to save intelligence report:", err);
    }

    // Push summary to Notion for dashboard display
    const summaryText = report.findings
      .map((f, i) => {
        const entities = f.relevantEntities.join(", ");
        return `### ${i + 1}. ${f.title} [${f.category}]
${f.summary}

**Entities:** ${entities}
**Recommendation:** ${f.recommendation}
**Actionable:** ${f.actionable ? "Yes" : "No"}`;
      })
      .join("\n\n---\n\n");

    await pushToNotionReview({
      entity: "portfolio",
      platform: "email",
      contentType: "intelligence",
      title: `Marketing Intelligence — ${date}`,
      body: summaryText || "No findings for today.",
    });

    console.log(
      `Intelligence report for ${date}: ${report.findings.length} findings`
    );

    return report;
  },
});

/**
 * Evaluate a specific intelligence finding and propose incorporating it.
 * Called when marketer clicks "Incorporate" on an intelligence item in the dashboard.
 */
export const intelligenceEvaluator = task({
  id: "marketing-intelligence-evaluator",
  maxDuration: 120,
  run: async (payload: {
    finding: IntelligenceFinding;
    targetEntities: string[];
  }) => {
    const claude = getClaude();

    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: "You are a marketing strategist. Evaluate how a marketing technique or tool can be applied to specific business entities. Be specific about implementation steps.",
      messages: [
        {
          role: "user",
          content: `Evaluate this marketing intelligence finding for implementation:

Finding: ${JSON.stringify(payload.finding, null, 2)}

Target entities: ${payload.targetEntities.join(", ")}

Provide:
1. How each entity can benefit
2. Specific implementation steps
3. Expected impact
4. Any risks or considerations
5. Whether this should update our content generation rules (learnings.md)`,
        },
      ],
    });

    const evaluation =
      response.content[0].type === "text" ? response.content[0].text : "";

    console.log(`Evaluated finding: ${payload.finding.title}`);
    return { finding: payload.finding, evaluation };
  },
});
