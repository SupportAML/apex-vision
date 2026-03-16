import { task } from "@trigger.dev/sdk";
import {
  getKlingToken,
  apiRequest,
  downloadFile,
  timestamp,
  REELS_DIR,
} from "./config.js";
import * as path from "path";
import * as fs from "fs";

// Kling LipSync API - sync video to audio
// Segments into <45s clips for accuracy, then stitches

const KLING_API = "https://api.klingai.com/v1";

interface LipSyncPayload {
  videoPath: string; // Local path or URL to source video
  audioPath: string; // Local path or URL to audio file
  label?: string;
}

interface LipSyncResult {
  localPath: string;
  originalVideo: string;
  audioUsed: string;
}

async function uploadToKling(filePath: string, token: string): Promise<string> {
  // Read file and upload for processing
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1);
  const mimeType = ext === "mp4" ? "video/mp4" : ext === "mp3" ? "audio/mpeg" : `audio/${ext}`;

  const formData = new FormData();
  formData.append("file", new Blob([fileBuffer], { type: mimeType }), path.basename(filePath));

  const resp = await fetch(`${KLING_API}/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Upload failed (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  return data.data?.url || data.url;
}

async function pollKlingTask(
  taskId: string,
  token: string,
  maxWaitMs = 600000
): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const result = await apiRequest(`${KLING_API}/lip-sync/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const status = result.data?.status;
    if (status === "completed" || status === "succeed") return result.data;
    if (status === "failed") {
      throw new Error(`Lip sync failed: ${result.data?.error || "unknown"}`);
    }

    await new Promise((r) => setTimeout(r, 10000));
  }
  throw new Error(`Lip sync timed out after ${maxWaitMs}ms`);
}

export const lipSync = task({
  id: "influencer-lip-sync",
  maxDuration: 300,
  run: async (payload: LipSyncPayload): Promise<LipSyncResult> => {
    const token = getKlingToken();
    const ts = timestamp();
    const label = payload.label || "synced";

    console.log(`Starting lip sync: ${label}`);

    // Upload video and audio if they're local paths
    let videoUrl = payload.videoPath;
    let audioUrl = payload.audioPath;

    if (fs.existsSync(payload.videoPath)) {
      console.log("Uploading video to Kling...");
      videoUrl = await uploadToKling(payload.videoPath, token);
    }

    if (fs.existsSync(payload.audioPath)) {
      console.log("Uploading audio to Kling...");
      audioUrl = await uploadToKling(payload.audioPath, token);
    }

    // Create lip sync task
    const createResp = await apiRequest(`${KLING_API}/lip-sync`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: {
        video_url: videoUrl,
        audio_url: audioUrl,
        model: "kling-lip-sync-v1",
      },
      timeout: 30000,
    });

    const taskId = createResp.data?.task_id;
    if (!taskId) throw new Error(`No task_id: ${JSON.stringify(createResp)}`);

    // Poll until complete
    const result = await pollKlingTask(taskId, token);

    // Download result
    const outputUrl = result.works?.[0]?.resource?.resource || result.video_url;
    if (!outputUrl) throw new Error(`No output URL: ${JSON.stringify(result)}`);

    const filename = `${label}_lipsync_${ts}.mp4`;
    const localPath = path.join(REELS_DIR, filename);
    await downloadFile(outputUrl, localPath);

    console.log(`Lip sync complete: ${filename}`);

    return {
      localPath,
      originalVideo: payload.videoPath,
      audioUsed: payload.audioPath,
    };
  },
});
