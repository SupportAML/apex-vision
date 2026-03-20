import { task } from "@trigger.dev/sdk";
import {
  getClaude,
  loadEntityContext,
  loadSkillContext,
  loadLearnings,
  CLAUDE_MODEL,
  MAX_TOKENS,
} from "./config.js";
import { RawProspect } from "./prospect-scraper.js";

export interface QualifiedProspect extends RawProspect {
  relevanceScore: number;
  needsAnalysis: string;
  emailSubject: string;
  emailBody: string;
}

/**
 * Qualify raw prospects using Claude — analyze their needs and generate personalized emails.
 * Processes prospects in batches to manage API usage.
 */
export const prospectQualifier = task({
  id: "marketing-prospect-qualifier",
  maxDuration: 300,
  run: async (payload: {
    entity: string;
    prospects: RawProspect[];
    batchSize?: number;
  }): Promise<{ qualified: QualifiedProspect[]; dropped: number }> => {
    const claude = getClaude();
    const batchSize = payload.batchSize || 10;

    const [entityContext, emailSkill, learnings] = await Promise.all([
      loadEntityContext(payload.entity),
      loadSkillContext("email-outreach"),
      loadLearnings(payload.entity),
    ]);

    const systemPrompt = `You are the Apex Brain email marketing specialist for "${payload.entity}".
Your job is to qualify prospects and generate personalized cold outreach emails.

## Entity Context
${entityContext}

## Email Outreach Skill
${emailSkill}

## Learnings
${learnings || "No learnings yet."}

## Rules
- Score relevance 0-100 based on how likely they are to need our services
- Analyze their specific needs based on available information
- Write a personalized email that addresses THEIR specific situation
- Keep emails under 150 words — concise, direct, professional
- Use the entity's brand voice
- Include a clear, single CTA (usually a meeting request)
- Personalize the first line — never generic
- CAN-SPAM compliant — honest subject line, no deception
- Return valid JSON only`;

    const qualified: QualifiedProspect[] = [];
    let dropped = 0;

    // Process in batches
    for (let i = 0; i < payload.prospects.length; i += batchSize) {
      const batch = payload.prospects.slice(i, i + batchSize);

      const userPrompt = `Qualify these ${batch.length} prospects and generate personalized emails for each.

Prospects:
${JSON.stringify(batch, null, 2)}

Return a JSON array:
[
  {
    "index": 0,
    "relevance_score": 0-100,
    "needs_analysis": "Brief analysis of their needs",
    "email_subject": "Personalized subject line",
    "email_body": "The email body text"
  }
]

Only include prospects with relevance_score >= 40. Skip irrelevant ones.`;

      try {
        const response = await claude.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        const rawText =
          response.content[0].type === "text" ? response.content[0].text : "";

        let results: any[];
        try {
          const jsonMatch = rawText.match(/\[[\s\S]*\]/);
          results = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
        } catch {
          console.error("Failed to parse qualifier results for batch", i);
          results = [];
        }

        for (const result of results) {
          const prospect = batch[result.index];
          if (!prospect) continue;

          if (result.relevance_score >= 40) {
            qualified.push({
              ...prospect,
              relevanceScore: result.relevance_score,
              needsAnalysis: result.needs_analysis || "",
              emailSubject: result.email_subject || "",
              emailBody: result.email_body || "",
            });
          } else {
            dropped++;
          }
        }

        // Count prospects not returned as dropped
        dropped += batch.length - results.length;
      } catch (err) {
        console.error(`Batch ${i} qualification failed:`, err);
        dropped += batch.length;
      }
    }

    // Sort by relevance score descending
    qualified.sort((a, b) => b.relevanceScore - a.relevanceScore);

    console.log(
      `Qualified ${qualified.length} prospects (dropped ${dropped}) for ${payload.entity}`
    );

    return { qualified, dropped };
  },
});
