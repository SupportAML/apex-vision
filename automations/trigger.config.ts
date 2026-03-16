import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_fjcwsbzohjekilvboejo",
  dirs: ["src/trigger"],
  maxDuration: 300, // 5 minutes max per task run
  init: async () => {
    const token = process.env.DOPPLER_TOKEN;
    if (!token) return;

    const res = await fetch(
      "https://api.doppler.com/v3/configs/config/secrets/download?format=json",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Doppler secrets fetch failed: ${res.status} ${res.statusText}`);
    }

    const secrets = (await res.json()) as Record<string, string>;
    for (const [key, value] of Object.entries(secrets)) {
      process.env[key] = value;
    }
  },
});
