import { schedules } from "@trigger.dev/sdk";
import { runOrchestrator } from "./orchestrator.js";
import { fetchAnalytics } from "./fetch-analytics.js";

/**
 * Weekly Monday run — 10am ET (14:00 UTC).
 *
 * After deploying, create the schedule in Trigger.dev dashboard:
 *   Task: weekly-monday
 *   Cron: 0 14 * * 1
 */
export const weeklyMonday = schedules.task({
  id: "weekly-monday",
  run: async () => {
    // 1. Run all weekly-scheduled workflows through the orchestrator
    const orchestratorResult = await runOrchestrator.triggerAndWait({
      schedule: "weekly",
    });

    // 2. Fetch 7-day analytics rollup from GA4 + LinkedIn
    const analyticsResult = await fetchAnalytics.triggerAndWait({
      source: "all",
      days: 7,
    });

    console.log("Weekly Monday run complete");
    return { orchestrator: orchestratorResult, analytics: analyticsResult };
  },
});
