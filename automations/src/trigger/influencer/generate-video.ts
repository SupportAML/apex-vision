import { task } from "@trigger.dev/sdk";
import {
  getKlingToken,
  apiRequest,
  downloadFile,
  timestamp,
  REELS_DIR,
} from "./config.js";
import * as path from "path";

// Kling 3.0 API for video generation
// Supports image-to-video, text-to-video, and multi-shot sequences

const KLING_API = "https://api.klingai.com/v1";

type VideoMode = "image-to-video" | "text-to-video";

interface GenerateVideoPayload {
  mode: VideoMode;
  prompt: string;
  referenceImageUrl?: string; // Required for image-to-video
  duration?: number; // seconds (5, 10, 15)
  aspectRatio?: string; // "9:16" for Reels
  negativePrompt?: string;
  seed?: number;
  label?: string;
}

interface GenerateVideoResult {
  videoUrl: string;
  localPath: string;
  duration: number;
  mode: VideoMode;
}

async function pollKlingTask(
  taskId: string,
  token: string,
  maxWaitMs = 600000
): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const result = await apiRequest(`${KLING_API}/videos/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (result.data?.status === "completed" || result.data?.status === "succeed") {
      return result.data;
    }
    if (result.data?.status === "failed") {
      throw new Error(`Kling task failed: ${result.data.error || "unknown"}`);
    }

    // Kling videos take 2-5 minutes, poll every 10 seconds
    await new Promise((r) => setTimeout(r, 10000));
  }
  throw new Error(`Kling task timed out after ${maxWaitMs}ms`);
}

export const generateVideo = task({
  id: "influencer-generate-video",
  maxDuration: 300,
  run: async (payload: GenerateVideoPayload): Promise<GenerateVideoResult> => {
    const token = getKlingToken();
    const ts = timestamp();
    const label = payload.label || "reel";

    const body: Record<string, any> = {
      prompt: payload.prompt,
      duration: payload.duration || 5,
      aspect_ratio: payload.aspectRatio || "9:16",
      model: "kling-v3",
    };

    if (payload.negativePrompt) {
      body.negative_prompt = payload.negativePrompt;
    }
    if (payload.seed) {
      body.seed = payload.seed;
    }

    let endpoint: string;
    if (payload.mode === "image-to-video" && payload.referenceImageUrl) {
      endpoint = `${KLING_API}/videos/image-to-video`;
      body.image_url = payload.referenceImageUrl;
    } else {
      endpoint = `${KLING_API}/videos/text-to-video`;
    }

    console.log(`Generating video: ${label} (${payload.mode}, ${body.duration}s)`);

    const createResp = await apiRequest(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
      timeout: 30000,
    });

    const taskId = createResp.data?.task_id;
    if (!taskId) throw new Error(`No task_id returned: ${JSON.stringify(createResp)}`);

    // Poll until complete
    const result = await pollKlingTask(taskId, token);

    // Download the video
    const videoUrl = result.works?.[0]?.resource?.resource || result.video_url;
    if (!videoUrl) throw new Error(`No video URL in result: ${JSON.stringify(result)}`);

    const filename = `${label}_${ts}.mp4`;
    const localPath = path.join(REELS_DIR, filename);
    await downloadFile(videoUrl, localPath);
    console.log(`Downloaded video: ${filename}`);

    return {
      videoUrl,
      localPath,
      duration: payload.duration || 5,
      mode: payload.mode,
    };
  },
});

// Generate multiple video clips for a single Reel (multi-scene)
export const generateVideoMultiShot = task({
  id: "influencer-generate-video-multishot",
  maxDuration: 300,
  run: async (payload: {
    scenes: GenerateVideoPayload[];
    reelLabel: string;
  }): Promise<{ clips: GenerateVideoResult[]; reelLabel: string }> => {
    const clips: GenerateVideoResult[] = [];

    // Generate scenes in parallel (max 3 concurrent)
    const batchSize = 3;
    for (let i = 0; i < payload.scenes.length; i += batchSize) {
      const batch = payload.scenes.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((scene, idx) =>
          generateVideo.triggerAndWait({
            ...scene,
            label: `${payload.reelLabel}_scene${i + idx}`,
          })
        )
      );
      for (const r of results) {
        if (r.ok && r.output) clips.push(r.output);
      }
    }

    console.log(
      `Multi-shot complete: ${clips.length}/${payload.scenes.length} scenes for "${payload.reelLabel}"`
    );
    return { clips, reelLabel: payload.reelLabel };
  },
});
