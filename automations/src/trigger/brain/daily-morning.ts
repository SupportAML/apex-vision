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
    // Run all three tasks in parallel so failures don't block each other
    const [orchestratorResult, trendingResult, infographicResult] =
      await Promise.allSettled([
        // 1. Run all daily-scheduled workflows through the orchestrator
        runOrchestrator.triggerAndWait({ schedule: "daily" }),

        // 2. Scrape trending repos from GitHub + Trendshift
        scrapeTrending.triggerAndWait({ source: "all" }),

        // 3. Send NLC daily infographic email to lawyers
        generateAndSendInfographic.triggerAndWait({
          entitySlug: "nlc",
          recipientEmail: "ahkapuria@gmail.com",
        }),
      ]);

    console.log("Daily morning run complete");
    return {
      orchestrator:
        orchestratorResult.status === "fulfilled"
          ? orchestratorResult.value
          : { error: String(orchestratorResult.reason) },
      trending:
        trendingResult.status === "fulfilled"
          ? trendingResult.value
          : { error: String(trendingResult.reason) },
      infographic:
        infographicResult.status === "fulfilled"
          ? infographicResult.value
          : { error: String(infographicResult.reason) },
    };
  },
});
