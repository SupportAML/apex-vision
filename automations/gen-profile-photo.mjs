import Replicate from "replicate";

const client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const output = await client.run("black-forest-labs/flux-1.1-pro", {
  input: {
    prompt: "Instagram profile photo of a beautiful 28-year-old Indian woman, warm medium-brown skin with natural texture and subtle imperfections, long dark hair, large expressive dark brown eyes, defined brows, broader nose, full lips, strong cheekbones, distinctly South Asian features, curvy figure with fuller bust, confident and warm expression, soft natural window lighting, shallow depth of field, clean neutral background, candid portrait photography style, 4k, photorealistic, not airbrushed",
    width: 1024,
    height: 1024,
    output_format: "jpg",
    output_quality: 90,
    safety_tolerance: 2
  }
});

const url = Array.isArray(output) ? output[0] : output;
console.log(url.toString());
