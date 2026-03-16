import Replicate from "replicate";
import https from "https";
import fs from "fs";

const client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const basePrompt = "stunning 24-year-old Indian woman, warm golden-brown skin, long dark hair, deep brown eyes, full lips, high cheekbones, elegant and confident, 4k, photorealistic";

const variations = [
  { id: "v3-side-profile", prompt: `${basePrompt}, side profile view, looking slightly left, golden hour sunlight, editorial portrait` },
  { id: "v4-laughing", prompt: `${basePrompt}, genuine laugh, eyes slightly crinkled, candid moment, soft indoor lighting, intimate` },
  { id: "v5-looking-down", prompt: `${basePrompt}, looking down thoughtfully, long lashes visible, moody natural light from window, close-up` },
  { id: "v6-outdoor", prompt: `${basePrompt}, outdoors, warm sunlight, slight wind in hair, relaxed smile, shallow depth of field, Dubai skyline blurred background` },
  { id: "v7-close-up", prompt: `${basePrompt}, extreme close-up on face, direct eye contact, minimal makeup, dewy skin, neutral background` },
  { id: "v8-over-shoulder", prompt: `${basePrompt}, looking back over shoulder, three-quarter view, long hair flowing, wearing an elegant top, luxury interior background` },
  { id: "v9-smirk", prompt: `${basePrompt}, slight smirk, confident, one eyebrow slightly raised, studio lighting, fashion portrait` },
  { id: "v10-morning", prompt: `${basePrompt}, no makeup, natural hair down, morning light, white sheets, relaxed sleepy expression, intimate iPhone selfie style` },
];

async function download(url, dest) {
  return new Promise((res, rej) => {
    const file = fs.createWriteStream(dest);
    https.get(url, r => { r.pipe(file); file.on("finish", () => { file.close(); res(); }); }).on("error", rej);
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];

for (const { id, prompt } of variations) {
  console.log(`Generating ${id}...`);
  const output = await client.run("black-forest-labs/flux-1.1-pro", {
    input: { prompt, width: 1024, height: 1024, output_format: "jpg", output_quality: 90, safety_tolerance: 2 }
  });
  const url = (Array.isArray(output) ? output[0] : output).toString();
  const dest = `../outputs/ai-influencer/profile/farah-${id}.jpg`;
  await download(url, dest);
  results.push(id);
  console.log(`✓ ${id}`);
  if (results.length < variations.length) await sleep(11000);
}

console.log("Done:", results.join(", "));
