import { schedules } from "@trigger.dev/sdk";
import { runOrchestrator } from "./orchestrator.js";
import { scrapeTrending } from "./scrape-trending.js";
import { generateAndSendInfographic } from "../outputs/daily-infographic-email.js";

/**
 * Daily morning run — 8am ET (12:00 UTC).
 *
 * After deploying, create the schedule in Trigger.dev dashboard:
 *   Task: daily-morning
 *   Cron: 0 12 * * *
 */
export const dailyMorning = schedules.task({
  id: "daily-morning",
  run: async () => {
    // 1. Run all daily-scheduled workflows through the orchestrator
    const orchestratorResult = await runOrchestrator.triggerAndWait({
      schedule: "daily",
    });

    // 2. Scrape trending repos from GitHub + Trendshift
    const trendingResult = await scrapeTrending.triggerAndWait({
      source: "all",
    });

    // 3. Send NLC daily infographic email to lawyers
    const infographicResult = await generateAndSendInfographic.triggerAndWait({
      entitySlug: "nlc",
      recipientEmail: "ahkapuria@gmail.com",
    });

    console.log("Daily morning run complete");
    return {
      orchestrator: orchestratorResult,
      trending: trendingResult,
      infographic: infographicResult,
    };
  },
});
