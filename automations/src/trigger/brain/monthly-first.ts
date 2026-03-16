import { schedules } from "@trigger.dev/sdk";
import { runOrchestrator } from "./orchestrator.js";
import { fetchAnalytics } from "./fetch-analytics.js";

/**
 * Monthly first-of-month run — 9am ET on the 1st (13:00 UTC).
 *
 * Runs all workflows tagged `schedule: monthly` through the orchestrator,
 * then pulls a 30-day analytics rollup.
 *
 * After deploying, create the schedule in Trigger.dev dashboard:
 *   Task: monthly-first
 *   Cron: 0 13 1 * *
 */
export const monthlyFirst = schedules.task({
  id: "monthly-first",
  run: async () => {
    // 1. Run all monthly-scheduled workflows through the orchestrator
    const orchestratorResult = await runOrchestrator.triggerAndWait({
      schedule: "monthly",
    });

    // 2. Fetch 30-day analytics rollup
    const analyticsResult = await fetchAnalytics.triggerAndWait({
      source: "all",
      days: 30,
    });

    console.log("Monthly first run complete");
    return { orchestrator: orchestratorResult, analytics: analyticsResult };
  },
});
