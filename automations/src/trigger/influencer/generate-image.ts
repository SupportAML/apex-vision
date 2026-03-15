import { task } from "@trigger.dev/sdk";
import {
  getReplicateToken,
  apiRequest,
  downloadFile,
  saveOutput,
  timestamp,
  IMAGES_DIR,
} from "./config.js";
import * as path from "path";

const REPLICATE_API = "https://api.replicate.com/v1";

// Flux 2 Pro via Replicate for character-consistent image generation
// Uses LoRA weights for character lock once trained

interface GenerateImagePayload {
  prompt: string;
  negativePrompt?: string;
  loraUrl?: string; // URL to trained LoRA weights
  loraScale?: number; // 0-1, how strongly to apply LoRA
  aspectRatio?: string; // "4:5" for Instagram portrait
  numOutputs?: number;
  seed?: number;
  label?: string; // descriptive label for filename
}

interface GenerateImageResult {
  images: { url: string; localPath: string }[];
  model: string;
  prompt: string;
}

async function pollPrediction(
  predictionId: string,
  token: string,
  maxWaitMs = 300000
): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const result = await apiRequest(
      `${REPLICATE_API}/predictions/${predictionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (result.status === "succeeded") return result;
    if (result.status === "failed" || result.status === "canceled") {
      throw new Error(`Prediction ${result.status}: ${result.error || "unknown"}`);
    }

    // Wait 2 seconds between polls
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Prediction timed out after ${maxWaitMs}ms`);
}

export const generateImage = task({
  id: "influencer-generate-image",
  maxDuration: 300,
  run: async (payload: GenerateImagePayload): Promise<GenerateImageResult> => {
    const token = getReplicateToken();
    const ts = timestamp();
    const label = payload.label || "image";

    // Build Flux input
    const input: Record<string, any> = {
      prompt: payload.prompt,
      aspect_ratio: payload.aspectRatio || "4:5",
      num_outputs: payload.numOutputs || 1,
      output_format: "png",
      output_quality: 95,
    };

    if (payload.negativePrompt) {
      input.negative_prompt = payload.negativePrompt;
    }

    if (payload.seed) {
      input.seed = payload.seed;
    }

    // Use Flux 2 Pro with optional LoRA
    let model = "black-forest-labs/flux-pro";
    if (payload.loraUrl) {
      // When using a trained LoRA, use Flux Dev with LoRA support
      model = "lucataco/flux-dev-lora";
      input.hf_lora = payload.loraUrl;
      input.lora_scale = payload.loraScale ?? 0.8;
    }

    console.log(`Generating image: ${label} (model: ${model})`);

    // Create prediction
    const prediction = await apiRequest(`${REPLICATE_API}/predictions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: { version: undefined, model, input },
    });

    // Poll until complete
    const result = await pollPrediction(prediction.id, token);

    // Download generated images
    const outputs = Array.isArray(result.output) ? result.output : [result.output];
    const images: { url: string; localPath: string }[] = [];

    for (let i = 0; i < outputs.length; i++) {
      const url = outputs[i];
      const filename = `${label}_${ts}_${i}.png`;
      const localPath = path.join(IMAGES_DIR, filename);
      await downloadFile(url, localPath);
      images.push({ url, localPath });
      console.log(`Downloaded: ${filename}`);
    }

    return { images, model, prompt: payload.prompt };
  },
});

// Batch generate multiple images from different prompts (for carousel, consistency tests, etc.)
export const generateImageBatch = task({
  id: "influencer-generate-image-batch",
  maxDuration: 300,
  run: async (payload: {
    prompts: GenerateImagePayload[];
  }): Promise<{ results: GenerateImageResult[] }> => {
    const results: GenerateImageResult[] = [];

    // Run prompts in parallel (max 4 concurrent to avoid rate limits)
    const batchSize = 4;
    for (let i = 0; i < payload.prompts.length; i += batchSize) {
      const batch = payload.prompts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((p) => generateImage.triggerAndWait(p))
      );
      for (const r of batchResults) {
        if (r.ok && r.output) results.push(r.output);
      }
    }

    console.log(`Batch complete: ${results.length}/${payload.prompts.length} succeeded`);
    return { results };
  },
});
