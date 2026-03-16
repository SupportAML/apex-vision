import { task } from "@trigger.dev/sdk";
import {
  getInstagramToken,
  getInstagramAccountId,
  apiRequest,
  saveOutput,
  dateStamp,
} from "./config.js";

const GRAPH_API = "https://graph.instagram.com/v21.0";

interface PostImagePayload {
  imageUrl: string; // Must be a publicly accessible URL
  caption: string;
}

interface PostReelPayload {
  videoUrl: string; // Must be a publicly accessible URL
  caption: string;
  coverUrl?: string;
  shareToFeed?: boolean;
}

interface PostCarouselPayload {
  imageUrls: string[]; // 2-10 publicly accessible URLs
  caption: string;
}

interface PostResult {
  postId: string;
  permalink?: string;
  publishedAt: string;
}

// Wait for Instagram media container to finish processing
async function waitForContainer(
  containerId: string,
  token: string,
  maxWaitMs = 120000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const status = await apiRequest(
      `${GRAPH_API}/${containerId}?fields=status_code&access_token=${token}`
    );
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR") {
      throw new Error(`Container processing failed: ${JSON.stringify(status)}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Container processing timed out");
}

export const postImage = task({
  id: "influencer-post-image",
  maxDuration: 120,
  run: async (payload: PostImagePayload): Promise<PostResult> => {
    const token = getInstagramToken();
    const accountId = getInstagramAccountId();

    console.log("Creating image container...");

    // Step 1: Create media container
    const container = await apiRequest(`${GRAPH_API}/${accountId}/media`, {
      method: "POST",
      body: {
        image_url: payload.imageUrl,
        caption: payload.caption,
        access_token: token,
      },
    });

    // Step 2: Wait for processing
    await waitForContainer(container.id, token);

    // Step 3: Publish
    const published = await apiRequest(
      `${GRAPH_API}/${accountId}/media_publish`,
      {
        method: "POST",
        body: {
          creation_id: container.id,
          access_token: token,
        },
      }
    );

    const result: PostResult = {
      postId: published.id,
      publishedAt: new Date().toISOString(),
    };

    // Log the publish
    saveOutput(
      "analytics",
      `post_${dateStamp()}_image.json`,
      JSON.stringify({ ...result, caption: payload.caption }, null, 2)
    );

    console.log(`Published image: ${result.postId}`);
    return result;
  },
});

export const postReel = task({
  id: "influencer-post-reel",
  maxDuration: 180,
  run: async (payload: PostReelPayload): Promise<PostResult> => {
    const token = getInstagramToken();
    const accountId = getInstagramAccountId();

    console.log("Creating Reel container...");

    const containerBody: Record<string, any> = {
      media_type: "REELS",
      video_url: payload.videoUrl,
      caption: payload.caption,
      share_to_feed: payload.shareToFeed ?? true,
      access_token: token,
    };

    if (payload.coverUrl) {
      containerBody.cover_url = payload.coverUrl;
    }

    // Step 1: Create container
    const container = await apiRequest(`${GRAPH_API}/${accountId}/media`, {
      method: "POST",
      body: containerBody,
    });

    // Step 2: Wait for processing (videos take longer)
    await waitForContainer(container.id, token, 300000);

    // Step 3: Publish
    const published = await apiRequest(
      `${GRAPH_API}/${accountId}/media_publish`,
      {
        method: "POST",
        body: {
          creation_id: container.id,
          access_token: token,
        },
      }
    );

    const result: PostResult = {
      postId: published.id,
      publishedAt: new Date().toISOString(),
    };

    saveOutput(
      "analytics",
      `post_${dateStamp()}_reel.json`,
      JSON.stringify({ ...result, caption: payload.caption }, null, 2)
    );

    console.log(`Published Reel: ${result.postId}`);
    return result;
  },
});

export const postCarousel = task({
  id: "influencer-post-carousel",
  maxDuration: 180,
  run: async (payload: PostCarouselPayload): Promise<PostResult> => {
    const token = getInstagramToken();
    const accountId = getInstagramAccountId();

    console.log(`Creating carousel with ${payload.imageUrls.length} images...`);

    // Step 1: Create individual item containers
    const itemIds: string[] = [];
    for (const url of payload.imageUrls) {
      const item = await apiRequest(`${GRAPH_API}/${accountId}/media`, {
        method: "POST",
        body: {
          image_url: url,
          is_carousel_item: true,
          access_token: token,
        },
      });
      itemIds.push(item.id);
    }

    // Step 2: Create carousel container
    const carousel = await apiRequest(`${GRAPH_API}/${accountId}/media`, {
      method: "POST",
      body: {
        media_type: "CAROUSEL",
        children: itemIds.join(","),
        caption: payload.caption,
        access_token: token,
      },
    });

    // Step 3: Wait and publish
    await waitForContainer(carousel.id, token);

    const published = await apiRequest(
      `${GRAPH_API}/${accountId}/media_publish`,
      {
        method: "POST",
        body: {
          creation_id: carousel.id,
          access_token: token,
        },
      }
    );

    const result: PostResult = {
      postId: published.id,
      publishedAt: new Date().toISOString(),
    };

    saveOutput(
      "analytics",
      `post_${dateStamp()}_carousel.json`,
      JSON.stringify({ ...result, caption: payload.caption, imageCount: payload.imageUrls.length }, null, 2)
    );

    console.log(`Published carousel: ${result.postId}`);
    return result;
  },
});

// Combined task: auto-publish approved content
export const postToInstagram = task({
  id: "influencer-post-to-instagram",
  maxDuration: 300,
  run: async (payload: {
    type: "image" | "reel" | "carousel";
    imageUrl?: string;
    imageUrls?: string[];
    videoUrl?: string;
    coverUrl?: string;
    caption: string;
  }): Promise<PostResult> => {
    switch (payload.type) {
      case "image": {
        if (!payload.imageUrl) throw new Error("imageUrl required for image post");
        const imgResult = await postImage.triggerAndWait({
          imageUrl: payload.imageUrl,
          caption: payload.caption,
        });
        if (!imgResult.ok) throw new Error("Image post failed");
        return imgResult.output as PostResult;
      }

      case "reel": {
        if (!payload.videoUrl) throw new Error("videoUrl required for reel post");
        const reelResult = await postReel.triggerAndWait({
          videoUrl: payload.videoUrl,
          caption: payload.caption,
          coverUrl: payload.coverUrl,
        });
        if (!reelResult.ok) throw new Error("Reel post failed");
        return reelResult.output as PostResult;
      }

      case "carousel": {
        if (!payload.imageUrls?.length) throw new Error("imageUrls required for carousel");
        const carouselResult = await postCarousel.triggerAndWait({
          imageUrls: payload.imageUrls,
          caption: payload.caption,
        });
        if (!carouselResult.ok) throw new Error("Carousel post failed");
        return carouselResult.output as PostResult;
      }

      default:
        throw new Error(`Unknown post type: ${payload.type}`);
    }
  },
});
