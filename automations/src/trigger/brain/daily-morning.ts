import { schedules } from "@trigger.dev/sdk";
import { runOrchestrator } from "./orchestrator.js";
import { scrapeTrending } from "./scrape-trending.js";
import { sendStatusReport } from "./send-status-report.js";

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
    // 1. Send status report email first so Abhi sees it before content runs
    const statusResult = await sendStatusReport.triggerAndWait({
      period: "daily",
      recipientEmail: "ahkapuria@gmail.com",
    });

    // 2. Run all daily-scheduled workflows through the orchestrator
    const orchestratorResult = await runOrchestrator.triggerAndWait({
      schedule: "daily",
    });

    // 3. Scrape trending repos from GitHub + Trendshift
    const trendingResult = await scrapeTrending.triggerAndWait({
      source: "all",
    });

    console.log("Daily morning run complete");
    return {
      status_report: statusResult,
      orchestrator: orchestratorResult,
      trending: trendingResult,
    };
  },
});
