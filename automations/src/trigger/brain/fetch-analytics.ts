import { task } from "@trigger.dev/sdk";

interface AnalyticsResult {
  source: string;
  period?: string;
  status?: string;
  message?: string;
  [key: string]: any;
}

async function fetchGA4(
  propertyId: string,
  token: string,
  days: number
): Promise<AnalyticsResult> {
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const payload = {
    dateRanges: [{ startDate: start, endDate: end }],
    metrics: [
      { name: "activeUsers" },
      { name: "screenPageViews" },
      { name: "sessions" },
      { name: "bounceRate" },
    ],
  };

  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    return {
      source: "ga4",
      status: "error",
      code: resp.status,
      message: await resp.text(),
    };
  }

  const data = await resp.json();
  const rows = data.rows || [];
  if (rows.length > 0) {
    const values = rows[0].metricValues || [];
    return {
      source: "ga4",
      period: `${start} to ${end}`,
      active_users: values[0]?.value ?? null,
      pageviews: values[1]?.value ?? null,
      sessions: values[2]?.value ?? null,
      bounce_rate: values[3]?.value ?? null,
    };
  }
  return { source: "ga4", period: `${start} to ${end}`, status: "no_rows" };
}

async function fetchLinkedIn(token: string): Promise<AnalyticsResult> {
  const url =
    "https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity";
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resp.ok) {
    return {
      source: "linkedin",
      status: "error",
      code: resp.status,
      message: await resp.text(),
    };
  }

  return { source: "linkedin", data: await resp.json() };
}

export const fetchAnalytics = task({
  id: "fetch-analytics",
  run: async (payload: {
    source?: "ga4" | "linkedin" | "all";
    days?: number;
  }) => {
    const source = payload.source || "all";
    const days = payload.days || 7;
    const results: AnalyticsResult[] = [];

    if (source === "ga4" || source === "all") {
      const gaId = process.env.GOOGLE_ANALYTICS_ID;
      const gaToken = process.env.GOOGLE_ANALYTICS_TOKEN;
      if (gaId && gaToken) {
        results.push(await fetchGA4(gaId, gaToken, days));
      } else {
        results.push({
          source: "ga4",
          status: "skipped",
          message: "GOOGLE_ANALYTICS_ID or GOOGLE_ANALYTICS_TOKEN not set",
        });
      }
    }

    if (source === "linkedin" || source === "all") {
      const liToken = process.env.LINKEDIN_ACCESS_TOKEN;
      if (liToken) {
        results.push(await fetchLinkedIn(liToken));
      } else {
        results.push({
          source: "linkedin",
          status: "skipped",
          message: "LINKEDIN_ACCESS_TOKEN not set",
        });
      }
    }

    console.log(
      `Fetched analytics: ${results.map((r) => `${r.source}=${r.status || "ok"}`).join(", ")}`
    );
    return results;
  },
});
