import { getClaude, loadEntityFile } from "./config.js";
import type { RawLead } from "./source-scrapers.js";

// --- Types ---

export interface QualifiedLead {
  companyName: string;
  projectTitle: string;
  projectDescription: string;
  location: string;
  relevanceScore: number;
  relevanceReason?: string;
  whyGoodFit?: string;
  estimatedCrewSize?: string;
  estimatedDuration?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
  source: string;
  url: string;
  draftEmail: {
    subject: string;
    body: string;
  };
}

// --- Deduplication ---

function deduplicateLeads(leads: RawLead[]): RawLead[] {
  const seen = new Map<string, RawLead>();
  for (const lead of leads) {
    const key = `${(lead.companyName || "").toLowerCase()}_${lead.projectTitle.toLowerCase().slice(0, 60)}`;
    if (!seen.has(key)) {
      seen.set(key, lead);
    }
  }
  return Array.from(seen.values());
}

// --- Claude Qualification ---

export async function qualifyLeads(
  rawLeads: RawLead[]
): Promise<QualifiedLead[]> {
  if (rawLeads.length === 0) {
    return [];
  }

  const config = loadEntityFile("config.md");
  const brand = loadEntityFile("brand.md");
  const claude = getClaude();

  const deduped = deduplicateLeads(rawLeads);
  console.log(`Qualifying ${deduped.length} unique leads (from ${rawLeads.length} total)`);

  // Send all leads to Claude for batch qualification + email lookup
  const response = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16384,
    messages: [
      {
        role: "user",
        content: `You are the outreach assistant for Days Inn by Wyndham Cambridge, OH.

## Hotel Info
${config}

## Brand Voice
${brand}

## Raw Leads Found Today
${JSON.stringify(deduped, null, 2)}

## Your Tasks

1. **Find the best contact email for each company.** Use your knowledge of these companies to provide a real, working email address. For oil & gas operators, construction firms, and FEMA: look up their known public contact emails, general inquiry emails, or lodging/travel coordinator emails. Common patterns:
   - Company websites typically have info@company.com, contact@company.com
   - Oil & gas operators: landowner-relations@, operations@, or their published office email
   - Large contractors: often have a travel/lodging coordinator
   - FEMA: use the regional office contact
   If you know the company, provide their real contact email. If you can only guess, use the most likely pattern (e.g., info@companyname.com) and note it as "estimated" in contactName.

2. Score each lead 1-100 on relevance to Cambridge, OH hotel bookings.

3. Write a short "whyGoodFit" sentence explaining why this company's crews would need rooms near Cambridge.

4. For top leads (score 60+), write a simple draft outreach email:
   - Subject: short, references their project
   - Body: plain text (NOT HTML). 4-6 sentences max.
   - MUST mention these special contractor rates prominently:
     * "Special weekly crew rate: $350/week (saves over $100 vs. nightly booking)"
     * "Group discount: $55/night when booking 5+ rooms"
     * "Extended stay 30+ days: call me directly for a custom rate"
   - Also mention: free breakfast (saves per diem), truck/trailer parking, laundry on-site, microwave/fridge in every room
   - Sign off as: GM, Days Inn by Wyndham Cambridge, 740-432-5691
   - Keep it casual and direct. Not salesy. Sound like a real person offering a deal.

## Output Format
Return ONLY a valid JSON array, no markdown fences:
[
  {
    "companyName": "...",
    "projectTitle": "...",
    "projectDescription": "short description",
    "location": "...",
    "relevanceScore": 85,
    "whyGoodFit": "1 sentence why their crews need rooms near Cambridge",
    "estimatedCrewSize": "10-15",
    "estimatedDuration": "3-6 months",
    "contactEmail": "real email address",
    "contactPhone": "if known",
    "contactName": "contact name or 'General Inquiry' or 'Estimated'",
    "source": "ohio_dnr",
    "url": "...",
    "draftEmail": {
      "subject": "short subject",
      "body": "plain text email, 3-4 sentences"
    }
  }
]

Sort by relevanceScore descending. Include all leads with score 40+.`,
      },
    ],
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "[]";

  try {
    // Try to parse JSON, handling possible markdown fences
    let jsonStr = rawText;

    // Strip markdown fences if present
    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1];
    }

    // Find the outermost array in the response
    // Trim whitespace and try direct parse first
    const trimmed = jsonStr.trim();
    let qualified: QualifiedLead[];

    try {
      qualified = JSON.parse(trimmed);
    } catch {
      // Fall back to finding array boundaries
      const firstBracket = trimmed.indexOf("[");
      const lastBracket = trimmed.lastIndexOf("]");
      if (firstBracket === -1 || lastBracket === -1) {
        console.error("No JSON array found in Claude response");
        console.error("Response preview:", rawText.slice(0, 300));
        return [];
      }
      qualified = JSON.parse(trimmed.slice(firstBracket, lastBracket + 1));
    }
    console.log(`Qualified ${qualified.length} leads (from ${deduped.length} unique)`);
    return qualified.sort((a, b) => b.relevanceScore - a.relevanceScore);
  } catch (err) {
    console.error("Failed to parse Claude qualification response:", err);
    console.error("Raw response:", rawText.slice(0, 500));
    return [];
  }
}
