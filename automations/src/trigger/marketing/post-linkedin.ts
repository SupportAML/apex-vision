import { task } from "@trigger.dev/sdk";

/**
 * Post content to LinkedIn using the LinkedIn API v2.
 * Mirrors the logic from apex-brain/tools/post_to_linkedin.py in TypeScript.
 */
export const postLinkedin = task({
  id: "marketing-post-linkedin",
  maxDuration: 60,
  run: async (payload: {
    entity: string;
    text: string;
    imageUrl?: string;
  }): Promise<{ postUrl?: string; postId?: string }> => {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("LINKEDIN_ACCESS_TOKEN not configured");
    }

    // Get the user's LinkedIn profile ID
    const profileResp = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResp.ok) {
      const err = await profileResp.text();
      throw new Error(`Failed to get LinkedIn profile: ${profileResp.status} ${err}`);
    }

    const profile = await profileResp.json();
    const authorUrn = `urn:li:person:${profile.sub}`;

    // Create the post
    const postBody: any = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: payload.text,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const postResp = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    });

    if (!postResp.ok) {
      const err = await postResp.text();
      throw new Error(`LinkedIn post failed: ${postResp.status} ${err}`);
    }

    const postId = postResp.headers.get("x-restli-id") || "";
    const postUrl = postId
      ? `https://www.linkedin.com/feed/update/${postId}`
      : undefined;

    console.log(`Posted to LinkedIn for ${payload.entity}: ${postId}`);
    return { postUrl, postId };
  },
});
