import { task } from "@trigger.dev/sdk";
import { generateSocialContent } from "./generate-social-content.js";
import { readFile, listDir, dateStamp } from "./config.js";

interface EntityPlatformConfig {
  entity: string;
  platforms: ("linkedin" | "twitter" | "instagram")[];
}

/**
 * Daily content pipeline — runs for ALL entities that have social-content workflows.
 * Discovers entities and their configured platforms, then generates content for each.
 *
 * Schedule: Daily 8am ET (register in Trigger.dev dashboard)
 */
export const dailyContentPipeline = task({
  id: "marketing-daily-content-pipeline",
  maxDuration: 300,
  run: async (payload?: { entities?: string[]; date?: string }) => {
    const date = payload?.date || dateStamp();

    // Discover entities with social-content workflows
    const entityConfigs = await discoverEntities(payload?.entities);

    if (entityConfigs.length === 0) {
      console.log("No entities with social-content workflows found");
      return { status: "no_entities", date };
    }

    console.log(
      `Running daily content pipeline for ${entityConfigs.length} entities: ${entityConfigs.map((e) => e.entity).join(", ")}`
    );

    // Generate content for each entity
    const results = [];
    for (const config of entityConfigs) {
      try {
        const result = await generateSocialContent.triggerAndWait({
          entity: config.entity,
          platforms: config.platforms,
          date,
        });
        results.push({ entity: config.entity, status: "completed", result });
      } catch (err: any) {
        console.error(`Failed for ${config.entity}:`, err.message);
        results.push({ entity: config.entity, status: "error", error: err.message });
      }
    }

    const succeeded = results.filter((r) => r.status === "completed").length;
    const failed = results.filter((r) => r.status === "error").length;

    console.log(`Daily pipeline complete: ${succeeded} succeeded, ${failed} failed`);

    return {
      date,
      totalEntities: entityConfigs.length,
      succeeded,
      failed,
      results,
    };
  },
});

/**
 * Discover entities that have social-content workflows.
 * Reads each entity's social-content.md to extract configured platforms.
 */
async function discoverEntities(filterEntities?: string[]): Promise<EntityPlatformConfig[]> {
  const configs: EntityPlatformConfig[] = [];

  try {
    const workflowDirs = await listDir("workflows");

    for (const dir of workflowDirs) {
      if (dir.type !== "dir") continue;
      if (filterEntities && !filterEntities.includes(dir.name)) continue;

      // Check if this entity has a social-content.md workflow
      try {
        const workflow = await readFile(`workflows/${dir.name}/social-content.md`);

        // Extract platforms from the workflow
        const platforms: ("linkedin" | "twitter" | "instagram")[] = [];
        const lower = workflow.toLowerCase();
        if (lower.includes("linkedin")) platforms.push("linkedin");
        if (lower.includes("twitter") || lower.includes("x ")) platforms.push("twitter");
        if (lower.includes("instagram")) platforms.push("instagram");

        if (platforms.length > 0) {
          configs.push({ entity: dir.name, platforms });
        }
      } catch {
        // No social-content workflow for this entity, skip
      }
    }
  } catch (err) {
    console.error("Failed to discover entities:", err);
  }

  return configs;
}
