import {
  getResend,
  DIGEST_RECIPIENTS,
  REVIEW_FROM_EMAIL,
  dateStamp,
  saveOutput,
} from "./config.js";
import type { QualifiedLead } from "./lead-qualifier.js";
import type { ScrapeResults } from "./source-scrapers.js";

// --- HTML Email Builder ---

// Hotel image (Wyndham official CDN - updated March 2026)
const HOTEL_IMAGE_URL =
  "https://www.wyndhamhotels.com/content/dam/property-images/en-us/di/us/oh/cambridge/06457/06457_exterior_day_3.jpg";

function buildDigestHtml(
  leads: QualifiedLead[],
  scrapeResults: ScrapeResults,
  activity?: SequenceActivity
): string {
  const date = dateStamp();

  // Build lead cards
  const leadCards = leads
    .slice(0, 15)
    .map(
      (l) => `
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:12px;">
      <div style="margin-bottom:8px;">
        <strong style="font-size:15px;color:#1a365d;">${l.companyName || "Unknown Company"}</strong>
        <span style="color:#64748b;font-size:12px;margin-left:8px;">${l.source.toUpperCase()}</span>
      </div>
      <div style="font-size:13px;color:#334155;margin-bottom:6px;">
        <strong>Project:</strong> ${l.projectTitle}
      </div>
      <div style="font-size:13px;color:#334155;margin-bottom:6px;">
        <strong>Location:</strong> ${l.location}
        ${(l as any).estimatedCrewSize ? ` &middot; Est. crew: ${(l as any).estimatedCrewSize}` : ""}
        ${(l as any).estimatedDuration ? ` &middot; Duration: ${(l as any).estimatedDuration}` : ""}
      </div>
      <div style="font-size:13px;color:#059669;margin-bottom:8px;">
        <strong>Why good fit:</strong> ${(l as any).whyGoodFit || l.relevanceReason || "Active project near Cambridge, OH"}
      </div>
      <div style="font-size:13px;margin-bottom:8px;">
        <strong>Contact:</strong>
        ${l.contactEmail ? `<a href="mailto:${l.contactEmail}" style="color:#2563eb;">${l.contactEmail}</a>` : "<span style='color:#999;'>No email found</span>"}
        ${l.contactPhone ? ` &middot; ${l.contactPhone}` : ""}
        ${l.contactName && l.contactName !== "null" ? ` (${l.contactName})` : ""}
      </div>
      ${
        l.draftEmail?.body
          ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;margin-top:8px;">
              <div style="font-size:11px;color:#64748b;margin-bottom:6px;">
                <strong>Draft email</strong> &middot; Subject: ${l.draftEmail.subject}
              </div>
              <div style="font-size:13px;color:#334155;white-space:pre-line;">${l.draftEmail.body}</div>
            </div>`
          : ""
      }
    </div>`
    )
    .join("");

  return `
    <div style="font-family:-apple-system,system-ui,sans-serif;max-width:700px;margin:0 auto;padding:20px;">
      <div style="background:#1a365d;color:white;padding:20px;border-radius:10px;margin-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>
            <h1 style="margin:0;font-size:20px;">Days Inn Cambridge</h1>
            <p style="margin:4px 0 0;opacity:0.8;font-size:13px;">Contractor Leads &middot; ${date}</p>
          </td>
          <td style="text-align:right;font-size:13px;opacity:0.8;">
            ${leads.length} leads found<br/>
            ${leads.filter((l) => l.contactEmail).length} with emails
          </td>
        </tr></table>
      </div>

      <img src="${HOTEL_IMAGE_URL}" alt="Days Inn by Wyndham Cambridge, OH" style="width:100%;max-width:700px;border-radius:8px;margin-bottom:20px;display:block;" />

      ${
        activity
          ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin-bottom:20px;font-size:13px;color:#166534;">
              <strong>Outreach Activity Today:</strong>
              ${activity.newContacts} new contacts added &middot;
              ${activity.outreachSent} initial emails sent &middot;
              ${activity.followUp1Sent} follow-up #1 &middot;
              ${activity.followUp2Sent} follow-up #2 &middot;
              ${activity.totalContacts} total contacts in database
            </div>`
          : ""
      }

      ${
        leads.length > 0
          ? leadCards
          : `<div style="padding:24px;text-align:center;color:#999;background:#f9fafb;border-radius:8px;">
              No leads found today. Sources scanned: ODOT, SAM.gov, Ohio DNR, FEMA, BidExpress, Corpay.
            </div>`
      }

      <div style="margin-top:20px;padding:12px;background:#f8fafc;border-radius:8px;font-size:12px;color:#64748b;">
        <strong>Sources scanned:</strong>
        ${Object.entries(scrapeResults.sourceCounts)
          .map(([name, count]) => `${name} (${count})`)
          .join(" &middot; ")}
        ${scrapeResults.sourceErrors.length > 0 ? `<br/><strong style="color:#dc2626;">Errors:</strong> ${scrapeResults.sourceErrors.join(", ")}` : ""}
      </div>

      <div style="margin-top:16px;color:#999;font-size:11px;">
        Generated by Apex Brain. Reply with feedback to improve future leads.
      </div>
    </div>
  `;
}

// --- Send Digest ---

export interface SequenceActivity {
  newContacts: number;
  outreachSent: number;
  followUp1Sent: number;
  followUp2Sent: number;
  sequenceCompleted: number;
  totalContacts: number;
}

export async function sendDigestEmail(
  leads: QualifiedLead[],
  scrapeResults: ScrapeResults,
  activity?: SequenceActivity
): Promise<{ sent: boolean; emailId?: string; error?: any }> {
  const html = buildDigestHtml(leads, scrapeResults, activity);
  const date = dateStamp();
  const highPriority = leads.filter((l) => l.relevanceScore >= 80).length;

  const subject = highPriority > 0
    ? `${highPriority} high-priority contractor leads -- Days Inn ${date}`
    : `Contractor leads report -- Days Inn ${date}`;

  // Save HTML for debugging
  saveOutput(`digest_${date}.html`, html);

  // Save leads JSON
  saveOutput(
    `leads_${date}.json`,
    JSON.stringify(
      {
        date,
        totalScraped: scrapeResults.leads.length,
        qualified: leads.length,
        sourceCounts: scrapeResults.sourceCounts,
        sourceErrors: scrapeResults.sourceErrors,
        leads,
      },
      null,
      2
    )
  );

  // Send via Resend
  const resend = getResend();
  const result = await resend.emails.send({
    from: REVIEW_FROM_EMAIL,
    to: DIGEST_RECIPIENTS,
    subject,
    html,
  });

  if (result.error) {
    console.error("Resend error:", JSON.stringify(result.error));
    return { sent: false, error: result.error };
  }

  console.log(
    `Digest sent to ${DIGEST_RECIPIENTS.join(", ")}: ${subject} (${leads.length} leads)`
  );
  return { sent: true, emailId: result.data?.id };
}
