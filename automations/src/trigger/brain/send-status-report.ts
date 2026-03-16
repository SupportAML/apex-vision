import { task } from "@trigger.dev/sdk";
import { getResend, readFile, BRAIN_ROOT } from "../outputs/config.js";
import * as fs from "fs";
import * as path from "path";

const RUN_LOG = path.join(BRAIN_ROOT, "decisions", "run_log.jsonl");
const ENTITIES_DIR = path.join(BRAIN_ROOT, "entities");
const WORKFLOWS_DIR = path.join(BRAIN_ROOT, "workflows");
const OUTPUTS_DIR = path.join(BRAIN_ROOT, "outputs");
const CONTEXT_DIR = path.join(BRAIN_ROOT, "context");
const REPORT_DIR = path.join(OUTPUTS_DIR, "status-reports");
const REVIEW_FROM_EMAIL =
  process.env.REVIEW_FROM_EMAIL || "review@updates.apexmedlaw.com";

// --- Helpers ---

function loadFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8").trim();
  } catch {
    return "";
  }
}

function getEntities(): string[] {
  if (!fs.existsSync(ENTITIES_DIR)) return [];
  return fs
    .readdirSync(ENTITIES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function getEntityWorkflows(entity: string): string[] {
  const wdir = path.join(WORKFLOWS_DIR, entity);
  if (!fs.existsSync(wdir)) return [];
  return fs
    .readdirSync(wdir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(".md", ""));
}

interface RunEntry {
  workflow: string;
  entity: string;
  timestamp: string;
  steps_completed: number;
  steps_total: number;
  needs_approval: boolean;
}

function loadRunLog(since: Date): RunEntry[] {
  if (!fs.existsSync(RUN_LOG)) return [];
  const entries: RunEntry[] = [];
  for (const line of fs.readFileSync(RUN_LOG, "utf-8").trim().split("\n")) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line) as RunEntry;
      if (new Date(entry.timestamp) >= since) entries.push(entry);
    } catch {
      continue;
    }
  }
  return entries;
}

function getLatestOutputs(
  entity: string,
  limit = 3
): { file: string; workflow: string; timestamp: string }[] {
  const odir = path.join(OUTPUTS_DIR, entity);
  if (!fs.existsSync(odir)) return [];

  const files = fs
    .readdirSync(odir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(odir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit);

  return files.map((f) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(odir, f.name), "utf-8"));
      return {
        file: f.name,
        workflow: data.workflow || f.name,
        timestamp: data.timestamp || "",
      };
    } catch {
      return { file: f.name, workflow: f.name, timestamp: "" };
    }
  });
}

type Health = "green" | "yellow" | "red";

interface EntityReport {
  entity: string;
  health: Health;
  healthLabel: string;
  workflowCount: number;
  workflows: string[];
  runsInPeriod: number;
  runsCompleted: number;
  runsFailed: number;
  pendingApprovals: number;
  latestOutputs: { file: string; workflow: string; timestamp: string }[];
  goalsSummary: string;
}

function buildEntityReport(entity: string, runs: RunEntry[]): EntityReport {
  const workflows = getEntityWorkflows(entity);
  const outputs = getLatestOutputs(entity);
  const entityRuns = runs.filter((r) => r.entity === entity);

  const total = entityRuns.length;
  const completed = entityRuns.filter(
    (r) => r.steps_completed === r.steps_total && r.steps_total > 0
  ).length;
  const failed = entityRuns.filter(
    (r) => r.steps_completed < r.steps_total && r.steps_total > 0
  ).length;
  const pending = entityRuns.filter((r) => r.needs_approval).length;

  let health: Health;
  let healthLabel: string;
  if (total === 0) {
    health = "red";
    healthLabel = "No activity";
  } else if (failed > 0) {
    health = "yellow";
    healthLabel = `${failed} failed run(s)`;
  } else if (pending > 0) {
    health = "yellow";
    healthLabel = `${pending} awaiting approval`;
  } else {
    health = "green";
    healthLabel = "All systems go";
  }

  const goalsFile = path.join(ENTITIES_DIR, entity, "goals.md");
  const goals = loadFile(goalsFile);

  return {
    entity,
    health,
    healthLabel,
    workflowCount: workflows.length,
    workflows,
    runsInPeriod: total,
    runsCompleted: completed,
    runsFailed: failed,
    pendingApprovals: pending,
    latestOutputs: outputs,
    goalsSummary: goals.slice(0, 400) || "No goals defined",
  };
}

function buildEmailHtml(
  entityReports: EntityReport[],
  period: string
): string {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const totalRuns = entityReports.reduce((s, e) => s + e.runsInPeriod, 0);
  const totalCompleted = entityReports.reduce(
    (s, e) => s + e.runsCompleted,
    0
  );
  const totalPending = entityReports.reduce(
    (s, e) => s + e.pendingApprovals,
    0
  );
  const successRate =
    totalRuns > 0 ? Math.round((totalCompleted / totalRuns) * 100) : 0;
  const activeCount = entityReports.filter((e) => e.runsInPeriod > 0).length;

  const healthIcon = (h: Health) =>
    h === "green"
      ? "&#9679;"  // green circle
      : h === "yellow"
        ? "&#9888;"  // warning
        : "&#10060;"; // red x

  const healthColor = (h: Health) =>
    h === "green" ? "#22c55e" : h === "yellow" ? "#eab308" : "#ef4444";

  const entityRows = entityReports
    .map(
      (e) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <span style="color: ${healthColor(e.health)}; font-size: 16px;">${healthIcon(e.health)}</span>
          <strong style="margin-left: 8px;">${e.entity}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${e.healthLabel}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${e.workflowCount}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${e.runsInPeriod}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${e.pendingApprovals}</td>
      </tr>`
    )
    .join("");

  const needsAttention = entityReports.filter((e) => e.health !== "green");
  const actionItems = needsAttention.length > 0
    ? `<div style="margin-top: 24px;">
        <h2 style="font-size: 16px; color: #111; margin-bottom: 12px;">Action Items</h2>
        <ul style="padding-left: 20px; color: #333;">
          ${needsAttention
            .map(
              (e) =>
                `<li style="margin-bottom: 6px;"><strong>${e.entity}</strong>: ${e.healthLabel}${
                  e.health === "red"
                    ? " — needs workflow runs configured"
                    : ""
                }</li>`
            )
            .join("")}
        </ul>
      </div>`
    : "";

  const goals = loadFile(path.join(CONTEXT_DIR, "goals.md"));
  const goalLines = goals
    .split("\n")
    .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("#"))
    .map((l) => `<li style="margin-bottom: 4px;">${l.replace(/^[-#\s]+/, "")}</li>`)
    .join("");

  return `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 22px;">Apex Brain Status Report</h1>
        <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">${now} UTC &middot; ${period} summary</p>
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <div style="flex: 1; background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #111;">${activeCount}/${entityReports.length}</div>
          <div style="font-size: 12px; color: #888; margin-top: 4px;">Active entities</div>
        </div>
        <div style="flex: 1; background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #111;">${totalRuns}</div>
          <div style="font-size: 12px; color: #888; margin-top: 4px;">Workflow runs</div>
        </div>
        <div style="flex: 1; background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #111;">${successRate}%</div>
          <div style="font-size: 12px; color: #888; margin-top: 4px;">Success rate</div>
        </div>
        <div style="flex: 1; background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: ${totalPending > 0 ? "#eab308" : "#111"};">${totalPending}</div>
          <div style="font-size: 12px; color: #888; margin-top: 4px;">Pending approvals</div>
        </div>
      </div>

      <h2 style="font-size: 16px; color: #111; margin-bottom: 12px;">Entity Status</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f4f4f5;">
            <th style="padding: 10px 12px; text-align: left;">Entity</th>
            <th style="padding: 10px 12px; text-align: left;">Status</th>
            <th style="padding: 10px 12px; text-align: center;">Workflows</th>
            <th style="padding: 10px 12px; text-align: center;">Runs</th>
            <th style="padding: 10px 12px; text-align: center;">Approvals</th>
          </tr>
        </thead>
        <tbody>
          ${entityRows}
        </tbody>
      </table>

      ${actionItems}

      ${
        goalLines
          ? `<div style="margin-top: 24px;">
              <h2 style="font-size: 16px; color: #111; margin-bottom: 12px;">Goal Tracker</h2>
              <ul style="padding-left: 20px; color: #333; font-size: 14px; line-height: 1.6;">
                ${goalLines}
              </ul>
            </div>`
          : ""
      }

      <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
        <p>Generated by Apex Brain. Reply to this email if anything needs immediate attention.</p>
      </div>
    </div>
  `;
}

// --- Main task ---

export const sendStatusReport = task({
  id: "send-status-report",
  maxDuration: 60,
  run: async (payload: {
    period?: "daily" | "weekly" | "monthly";
    recipientEmail?: string;
  }) => {
    const period = payload.period || "daily";
    const recipientEmail = payload.recipientEmail || "ahkapuria@gmail.com";

    // Determine lookback window
    const now = new Date();
    const sinceMap = { daily: 1, weekly: 7, monthly: 30 };
    const since = new Date(
      now.getTime() - sinceMap[period] * 24 * 60 * 60 * 1000
    );

    const runs = loadRunLog(since);
    const entities = getEntities();
    const entityReports = entities.map((e) => buildEntityReport(e, runs));

    // Build email
    const html = buildEmailHtml(entityReports, period);
    const subject = `Apex Brain ${period} report — ${now.toISOString().slice(0, 10)}`;

    // Save JSON report locally
    fs.mkdirSync(REPORT_DIR, { recursive: true });
    const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const reportFile = path.join(REPORT_DIR, `status_${period}_${ts}.json`);
    fs.writeFileSync(
      reportFile,
      JSON.stringify(
        {
          generated_at: now.toISOString(),
          period,
          entities: entityReports,
        },
        null,
        2
      )
    );

    // Send via Resend
    const resend = getResend();
    const result = await resend.emails.send({
      from: REVIEW_FROM_EMAIL,
      to: [recipientEmail],
      subject,
      html,
    });

    if (result.error) {
      console.error("Resend error:", JSON.stringify(result.error));
      return {
        sent: false,
        error: result.error,
        subject,
        recipientEmail,
        reportFile,
      };
    }

    console.log(`Status report sent to ${recipientEmail}: ${subject}`);
    return {
      sent: true,
      emailId: result.data?.id,
      subject,
      recipientEmail,
      reportFile,
      entityCount: entities.length,
      totalRuns: runs.length,
    };
  },
});
