import Replicate from "replicate";

const client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const output = await client.run("black-forest-labs/flux-1.1-pro", {
  input: {
    prompt: "Professional Instagram profile photo of a stunning 24-year-old Indian woman, warm golden-brown skin, long dark hair, deep brown eyes, full lips, high cheekbones, elegant and confident expression, soft natural lighting, shallow depth of field, clean neutral background, editorial fashion photography style, 4k, photorealistic",
    width: 1024,
    height: 1024,
    output_format: "jpg",
    output_quality: 90,
    safety_tolerance: 2
  }
});

const url = Array.isArray(output) ? output[0] : output;
console.log(url.toString());
