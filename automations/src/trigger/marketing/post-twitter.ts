import { task } from "@trigger.dev/sdk";
import { createHmac, randomBytes } from "crypto";

/**
 * Post a tweet to Twitter/X using OAuth 1.0a.
 * Mirrors the logic from apex-brain/tools/post_to_twitter.py in TypeScript.
 */
export const postTwitter = task({
  id: "marketing-post-twitter",
  maxDuration: 60,
  run: async (payload: {
    entity: string;
    text: string;
  }): Promise<{ tweetUrl?: string; tweetId?: string }> => {
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      throw new Error("Twitter API credentials not fully configured");
    }

    // Truncate to 280 chars if needed
    const text = payload.text.length > 280
      ? payload.text.slice(0, 277) + "..."
      : payload.text;

    // Build OAuth 1.0a signature
    const url = "https://api.twitter.com/2/tweets";
    const method = "POST";
    const nonce = randomBytes(16).toString("hex");
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: apiKey,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp,
      oauth_token: accessToken,
      oauth_version: "1.0",
    };

    // Create signature base string
    const paramString = Object.keys(oauthParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`)
      .join("&");

    const signatureBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
    const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessSecret)}`;
    const signature = createHmac("sha1", signingKey)
      .update(signatureBase)
      .digest("base64");

    oauthParams.oauth_signature = signature;

    // Build Authorization header
    const authHeader =
      "OAuth " +
      Object.keys(oauthParams)
        .sort()
        .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
        .join(", ");

    const resp = await fetch(url, {
      method,
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Twitter post failed: ${resp.status} ${err}`);
    }

    const data = await resp.json();
    const tweetId = data.data?.id;
    const tweetUrl = tweetId
      ? `https://x.com/i/status/${tweetId}`
      : undefined;

    console.log(`Posted tweet for ${payload.entity}: ${tweetId}`);
    return { tweetUrl, tweetId };
  },
});
