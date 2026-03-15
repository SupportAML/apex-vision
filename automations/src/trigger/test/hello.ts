import { task } from "@trigger.dev/sdk";

export const helloWorld = task({
  id: "hello-world",
  run: async () => {
    const now = new Date().toISOString();
    console.log(`Hello from Trigger.dev — ${now}`);
    return { status: "alive", timestamp: now };
  },
});
