import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ENV_PATH = path.resolve(process.cwd(), "..", "apex-brain", ".env");
const IS_VERCEL = !!process.env.VERCEL;

function parseEnvFile(): Record<string, string> {
  if (IS_VERCEL || !fs.existsSync(ENV_PATH)) return {};
  const content = fs.readFileSync(ENV_PATH, "utf-8");
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    vars[trimmed.slice(0, eqIndex).trim()] = trimmed.slice(eqIndex + 1).trim();
  }
  return vars;
}

function writeEnvFileLocal(vars: Record<string, string>) {
  if (!fs.existsSync(ENV_PATH)) {
    fs.writeFileSync(ENV_PATH, "", "utf-8");
  }
  const content = fs.readFileSync(ENV_PATH, "utf-8");
  const lines = content.split("\n");
  const existingKeys = new Set<string>();

  const updatedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) return line;
    const key = trimmed.slice(0, eqIndex).trim();
    if (key in vars) {
      existingKeys.add(key);
      return `${key}=${vars[key]}`;
    }
    return line;
  });

  for (const [key, value] of Object.entries(vars)) {
    if (!existingKeys.has(key)) updatedLines.push(`${key}=${value}`);
  }

  fs.writeFileSync(ENV_PATH, updatedLines.join("\n"), "utf-8");
  for (const [key, value] of Object.entries(vars)) {
    process.env[key] = value;
  }
}

async function setVercelEnvVars(vars: Record<string, string>): Promise<boolean> {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return false;

  for (const [key, value] of Object.entries(vars)) {
    try {
      // Try to create, if it exists, update
      const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key,
          value,
          type: "encrypted",
          target: ["production", "preview", "development"],
        }),
      });

      if (!res.ok) {
        // Might already exist, try PATCH
        const envs = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const envsData = await envs.json();
        const existing = envsData.envs?.find((e: { key: string }) => e.key === key);
        if (existing) {
          await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ value }),
          });
        }
      }
    } catch (e) {
      console.error(`Failed to set ${key} on Vercel:`, e);
    }
  }
  return true;
}

// GET: return which env vars are set
export async function GET() {
  // On Vercel, check process.env directly
  if (IS_VERCEL) {
    const allKeys = [
      "ANTHROPIC_API_KEY", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXTAUTH_SECRET",
      "LINKEDIN_ACCESS_TOKEN", "GOOGLE_ANALYTICS_ID", "GOOGLE_ANALYTICS_TOKEN",
      "GOOGLE_SEARCH_CONSOLE_SITE_URL", "SQUARE_ACCESS_TOKEN", "SQUARE_LOCATION_ID",
      "TWITTER_API_KEY", "TWITTER_API_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_SECRET",
      "INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID", "WAVEAPPS_API_TOKEN",
      "PRINTFUL_API_KEY", "VERCEL_TOKEN", "VERCEL_PROJECT_ID", "SMTP_USER", "SMTP_PASSWORD",
      "GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO",
    ];
    const status: Record<string, boolean> = {};
    for (const key of allKeys) {
      status[key] = !!(process.env[key] && process.env[key]!.length > 0);
    }
    return NextResponse.json({ status, mode: "vercel" });
  }

  const vars = parseEnvFile();
  const status: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(vars)) {
    status[key] = value.length > 0;
  }
  return NextResponse.json({ status, mode: "local" });
}

// POST: save new env vars
export async function POST(req: Request) {
  const body = await req.json();
  const { keys } = body as { keys: Record<string, string> };

  if (!keys || typeof keys !== "object") {
    return NextResponse.json({ error: "Send { keys: { VAR_NAME: value } }" }, { status: 400 });
  }

  if (IS_VERCEL) {
    const success = await setVercelEnvVars(keys);
    return NextResponse.json({
      saved: Object.keys(keys),
      mode: "vercel",
      message: success
        ? "Keys saved to Vercel. Redeploy to activate."
        : "Failed to save. Set VERCEL_TOKEN and VERCEL_PROJECT_ID first.",
    });
  }

  writeEnvFileLocal(keys);
  return NextResponse.json({
    saved: Object.keys(keys),
    mode: "local",
    message: "Keys saved to .env. Restart dev server to activate.",
  });
}
