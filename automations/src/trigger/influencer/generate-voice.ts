import { task } from "@trigger.dev/sdk";
import {
  getElevenLabsToken,
  apiRequest,
  downloadFile,
  timestamp,
  AUDIO_DIR,
} from "./config.js";
import * as path from "path";
import * as fs from "fs";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

interface GenerateVoicePayload {
  text: string;
  voiceId?: string; // Custom cloned voice ID, or use default
  stability?: number; // 0-1, lower = more expressive
  similarityBoost?: number; // 0-1, higher = more like reference
  style?: number; // 0-1, higher = more expressive style
  label?: string;
}

interface GenerateVoiceResult {
  localPath: string;
  text: string;
  voiceId: string;
  durationEstimate: number; // rough estimate in seconds
}

export const generateVoice = task({
  id: "influencer-generate-voice",
  maxDuration: 120,
  run: async (payload: GenerateVoicePayload): Promise<GenerateVoiceResult> => {
    const token = getElevenLabsToken();
    const ts = timestamp();
    const label = payload.label || "voice";

    // Use configured voice or fallback
    const voiceId = payload.voiceId || process.env.ELEVENLABS_VOICE_ID || "default";

    console.log(`Generating voice: ${label} (${payload.text.length} chars)`);

    const resp = await fetch(`${ELEVENLABS_API}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": token,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: payload.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: payload.stability ?? 0.5,
          similarity_boost: payload.similarityBoost ?? 0.75,
          style: payload.style ?? 0.3,
          use_speaker_boost: true,
        },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`ElevenLabs failed (${resp.status}): ${errText}`);
    }

    const buffer = Buffer.from(await resp.arrayBuffer());
    const filename = `${label}_${ts}.mp3`;
    const localPath = path.join(AUDIO_DIR, filename);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, buffer);

    // Rough duration estimate: ~150 words per minute, ~5 chars per word
    const wordCount = payload.text.split(/\s+/).length;
    const durationEstimate = Math.ceil((wordCount / 150) * 60);

    console.log(`Generated voice: ${filename} (~${durationEstimate}s)`);

    return { localPath, text: payload.text, voiceId, durationEstimate };
  },
});
