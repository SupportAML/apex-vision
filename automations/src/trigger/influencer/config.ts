import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { BRAIN_ROOT } from "../outputs/config.js";

// --- API Clients ---

export function getClaude() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// --- Env helpers ---

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export function getReplicateToken() {
  return requireEnv("REPLICATE_API_TOKEN");
}

export function getKlingToken() {
  return requireEnv("KLING_API_KEY");
}

export function getElevenLabsToken() {
  return requireEnv("ELEVENLABS_API_KEY");
}

export function getInstagramToken() {
  return requireEnv("INSTAGRAM_ACCESS_TOKEN");
}

export function getInstagramAccountId() {
  return requireEnv("INSTAGRAM_ACCOUNT_ID");
}

// --- Paths ---

export const ENTITY = "ai-influencer";
export const ENTITY_DIR = path.join(BRAIN_ROOT, "entities", ENTITY);
export const OUTPUT_DIR = path.join(BRAIN_ROOT, "outputs", ENTITY);
export const IMAGES_DIR = path.join(OUTPUT_DIR, "instagram", "images");
export const REELS_DIR = path.join(OUTPUT_DIR, "instagram", "reels");
export const SCRIPTS_DIR = path.join(OUTPUT_DIR, "scripts");
export const AUDIO_DIR = path.join(OUTPUT_DIR, "audio");
export const ANALYTICS_DIR = path.join(OUTPUT_DIR, "analytics");

// Ensure output dirs exist (local only — cloud uses GitHub API for file ops)
for (const dir of [IMAGES_DIR, REELS_DIR, SCRIPTS_DIR, AUDIO_DIR, ANALYTICS_DIR]) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch { /* no-op in cloud */ }
}

// --- File helpers ---

export function loadEntityFile(filename: string): string {
  try {
    return fs.readFileSync(path.join(ENTITY_DIR, filename), "utf-8");
  } catch {
    return "";
  }
}

export function saveOutput(subdir: string, filename: string, data: Buffer | string): string {
  const dir = path.join(OUTPUT_DIR, subdir);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, data);
  return filePath;
}

export function dateStamp(): string {
  return new Date().toISOString().split("T")[0];
}

export function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

// --- HTTP helper for external APIs ---

export async function apiRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
  } = {}
): Promise<any> {
  const { method = "GET", headers = {}, body, timeout = 120000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const resp = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`API ${method} ${url} failed (${resp.status}): ${text}`);
    }

    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return resp.json();
    }
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

// --- Download binary (images, videos, audio) ---

export async function downloadFile(url: string, destPath: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Download failed (${resp.status}): ${url}`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buffer);
  return destPath;
}
