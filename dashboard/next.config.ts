import type { NextConfig } from "next";
import dotenv from "dotenv";
import path from "path";

// Load env vars from the parent apex-brain/.env so the dashboard
// picks up ANTHROPIC_API_KEY and any future keys added there.
dotenv.config({ path: path.resolve(__dirname, "..", "apex-brain", ".env") });

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
