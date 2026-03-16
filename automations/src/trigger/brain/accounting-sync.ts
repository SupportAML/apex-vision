import { task, schedules } from "@trigger.dev/sdk";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { BRAIN_ROOT, getClaude } from "../outputs/config.js";

const ENTITIES_DIR = path.join(BRAIN_ROOT, "entities");
const OUTPUTS_DIR = path.join(BRAIN_ROOT, "outputs");

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// --- Provider abstraction ---

interface NormalizedInvoice {
  provider: string;
  id: string;
  number: string;
  status: string;
  date: string;
  due_date: string;
  total: number;
  amount_due: number;
  amount_paid: number;
  currency: string;
  customer: string;
  memo: string;
}

interface NormalizedExpense {
  provider: string;
  id: string;
  description: string;
  date: string;
  amount: number;
  currency: string;
  category: string;
}

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

interface EntityAccountingConfig {
  provider: string;
  business_id: string;
  sync_schedule: string;
  categories: string[];
}

function parseEntityFinancials(entity: string): EntityAccountingConfig | null {
  const financialsPath = path.join(ENTITIES_DIR, entity, "financials.md");
  if (!fs.existsSync(financialsPath)) return null;

  const content = fs.readFileSync(financialsPath, "utf-8");
  const provider = content.match(/\*\*Provider:\*\*\s*(.+)/i)?.[1]?.trim() || "wave";
  const businessId = content.match(/\*\*Business ID:\*\*\s*(.+)/i)?.[1]?.trim() || "";
  const schedule = content.match(/\*\*Sync Schedule:\*\*\s*(.+)/i)?.[1]?.trim() || "daily";
  const catLine = content.match(/\*\*Categories:\*\*\s*(.+)/i)?.[1]?.trim() || "";
  const categories = catLine.split(",").map((c) => c.trim()).filter(Boolean);

  if (!businessId) return null;
  return { provider, business_id: businessId, sync_schedule: schedule, categories };
}

// --- Wave GraphQL provider ---

const WAVE_GQL_URL = "https://gql.waveapps.com/graphql/public";

async function waveRequest(query: string, variables?: Record<string, unknown>): Promise<any> {
  const token = process.env.WAVEAPPS_API_TOKEN;
  if (!token) throw new Error("WAVEAPPS_API_TOKEN not set");

  const res = await fetch(WAVE_GQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Wave API error: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function waveInvoices(businessId: string, days: number): Promise<NormalizedInvoice[]> {
  const query = `
    query($businessId: ID!, $page: Int!) {
      business(id: $businessId) {
        invoices(page: $page, pageSize: 50) {
          edges {
            node {
              id invoiceNumber status invoiceDate dueDate
              amountDue { value currency { code } }
              amountPaid { value currency { code } }
              total { value currency { code } }
              customer { name email }
              memo
            }
          }
        }
      }
    }
  `;

  const result = await waveRequest(query, { businessId, page: 1 });
  const edges = result?.data?.business?.invoices?.edges || [];
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

  return edges
    .map((e: any) => e.node)
    .filter((n: any) => n.invoiceDate && n.invoiceDate >= cutoff)
    .map((n: any): NormalizedInvoice => ({
      provider: "wave",
      id: n.id,
      number: n.invoiceNumber || "",
      status: (n.status || "UNKNOWN").toLowerCase(),
      date: n.invoiceDate || "",
      due_date: n.dueDate || "",
      total: parseFloat(n.total?.value || "0"),
      amount_due: parseFloat(n.amountDue?.value || "0"),
      amount_paid: parseFloat(n.amountPaid?.value || "0"),
      currency: n.total?.currency?.code || "USD",
      customer: n.customer?.name || "",
      memo: n.memo || "",
    }));
}

async function waveExpenses(businessId: string, days: number): Promise<NormalizedExpense[]> {
  const query = `
    query($businessId: ID!, $page: Int!) {
      business(id: $businessId) {
        transactions(page: $page, pageSize: 100) {
          edges {
            node {
              id description date
              amount { value currency { code } }
              account { name type { value } }
            }
          }
        }
      }
    }
  `;

  const result = await waveRequest(query, { businessId, page: 1 });
  const edges = result?.data?.business?.transactions?.edges || [];
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

  return edges
    .map((e: any) => e.node)
    .filter((n: any) => {
      if (!n.date || n.date < cutoff) return false;
      const type = n.account?.type?.value || "";
      return type === "EXPENSE" || type === "COST_OF_GOODS_SOLD";
    })
    .map((n: any): NormalizedExpense => ({
      provider: "wave",
      id: n.id,
      description: n.description || "",
      date: n.date || "",
      amount: Math.abs(parseFloat(n.amount?.value || "0")),
      currency: n.amount?.currency?.code || "USD",
      category: n.account?.name || "Uncategorized",
    }));
}

// --- Provider router ---

async function fetchInvoices(provider: string, businessId: string, days: number): Promise<NormalizedInvoice[]> {
  switch (provider) {
    case "wave":
      return waveInvoices(businessId, days);
    // Future: case "zoho": return zohoInvoices(businessId, days);
    // Future: case "quickbooks": return qboInvoices(businessId, days);
    default:
      throw new Error(`Unknown accounting provider: ${provider}`);
  }
}

async function fetchExpenses(provider: string, businessId: string, days: number): Promise<NormalizedExpense[]> {
  switch (provider) {
    case "wave":
      return waveExpenses(businessId, days);
    default:
      throw new Error(`Unknown accounting provider: ${provider}`);
  }
}

// --- Summary builder ---

function buildSummary(
  entity: string,
  provider: string,
  invoices: NormalizedInvoice[],
  expenses: NormalizedExpense[],
  days: number
): FinancialSummary {
  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.amount_paid, 0);
  const totalOutstanding = invoices.reduce((s, i) => s + i.amount_due, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const today = new Date().toISOString().split("T")[0];
  const overdue = invoices.filter(
    (i) => ["sent", "partial", "viewed"].includes(i.status) && i.due_date < today
  );

  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  return {
    entity,
    provider,
    period: `last ${days} days`,
    generated_at: new Date().toISOString(),
    revenue: {
      total_invoiced: Math.round(totalInvoiced * 100) / 100,
      total_collected: Math.round(totalPaid * 100) / 100,
      total_outstanding: Math.round(totalOutstanding * 100) / 100,
      overdue_count: overdue.length,
      overdue_total: Math.round(overdue.reduce((s, i) => s + i.amount_due, 0) * 100) / 100,
    },
    expenses: {
      total: Math.round(totalExpenses * 100) / 100,
      by_category: Object.fromEntries(
        Object.entries(byCategory)
          .sort(([, a], [, b]) => b - a)
          .map(([k, v]) => [k, Math.round(v * 100) / 100])
      ),
    },
    net: Math.round((totalPaid - totalExpenses) * 100) / 100,
    invoice_count: invoices.length,
    expense_count: expenses.length,
  };
}

// --- AI augmentation ---

async function augmentWithAI(summary: FinancialSummary, claude: Anthropic): Promise<FinancialSummary> {
  const prompt = `You are a concise financial analyst for a small business called "${summary.entity}".
Given this financial summary, provide:
1. A 2-3 sentence natural language summary
2. A list of alerts (overdue invoices, unusual spending, cash flow concerns)

Financial data:
${JSON.stringify(summary, null, 2)}

Return JSON only: { "summary": "...", "alerts": ["...", "..."] }`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      summary.ai_summary = parsed.summary;
      summary.ai_alerts = parsed.alerts || [];
    }
  } catch (err) {
    console.error("AI augmentation failed:", err);
  }

  return summary;
}

// --- Main sync task ---

export const syncAccounting = task({
  id: "sync-accounting",
  maxDuration: 120,
  run: async (payload: { entity?: string; days?: number; skipAI?: boolean }) => {
    const days = payload.days || 30;
    const results: FinancialSummary[] = [];

    // Discover entities with accounting config
    const entityDirs = fs.existsSync(ENTITIES_DIR)
      ? fs.readdirSync(ENTITIES_DIR, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
      : [];

    const targetEntities = payload.entity
      ? entityDirs.filter((e) => e === payload.entity)
      : entityDirs;

    for (const entity of targetEntities) {
      const config = parseEntityFinancials(entity);
      if (!config) continue;

      console.log(`Syncing ${entity} (${config.provider}, business: ${config.business_id})`);

      try {
        const invoices = await fetchInvoices(config.provider, config.business_id, days);
        const expenses = await fetchExpenses(config.provider, config.business_id, days);
        let summary = buildSummary(entity, config.provider, invoices, expenses, days);

        // AI augmentation
        if (!payload.skipAI && process.env.ANTHROPIC_API_KEY) {
          const claude = getClaude();
          summary = await augmentWithAI(summary, claude);
        }

        // Save outputs
        const outDir = path.join(OUTPUTS_DIR, entity, "financials");
        fs.mkdirSync(outDir, { recursive: true });

        const month = new Date().toISOString().slice(0, 7);
        fs.writeFileSync(
          path.join(outDir, `summary_${month}.json`),
          JSON.stringify(summary, null, 2)
        );
        fs.writeFileSync(
          path.join(outDir, "invoices_latest.json"),
          JSON.stringify(invoices, null, 2)
        );
        fs.writeFileSync(
          path.join(outDir, "expenses_latest.json"),
          JSON.stringify(expenses, null, 2)
        );

        results.push(summary);
        console.log(`Synced ${entity}: ${invoices.length} invoices, ${expenses.length} expenses`);
      } catch (err: any) {
        console.error(`Failed to sync ${entity}:`, err.message || err);
        results.push({
          entity,
          provider: config.provider,
          period: `last ${days} days`,
          generated_at: new Date().toISOString(),
          revenue: { total_invoiced: 0, total_collected: 0, total_outstanding: 0, overdue_count: 0, overdue_total: 0 },
          expenses: { total: 0, by_category: {} },
          net: 0,
          invoice_count: 0,
          expense_count: 0,
          ai_summary: `Sync failed: ${err.message || err}`,
          ai_alerts: ["Sync error — check API credentials and business ID"],
        });
      }
    }

    return results;
  },
});

// --- Scheduled sync (daily at 7am ET) ---

export const dailyAccountingSync = schedules.task({
  id: "daily-accounting-sync",
  run: async () => {
    return syncAccounting.triggerAndWait({ days: 30 });
  },
});
