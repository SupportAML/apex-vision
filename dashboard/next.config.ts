import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Load env vars from the parent apex-brain/.env for local dev.
// On Vercel, env vars are set in the dashboard — this is a no-op.
const localEnvPath = path.resolve(__dirname, "..", "apex-brain", ".env");
if (fs.existsSync(localEnvPath)) {
  // Dynamic import to avoid build issues if dotenv isn't available
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dotenv = require("dotenv");
    dotenv.config({ path: localEnvPath });
  } catch {
    // dotenv not available, skip
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
