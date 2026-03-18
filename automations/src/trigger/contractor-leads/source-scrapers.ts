import { fetchUrl, fetchJson } from "./config.js";

// --- Types ---

export interface RawLead {
  source: string;
  companyName?: string;
  projectTitle: string;
  projectDescription: string;
  location: string;
  county?: string;
  estimatedValue?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  awardDate?: string;
  url: string;
}

// Target counties within 50-75 miles of Cambridge, OH
const TARGET_COUNTIES = [
  "guernsey",
  "belmont",
  "noble",
  "muskingum",
  "tuscarawas",
  "harrison",
  "monroe",
  "coshocton",
  "morgan",
  "washington",
  "jefferson",
  "carroll",
  "columbiana",
];

function matchesTargetArea(text: string): boolean {
  const lower = text.toLowerCase();
  return TARGET_COUNTIES.some((c) => lower.includes(c)) ||
    lower.includes("cambridge") ||
    lower.includes("district 11") ||
    lower.includes("dist. 11") ||
    lower.includes("dist 11");
}

// --- ODOT: Ohio DOT Contract Lettings ---

export async function scrapeODOT(): Promise<RawLead[]> {
  try {
    // ODOT publishes upcoming lettings and recent awards
    const url =
      "https://www.dot.state.oh.us/Divisions/ContractAdmin/Contracts/Pages/upcoming-projects-overview.aspx";
    const html = await fetchUrl(url);
    const leads: RawLead[] = [];

    // Parse project rows from the HTML table
    // ODOT tables have: Project, County, Description, Est. Cost, Contractor
    const rowPattern =
      /<tr[^>]*>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/gi;
    let match: RegExpExecArray | null;
    while ((match = rowPattern.exec(html)) !== null) {
      const [, col1, col2, col3, col4] = match.map((m) =>
        m.replace(/<[^>]+>/g, "").trim()
      );

      // Check if this project is in our target area
      const combined = `${col1} ${col2} ${col3} ${col4}`;
      if (matchesTargetArea(combined)) {
        leads.push({
          source: "odot",
          projectTitle: col1 || "ODOT Project",
          projectDescription: col3 || col2 || "",
          location: col2 || "Eastern Ohio",
          county: TARGET_COUNTIES.find((c) =>
            combined.toLowerCase().includes(c)
          ),
          estimatedValue: col4 || undefined,
          companyName: undefined,
          url,
        });
      }
    }

    // Also try to scrape the lettings results page
    const lettingsUrl =
      "https://www.dot.state.oh.us/Divisions/ContractAdmin/Contracts/Pages/Letting-Results.aspx";
    try {
      const lettingsHtml = await fetchUrl(lettingsUrl);
      const lettingsPattern =
        /<tr[^>]*>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/gi;
      let lMatch: RegExpExecArray | null;
      while ((lMatch = lettingsPattern.exec(lettingsHtml)) !== null) {
        const cols = Array.from({ length: 5 }, (_, i) =>
          lMatch![i + 1].replace(/<[^>]+>/g, "").trim()
        );
        const combined = cols.join(" ");
        if (matchesTargetArea(combined)) {
          leads.push({
            source: "odot",
            projectTitle: cols[0] || "ODOT Letting",
            projectDescription: cols[2] || "",
            location: cols[1] || "Eastern Ohio",
            county: TARGET_COUNTIES.find((c) =>
              combined.toLowerCase().includes(c)
            ),
            estimatedValue: cols[3] || undefined,
            companyName: cols[4] || undefined,
            awardDate: undefined,
            url: lettingsUrl,
          });
        }
      }
    } catch {
      // lettings page may not be available
    }

    console.log(`ODOT: found ${leads.length} leads`);
    return leads;
  } catch (err) {
    console.error("ODOT scraper failed:", err);
    return [];
  }
}

// --- SAM.gov: Federal Contract Opportunities ---

export async function scrapeSamGov(): Promise<RawLead[]> {
  try {
    // SAM.gov public API for contract opportunities
    // Search for construction/infrastructure in Ohio
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fromDate = `${String(thirtyDaysAgo.getMonth() + 1).padStart(2, "0")}/${String(thirtyDaysAgo.getDate()).padStart(2, "0")}/${thirtyDaysAgo.getFullYear()}`;
    const toDate = `${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}/${today.getFullYear()}`;

    // Construction NAICS codes: 237 (heavy/civil), 238 (specialty trades), 236 (building)
    const naicsCodes = ["237310", "237110", "237120", "237990", "238910", "236220"];
    const leads: RawLead[] = [];

    for (const ncode of naicsCodes) {
      try {
        const url = `https://api.sam.gov/opportunities/v2/search?api_key=DEMO_KEY&postedFrom=${fromDate}&postedTo=${toDate}&limit=25&ncode=${ncode}&state=OH`;
        const data = await fetchJson(url);

        if (data?.opportunitiesData) {
          for (const opp of data.opportunitiesData) {
            const place = opp.placeOfPerformance || {};
            const combined = `${opp.title || ""} ${opp.description || ""} ${place.state?.name || ""} ${place.city?.name || ""} ${opp.organizationHierarchy || ""}`;

            // Accept all Ohio results (they may send crews through Cambridge area)
            leads.push({
              source: "sam_gov",
              companyName: opp.awardee?.name || opp.organizationHierarchy || undefined,
              projectTitle: opp.title || "Federal Contract",
              projectDescription: (opp.description || "").slice(0, 500),
              location: place.city?.name
                ? `${place.city.name}, ${place.state?.code || "OH"}`
                : "Ohio",
              county: TARGET_COUNTIES.find((c) =>
                combined.toLowerCase().includes(c)
              ),
              estimatedValue: opp.award?.amount
                ? `$${Number(opp.award.amount).toLocaleString()}`
                : undefined,
              contactName: opp.pointOfContact?.[0]?.fullName || undefined,
              contactEmail: opp.pointOfContact?.[0]?.email || undefined,
              contactPhone: opp.pointOfContact?.[0]?.phone || undefined,
              awardDate: opp.postedDate || undefined,
              url: `https://sam.gov/opp/${opp.noticeId || ""}`,
            });
          }
        }
      } catch {
        // Individual NAICS query may fail, continue with others
      }
    }

    console.log(`SAM.gov: found ${leads.length} leads`);
    return leads;
  } catch (err) {
    console.error("SAM.gov scraper failed:", err);
    return [];
  }
}

// --- Ohio DNR: Oil & Gas Permits ---

export async function scrapeOhioDNR(): Promise<RawLead[]> {
  try {
    // Ohio DNR ArcGIS REST API - query Utica/Marcellus shale wells in target counties
    const counties = [
      "GUERNSEY", "BELMONT", "NOBLE", "HARRISON", "MONROE",
      "TUSCARAWAS", "MUSKINGUM", "COSHOCTON", "JEFFERSON", "CARROLL",
    ];
    const countyFilter = counties.map((c) => `'${c}'`).join(",");
    const url = `https://gis2.ohiodnr.gov/arcgis/rest/services/DOG_Services/Oilgas_Wells_10_JS_TEST/MapServer/0/query?where=WL_CNTY%20IN%20(${encodeURIComponent(countyFilter)})%20AND%20Utica_Shale%20%3D%201&outFields=CO_NAME,WELL_NM,WL_CNTY,WL_TWP,PHONE,ADDR1,WL_STATUS_DESC&returnGeometry=false&f=json&resultRecordCount=50&orderByFields=API_WELLNO%20DESC`;

    const data = await fetchJson(url);
    const leads: RawLead[] = [];

    if (data?.features) {
      // Deduplicate by operator name (one lead per operator)
      const seenOperators = new Set<string>();

      for (const feature of data.features) {
        const attr = feature.attributes;
        const operator = (attr.CO_NAME || "").trim();
        if (!operator || seenOperators.has(operator.toLowerCase())) continue;
        seenOperators.add(operator.toLowerCase());

        const county = (attr.WL_CNTY || "").trim();
        const township = (attr.WL_TWP || "").trim();
        const phone = (attr.PHONE || "").trim();
        const address = (attr.ADDR1 || "").trim();
        const wellName = (attr.WELL_NM || "").trim();
        const status = (attr.WL_STATUS_DESC || "").trim();

        leads.push({
          source: "ohio_dnr",
          companyName: operator,
          projectTitle: `Utica Shale Operations - ${operator}`,
          projectDescription: `${operator} operates Utica Shale wells in ${county} County${township ? `, ${township} Township` : ""}. Status: ${status || "Active"}. Well: ${wellName}. Drilling and completion crews need extended-stay lodging (typically 2-6 months per well).`,
          location: `${county} County, OH${township ? ` (${township} Twp)` : ""}`,
          county: county.toLowerCase(),
          contactPhone: phone || undefined,
          url: "https://gis2.ohiodnr.gov/MapViewer/?config=OilGasWells",
        });
      }
    }

    console.log(`Ohio DNR: found ${leads.length} leads`);
    return leads;
  } catch (err) {
    console.error("Ohio DNR scraper failed:", err);
    return [];
  }
}

// --- FEMA: Disaster Declarations ---

export async function scrapeFEMA(): Promise<RawLead[]> {
  try {
    // FEMA OpenFEMA API - check Ohio and neighboring states for active declarations
    const states = ["OH", "WV", "PA", "KY"];
    const leads: RawLead[] = [];

    for (const state of states) {
      try {
        const url = `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=state%20eq%20'${state}'&$top=10&$orderby=declarationDate%20desc`;
        const data = await fetchJson(url);

        if (data?.DisasterDeclarationsSummaries) {
          for (const dec of data.DisasterDeclarationsSummaries) {
            // Only include relatively recent declarations (last 2 years)
            const declDate = new Date(dec.declarationDate);
            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
            if (declDate < twoYearsAgo) continue;

            // Check if closeout date exists (means it's no longer active)
            if (dec.closeoutDate) continue;

            const county = dec.designatedArea?.replace(/ \(County\)/i, "") || "";

            leads.push({
              source: "fema",
              projectTitle: `FEMA ${dec.declarationType}-${dec.disasterNumber}: ${dec.declarationTitle}`,
              projectDescription: `${dec.declarationTitle} declaration in ${county}, ${state}. FEMA teams and recovery contractors need lodging. Programs: ${[dec.ihProgramDeclared ? "Individual Assistance" : "", dec.iaProgramDeclared ? "Public Assistance" : "", dec.hmProgramDeclared ? "Hazard Mitigation" : ""].filter(Boolean).join(", ") || "Active declaration"}`,
              location: county ? `${county}, ${state}` : state,
              county: TARGET_COUNTIES.find((c) =>
                county.toLowerCase().includes(c)
              ),
              url: `https://www.fema.gov/disaster/${dec.disasterNumber}`,
            });
          }
        }
      } catch {
        // Individual state query may fail
      }
    }

    // Deduplicate by disaster number
    const seen = new Set<string>();
    const unique = leads.filter((l) => {
      const key = l.projectTitle;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`FEMA: found ${unique.length} leads`);
    return unique;
  } catch (err) {
    console.error("FEMA scraper failed:", err);
    return [];
  }
}

// --- BidExpress: ODOT Upcoming Bids ---

export async function scrapeBidExpress(): Promise<RawLead[]> {
  try {
    const url = "https://www.bidx.com/oh/lettings";
    const html = await fetchUrl(url);
    const leads: RawLead[] = [];

    // BidExpress lists upcoming ODOT lettings with project IDs, counties, descriptions
    const rowPattern =
      /<tr[^>]*>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/gi;
    let match: RegExpExecArray | null;
    while ((match = rowPattern.exec(html)) !== null) {
      const cols = [1, 2, 3].map((i) =>
        match![i].replace(/<[^>]+>/g, "").trim()
      );
      const combined = cols.join(" ");

      if (matchesTargetArea(combined)) {
        leads.push({
          source: "bid_express",
          projectTitle: cols[0] || "ODOT Bid",
          projectDescription: cols[2] || cols[1] || "",
          location: cols[1] || "Eastern Ohio",
          county: TARGET_COUNTIES.find((c) =>
            combined.toLowerCase().includes(c)
          ),
          url: "https://www.bidx.com/oh/lettings",
        });
      }
    }

    console.log(`BidExpress: found ${leads.length} leads`);
    return leads;
  } catch (err) {
    console.error("BidExpress scraper failed:", err);
    return [];
  }
}

// --- Corpay: Trucking company lodging searches ---

export async function scrapeCorpay(): Promise<RawLead[]> {
  try {
    // Corpay doesn't have a public API for finding trucking companies.
    // Instead, we check if there's active trucking/transportation project
    // demand in the area by searching for trucking companies near Cambridge.
    // This scraper looks at transportation-related federal contracts and
    // adds Corpay context to the leads.

    const today = new Date();
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    const fromDate = `${String(sixtyDaysAgo.getMonth() + 1).padStart(2, "0")}/${String(sixtyDaysAgo.getDate()).padStart(2, "0")}/${sixtyDaysAgo.getFullYear()}`;
    const toDate = `${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}/${today.getFullYear()}`;
    const url =
      `https://api.sam.gov/opportunities/v2/search?api_key=DEMO_KEY&postedFrom=${fromDate}&postedTo=${toDate}&limit=15&ncode=484110&state=OH`;
    const leads: RawLead[] = [];

    try {
      const data = await fetchJson(url);
      if (data?.opportunitiesData) {
        for (const opp of data.opportunitiesData) {
          leads.push({
            source: "corpay",
            companyName: opp.awardee?.name || undefined,
            projectTitle: opp.title || "Transportation/Trucking Contract",
            projectDescription: `Trucking/freight contract in Ohio. Company may use Corpay Lodging for crew accommodations. ${(opp.description || "").slice(0, 300)}`,
            location: opp.placeOfPerformance?.city?.name
              ? `${opp.placeOfPerformance.city.name}, OH`
              : "Ohio",
            contactName: opp.pointOfContact?.[0]?.fullName || undefined,
            contactEmail: opp.pointOfContact?.[0]?.email || undefined,
            contactPhone: opp.pointOfContact?.[0]?.phone || undefined,
            url: `https://sam.gov/opp/${opp.noticeId || ""}`,
          });
        }
      }
    } catch {
      // SAM.gov may rate limit
    }

    console.log(`Corpay/Trucking: found ${leads.length} leads`);
    return leads;
  } catch (err) {
    console.error("Corpay scraper failed:", err);
    return [];
  }
}

// --- Master scrape function ---

export interface ScrapeResults {
  leads: RawLead[];
  sourceCounts: Record<string, number>;
  sourceErrors: string[];
}

export async function scrapeAllSources(): Promise<ScrapeResults> {
  const sourceErrors: string[] = [];

  const results = await Promise.allSettled([
    scrapeODOT(),
    scrapeSamGov(),
    scrapeOhioDNR(),
    scrapeFEMA(),
    scrapeBidExpress(),
    scrapeCorpay(),
  ]);

  const sourceNames = [
    "odot",
    "sam_gov",
    "ohio_dnr",
    "fema",
    "bid_express",
    "corpay",
  ];
  const allLeads: RawLead[] = [];
  const sourceCounts: Record<string, number> = {};

  results.forEach((result, i) => {
    const name = sourceNames[i];
    if (result.status === "fulfilled") {
      const leads = result.value;
      allLeads.push(...leads);
      sourceCounts[name] = leads.length;
    } else {
      sourceCounts[name] = 0;
      sourceErrors.push(`${name}: ${result.reason}`);
    }
  });

  console.log(
    `Total scraped: ${allLeads.length} leads from ${Object.entries(sourceCounts).map(([k, v]) => `${k}=${v}`).join(", ")}`
  );

  return { leads: allLeads, sourceCounts, sourceErrors };
}
