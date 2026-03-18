import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { BRAIN_ROOT, getResend } from "../outputs/config.js";

// --- Entity ---

export const ENTITY = "days-inn";
export const ENTITY_DIR = path.join(BRAIN_ROOT, "entities", ENTITY);
export const OUTPUT_DIR = path.join(BRAIN_ROOT, "outputs", ENTITY);
export const LEADS_DIR = path.join(OUTPUT_DIR, "leads");

// Ensure output dirs exist
for (const dir of [LEADS_DIR]) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* no-op in cloud */
  }
}

// --- Recipients ---

export const DIGEST_RECIPIENTS = [
  "hkapuria@gmail.com",
  "ahkapuria@gmail.com",
];

export const REVIEW_FROM_EMAIL =
  process.env.REVIEW_FROM_EMAIL || "review@updates.apexmedlaw.com";

// --- API Clients ---

export function getClaude() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export { getResend };

// --- File helpers ---

export function loadEntityFile(filename: string): string {
  try {
    return fs.readFileSync(path.join(ENTITY_DIR, filename), "utf-8");
  } catch {
    return "";
  }
}

export function saveOutput(
  filename: string,
  data: string
): string {
  fs.mkdirSync(LEADS_DIR, { recursive: true });
  const filePath = path.join(LEADS_DIR, filename);
  fs.writeFileSync(filePath, data);
  return filePath;
}

export function dateStamp(): string {
  return new Date().toISOString().split("T")[0];
}

export function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

// --- HTTP helper ---

const USER_AGENT = "ApexBrain/1.0 (Days Inn Cambridge Lead Gen)";

export async function fetchUrl(
  url: string,
  options: { timeout?: number; headers?: Record<string, string> } = {}
): Promise<string> {
  const { timeout = 30000, headers = {} } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, ...headers },
      signal: controller.signal,
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} from ${url}`);
    }
    return resp.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson(
  url: string,
  options: { timeout?: number; headers?: Record<string, string> } = {}
): Promise<any> {
  const text = await fetchUrl(url, options);
  return JSON.parse(text);
}
