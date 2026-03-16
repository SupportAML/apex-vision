import fs from "fs";
import path from "path";
import * as gh from "./github";
import type { FinancialData } from "@/components/financial-overview";

const BRAIN_DIR = path.join(process.cwd(), "..", "apex-brain");
const BRAIN_PREFIX = "apex-brain";

/**
 * Check if an entity has accounting configured (has financials.md).
 */
async function hasFinancialsConfig(entitySlug: string): Promise<boolean> {
  try {
    if (gh.isGitHubMode()) {
      await gh.readFile(`${BRAIN_PREFIX}/entities/${entitySlug}/financials.md`);
      return true;
    }
    return fs.existsSync(path.join(BRAIN_DIR, "entities", entitySlug, "financials.md"));
  } catch {
    return false;
  }
}

/**
 * Get financial summary for an entity. Returns null if no data available.
 */
export async function getEntityFinancials(entitySlug: string): Promise<FinancialData | null> {
  const hasConfig = await hasFinancialsConfig(entitySlug);
  if (!hasConfig) return null;

  const month = new Date().toISOString().slice(0, 7);
  const relativePath = `outputs/${entitySlug}/financials/summary_${month}.json`;

  try {
    let content: string;
    if (gh.isGitHubMode()) {
      content = await gh.readFile(`${BRAIN_PREFIX}/${relativePath}`);
    } else {
      const fullPath = path.join(BRAIN_DIR, relativePath);
      if (!fs.existsSync(fullPath)) return null;
      content = fs.readFileSync(fullPath, "utf-8");
    }
    return JSON.parse(content) as FinancialData;
  } catch {
    return null;
  }
}

/**
 * Get all entities that have accounting configured.
 */
export async function getAccountingEntities(): Promise<string[]> {
  const configured: string[] = [];
  try {
    if (gh.isGitHubMode()) {
      const dirs = await gh.listDirs(`${BRAIN_PREFIX}/entities`);
      for (const d of dirs) {
        if (await hasFinancialsConfig(d)) configured.push(d);
      }
    } else {
      const entitiesDir = path.join(BRAIN_DIR, "entities");
      if (fs.existsSync(entitiesDir)) {
        for (const d of fs.readdirSync(entitiesDir, { withFileTypes: true })) {
          if (d.isDirectory() && fs.existsSync(path.join(entitiesDir, d.name, "financials.md"))) {
            configured.push(d.name);
          }
        }
      }
    }
  } catch {
    // No entities found
  }
  return configured;
}
