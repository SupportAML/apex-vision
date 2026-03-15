import { pushToNotion } from "./push-to-notion.js";

/**
 * Test task: manually trigger push-to-notion for cason-plastics.
 * Run via Trigger.dev dashboard or CLI test.
 */
import { task } from "@trigger.dev/sdk";

export const testPush = task({
  id: "test-push",
  run: async () => {
    const result = await pushToNotion.triggerAndWait({
      entitySlug: "cason-plastics",
      outputType: "content",
      fileName: "30-day-calendar.md",
    });

    console.log("Push result:", JSON.stringify(result, null, 2));
    return result;
  },
});
