import { task } from "@trigger.dev/sdk";

const USER_AGENT = "ApexBrain/1.0";

interface TrendingRepo {
  owner: string;
  name: string;
  url: string;
  stars_today?: number;
  description?: string;
}

async function scrapeGitHubTrending(
  language = "",
  since = "daily"
): Promise<TrendingRepo[]> {
  const url = `https://github.com/trending/${language}?since=${since}`;
  const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!resp.ok) return [];

  const html = await resp.text();
  const repos: TrendingRepo[] = [];

  // Match repo links inside h2.h3 tags
  const repoPattern = /<h2 class="h3[^"]*">\s*<a href="(\/[^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = repoPattern.exec(html)) !== null) {
    const path = match[1].trim();
    const parts = path.replace(/^\//, "").split("/");
    if (parts.length === 2) {
      repos.push({
        owner: parts[0],
        name: parts[1],
        url: `https://github.com${path}`,
      });
    }
  }

  // Extract stars today
  const starPattern = /([\d,]+)\s+stars\s+today/g;
  let starMatch: RegExpExecArray | null;
  let i = 0;
  while ((starMatch = starPattern.exec(html)) !== null && i < repos.length) {
    repos[i].stars_today = parseInt(starMatch[1].replace(/,/g, ""), 10);
    i++;
  }

  return repos.slice(0, 25);
}

async function scrapeTrendshift(): Promise<TrendingRepo[]> {
  const url =
    "https://trendshift.io/api/repositories?language=&since=daily";
  const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!resp.ok) return [];

  const data: any[] = await resp.json();
  return data.slice(0, 25).map((r) => ({
    owner: r.owner,
    name: r.name,
    url: `https://github.com/${r.owner}/${r.name}`,
    stars_today: r.stars,
    description: r.description || "",
  }));
}

export const scrapeTrending = task({
  id: "scrape-trending",
  run: async (payload: {
    source?: "github" | "trendshift" | "all";
    language?: string;
    since?: "daily" | "weekly" | "monthly";
  }) => {
    const source = payload.source || "all";
    const results: Record<string, TrendingRepo[]> = {};

    if (source === "github" || source === "all") {
      results.github_trending = await scrapeGitHubTrending(
        payload.language || "",
        payload.since || "daily"
      );
    }
    if (source === "trendshift" || source === "all") {
      results.trendshift = await scrapeTrendshift();
    }

    console.log(
      `Scraped trending: ${Object.entries(results)
        .map(([k, v]) => `${k}=${v.length}`)
        .join(", ")}`
    );
    return results;
  },
});
