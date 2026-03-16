import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as gh from "@/lib/github";

const BRAIN_PREFIX = "apex-brain";
const BRAIN_DIR = path.join(process.cwd(), "..", "apex-brain");

interface FinancialSummary {
  entity: string;
  provider: string;
  period: string;
  generated_at: string;
  revenue: {
    total_invoiced: number;
    total_collected: number;
    total_outstanding: number;
    overdue_count: number;
    overdue_total: number;
  };
  expenses: {
    total: number;
    by_category: Record<string, number>;
  };
  net: number;
  invoice_count: number;
  expense_count: number;
  ai_summary?: string;
  ai_alerts?: string[];
}

async function readFinancials(entity: string): Promise<FinancialSummary | null> {
  const month = new Date().toISOString().slice(0, 7);
  const relativePath = `outputs/${entity}/financials/summary_${month}.json`;

  try {
    if (gh.isGitHubMode()) {
      const content = await gh.readFile(`${BRAIN_PREFIX}/${relativePath}`);
      return JSON.parse(content);
    }

    const fullPath = path.join(BRAIN_DIR, relativePath);
    if (!fs.existsSync(fullPath)) return null;
    return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
  } catch {
    return null;
  }
}

async function getConfiguredEntities(): Promise<string[]> {
  const entitiesPath = `entities`;
  const configured: string[] = [];

  try {
    if (gh.isGitHubMode()) {
      const dirs = await gh.listDirs(`${BRAIN_PREFIX}/${entitiesPath}`);
      for (const d of dirs) {
        try {
          await gh.readFile(`${BRAIN_PREFIX}/entities/${d}/financials.md`);
          configured.push(d);
        } catch {
          // No financials.md, skip
        }
      }
    } else {
      const entitiesDir = path.join(BRAIN_DIR, entitiesPath);
      if (fs.existsSync(entitiesDir)) {
        for (const d of fs.readdirSync(entitiesDir, { withFileTypes: true })) {
          if (d.isDirectory() && fs.existsSync(path.join(entitiesDir, d.name, "financials.md"))) {
            configured.push(d.name);
          }
        }
      }
    }
  } catch {
    // Fallback: no entities
  }

  return configured;
}

// GET: return financial summaries for all configured entities (or a specific one)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const entity = searchParams.get("entity");

  if (entity) {
    const summary = await readFinancials(entity);
    if (!summary) {
      return NextResponse.json(
        { error: `No financial data for ${entity}. Run accounting sync first.` },
        { status: 404 }
      );
    }
    return NextResponse.json(summary);
  }

  // Return all configured entities
  const entities = await getConfiguredEntities();
  const summaries: Record<string, FinancialSummary | null> = {};

  for (const e of entities) {
    summaries[e] = await readFinancials(e);
  }

  return NextResponse.json({
    configured_entities: entities,
    summaries,
  });
}
