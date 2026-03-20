import { task } from "@trigger.dev/sdk";
import { prospectScraper } from "./prospect-scraper.js";
import { prospectQualifier, QualifiedProspect } from "./prospect-qualifier.js";
import { pushToNotionReview, dateStamp } from "./config.js";

/**
 * Full email marketing campaign pipeline:
 * 1. Scrape prospects (hospitals, law firms)
 * 2. Qualify and score with Claude
 * 3. Generate personalized emails
 * 4. Push to Notion review queue for marketer approval
 *
 * Schedule: Weekly (register in Trigger.dev dashboard)
 */
export const emailCampaign = task({
  id: "marketing-email-campaign",
  maxDuration: 300,
  run: async (payload: {
    entity: string;
    states?: string[];
    maxProspects?: number;
  }) => {
    const maxProspects = payload.maxProspects || 50;
    const date = dateStamp();

    console.log(`Starting email campaign for ${payload.entity} on ${date}`);

    // Step 1: Scrape prospects
    const scrapeResult = await prospectScraper.triggerAndWait({
      entity: payload.entity,
      states: payload.states,
    });

    if (!scrapeResult || scrapeResult.prospects.length === 0) {
      console.log("No prospects found");
      return { status: "no_prospects", date };
    }

    console.log(`Found ${scrapeResult.prospects.length} raw prospects`);

    // Limit to prevent excessive API usage
    const prospectBatch = scrapeResult.prospects.slice(0, maxProspects);

    // Step 2: Qualify prospects and generate emails
    const qualifyResult = await prospectQualifier.triggerAndWait({
      entity: payload.entity,
      prospects: prospectBatch,
    });

    if (!qualifyResult || qualifyResult.qualified.length === 0) {
      console.log("No qualified prospects");
      return { status: "no_qualified", scraped: scrapeResult.prospects.length, date };
    }

    console.log(`Qualified ${qualifyResult.qualified.length} prospects`);

    // Step 3: Push each qualified prospect's email to Notion for review
    const notionPageIds: string[] = [];
    for (const prospect of qualifyResult.qualified) {
      try {
        const emailContent = `To: ${prospect.name}${prospect.email ? ` <${prospect.email}>` : ""}
Location: ${prospect.location}
Relevance Score: ${prospect.relevanceScore}/100
Needs: ${prospect.needsAnalysis}

---

Subject: ${prospect.emailSubject}

${prospect.emailBody}

---
Source: ${prospect.source} | ${prospect.url}`;

        const result = await pushToNotionReview({
          entity: payload.entity,
          platform: "email",
          contentType: "email",
          title: `Email to ${prospect.name} — ${date}`,
          body: emailContent,
          prospectName: prospect.name,
          prospectEmail: prospect.email,
          campaign: `${payload.entity}-outreach-${date}`,
        });

        notionPageIds.push(result.pageId);
      } catch (err) {
        console.error(`Failed to push email for ${prospect.name}:`, err);
      }
    }

    console.log(
      `Email campaign complete: ${notionPageIds.length} emails queued for review`
    );

    return {
      status: "completed",
      date,
      scraped: scrapeResult.prospects.length,
      qualified: qualifyResult.qualified.length,
      dropped: qualifyResult.dropped,
      emailsQueued: notionPageIds.length,
      sourceCounts: scrapeResult.sourceCounts,
    };
  },
});
