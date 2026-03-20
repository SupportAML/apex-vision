import { task } from "@trigger.dev/sdk";

// --- Types ---

export interface RawProspect {
  source: string;
  name: string;
  type: "hospital" | "law_firm" | "clinic" | "business";
  website?: string;
  email?: string;
  phone?: string;
  location: string;
  state?: string;
  specialty?: string;
  bedCount?: number;
  practiceAreas?: string[];
  url: string;
}

// --- Hospital scrapers (for NLC / ApexMedLaw) ---

/**
 * Scrape CMS Provider of Services data for hospitals.
 * Uses the CMS public dataset API for active hospitals.
 */
async function scrapeHospitals(state?: string): Promise<RawProspect[]> {
  try {
    // CMS Medicare Provider data API
    const stateFilter = state ? `&state=${state}` : "";
    const url = `https://data.cms.gov/provider-data/api/1/datastore/query/xubh-q36u/0?limit=100&offset=0&conditions[0][property]=provider_type&conditions[0][value]=Hospital${stateFilter}`;

    const resp = await fetch(url, {
      headers: { "User-Agent": "ApexBrain/1.0 (Healthcare Marketing)" },
    });

    if (!resp.ok) {
      console.log(`CMS API returned ${resp.status}, trying fallback approach`);
      return await scrapeHospitalsFallback(state);
    }

    const data = await resp.json();
    const leads: RawProspect[] = [];

    if (data?.results) {
      for (const row of data.results) {
        leads.push({
          source: "cms_provider",
          name: row.provider_name || row.facility_name || "Unknown Hospital",
          type: "hospital",
          location: `${row.city || ""}, ${row.state || ""}`.trim(),
          state: row.state,
          phone: row.phone_number || undefined,
          website: undefined, // CMS doesn't always include websites
          url: "https://data.cms.gov/provider-data/",
        });
      }
    }

    console.log(`CMS Hospitals: found ${leads.length} prospects`);
    return leads;
  } catch (err) {
    console.error("Hospital scraper failed:", err);
    return await scrapeHospitalsFallback(state);
  }
}

/** Fallback hospital scraper using a simpler data source */
async function scrapeHospitalsFallback(state?: string): Promise<RawProspect[]> {
  try {
    // Use the AHA hospital database API as a fallback
    const url = `https://data.medicare.gov/api/views/xubh-q36u/rows.json?accessType=DOWNLOAD`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "ApexBrain/1.0" },
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) return [];

    const data = await resp.json();
    const leads: RawProspect[] = [];

    // Parse the CSV-like JSON format
    if (data?.data) {
      for (const row of data.data.slice(0, 200)) {
        const facilityName = row[8] || "";
        const city = row[10] || "";
        const rowState = row[11] || "";

        if (state && rowState !== state) continue;

        leads.push({
          source: "medicare",
          name: facilityName,
          type: "hospital",
          location: `${city}, ${rowState}`,
          state: rowState,
          url: "https://data.medicare.gov/",
        });
      }
    }

    console.log(`Medicare fallback: found ${leads.length} hospitals`);
    return leads;
  } catch (err) {
    console.error("Hospital fallback scraper failed:", err);
    return [];
  }
}

// --- Law firm scrapers (for NLC) ---

/**
 * Search for law firms specializing in medical malpractice / personal injury.
 * Uses publicly available directory data.
 */
async function scrapeLawFirms(state?: string): Promise<RawProspect[]> {
  const leads: RawProspect[] = [];

  try {
    // Use Google Custom Search API if available, otherwise use directory scraping
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_KEY;
    const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX;

    if (apiKey && cx) {
      const queries = [
        "medical malpractice attorney",
        "personal injury lawyer medical",
        "neurology malpractice law firm",
      ];

      for (const query of queries) {
        const stateQuery = state ? ` ${state}` : "";
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query + stateQuery)}&num=10`;

        try {
          const resp = await fetch(url);
          if (!resp.ok) continue;
          const data = await resp.json();

          for (const item of data.items || []) {
            leads.push({
              source: "google_search",
              name: item.title?.replace(/ - .*$/, "").trim() || "Law Firm",
              type: "law_firm",
              website: item.link,
              location: state || "US",
              practiceAreas: ["medical malpractice", "personal injury"],
              url: item.link || "",
            });
          }
        } catch {
          // Individual query may fail
        }
      }
    }

    console.log(`Law firms: found ${leads.length} prospects`);
    return leads;
  } catch (err) {
    console.error("Law firm scraper failed:", err);
    return [];
  }
}

// --- Master scrape function ---

export interface ProspectScrapeResults {
  prospects: RawProspect[];
  sourceCounts: Record<string, number>;
  errors: string[];
}

async function scrapeAllProspects(
  entity: string,
  states?: string[]
): Promise<ProspectScrapeResults> {
  const errors: string[] = [];
  const allProspects: RawProspect[] = [];
  const sourceCounts: Record<string, number> = {};

  // Entity-specific scraping strategy
  const scrapers: Promise<RawProspect[]>[] = [];

  if (entity === "nlc" || entity === "apexmedlaw") {
    // Scrape hospitals and law firms
    for (const state of states || ["NY", "CA", "TX", "FL", "IL", "PA", "OH"]) {
      scrapers.push(scrapeHospitals(state));
    }
    scrapers.push(scrapeLawFirms());
  }

  const results = await Promise.allSettled(scrapers);

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      const prospects = result.value;
      allProspects.push(...prospects);
      for (const p of prospects) {
        sourceCounts[p.source] = (sourceCounts[p.source] || 0) + 1;
      }
    } else {
      errors.push(`Scraper ${i}: ${result.reason}`);
    }
  });

  // Deduplicate by name
  const seen = new Set<string>();
  const unique = allProspects.filter((p) => {
    const key = p.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(
    `Total scraped: ${unique.length} unique prospects from ${Object.entries(sourceCounts).map(([k, v]) => `${k}=${v}`).join(", ")}`
  );

  return { prospects: unique, sourceCounts, errors };
}

// --- Trigger.dev task ---

export const prospectScraper = task({
  id: "marketing-prospect-scraper",
  maxDuration: 300,
  run: async (payload: {
    entity: string;
    states?: string[];
  }): Promise<ProspectScrapeResults> => {
    return scrapeAllProspects(payload.entity, payload.states);
  },
});
