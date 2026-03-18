import { getResend } from "./config.js";
import type { Contact } from "./contacts-db.js";
import * as crypto from "crypto";

// --- Config ---

const HOTEL_IMAGE_URL =
  "https://www.wyndhamhotels.com/content/dam/property-images/en-us/di/us/oh/cambridge/06457/06457_exterior_day_3.jpg";

const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || "days-inn-unsub-2026";

// Dashboard URL for unsubscribe endpoint
const DASHBOARD_URL = process.env.DASHBOARD_URL || "https://apex-vision.vercel.app";

// Sender: friendly display name on the verified Resend domain
// Replies come back to this address and hit the inbound webhook
const OUTREACH_FROM =
  process.env.OUTREACH_FROM_EMAIL ||
  "Days Inn Cambridge <review@updates.apexmedlaw.com>";

// --- Unsubscribe Token ---

export function encodeUnsubToken(email: string): string {
  const hmac = crypto.createHmac("sha256", UNSUBSCRIBE_SECRET);
  hmac.update(email.toLowerCase());
  const sig = hmac.digest("hex").slice(0, 16);
  const payload = Buffer.from(
    JSON.stringify({ e: email.toLowerCase(), s: sig })
  ).toString("base64url");
  return payload;
}

export function decodeUnsubToken(token: string): string | null {
  try {
    const decoded = JSON.parse(
      Buffer.from(token, "base64url").toString("utf-8")
    );
    const hmac = crypto.createHmac("sha256", UNSUBSCRIBE_SECRET);
    hmac.update(decoded.e);
    const expected = hmac.digest("hex").slice(0, 16);
    if (decoded.s === expected) return decoded.e;
    return null;
  } catch {
    return null;
  }
}

// --- CAN-SPAM Footer ---

function buildFooter(email: string): string {
  const token = encodeUnsubToken(email);
  const unsubUrl = `${DASHBOARD_URL}/api/unsubscribe?token=${token}`;

  return `
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;line-height:1.6;">
  <p>Days Inn by Wyndham Cambridge<br/>
  2328 Southgate Parkway, Cambridge, OH 43725</p>
  <p>You received this email because your company has an active project near Cambridge, OH.
  <a href="${unsubUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a></p>
</div>`;
}

// --- Email Templates ---

function buildTouch1Html(contact: Contact): { subject: string; html: string } {
  const subject =
    contact.draftEmail?.subject ||
    `Crew lodging near ${contact.location} - Days Inn Cambridge`;

  const bodyText =
    contact.draftEmail?.body ||
    `Hi - I saw ${contact.companyName} has an active project in ${contact.location}. We're the closest quality hotel to your job site with special contractor rates: $350/week or $55/night for 5+ rooms. Free breakfast, truck parking, laundry on-site. Call me anytime at 740-432-5691.\n\nGM, Days Inn by Wyndham Cambridge`;

  const html = `
<div style="font-family:-apple-system,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <img src="${HOTEL_IMAGE_URL}" alt="Days Inn by Wyndham Cambridge, OH" style="width:100%;max-width:600px;border-radius:8px;margin-bottom:20px;display:block;" />
  <div style="font-size:14px;color:#334155;line-height:1.7;white-space:pre-line;">${bodyText}</div>
  ${buildFooter(contact.email)}
</div>`;

  return { subject, html };
}

function buildTouch2Html(contact: Contact): { subject: string; html: string } {
  const subject = `Quick follow-up - crew rates for ${contact.companyName}`;

  const html = `
<div style="font-family:-apple-system,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="font-size:14px;color:#334155;line-height:1.7;">
    <p>Hi - just wanted to make sure my last email got to the right person at ${contact.companyName}.</p>
    <p>We have rooms available for your crew working in ${contact.location}. Our weekly rate is $350/week (saves over $100 vs. booking nightly), and we do $55/night for groups of 5+ rooms.</p>
    <p>Free breakfast, truck/trailer parking, laundry, microwave and fridge in every room. We're right off I-77.</p>
    <p>Happy to set up a block for your team whenever you're ready.</p>
    <p style="margin-top:16px;">
    General Manager<br/>
    Days Inn by Wyndham Cambridge<br/>
    740-432-5691</p>
  </div>
  ${buildFooter(contact.email)}
</div>`;

  return { subject, html };
}

function buildTouch3Html(contact: Contact): { subject: string; html: string } {
  const subject = `Last note - ${contact.companyName} crew lodging`;

  const html = `
<div style="font-family:-apple-system,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="font-size:14px;color:#334155;line-height:1.7;">
    <p>Hi - last note from me. If the timing isn't right for your ${contact.location} project, no worries at all.</p>
    <p>Just want to make sure you have our number in case things change: <strong>740-432-5691</strong>. We offer custom rates for extended stays (30+ days) and can set up a block on short notice.</p>
    <p>Keep us in mind for future projects in eastern Ohio.</p>
    <p style="margin-top:16px;">
    General Manager<br/>
    Days Inn by Wyndham Cambridge<br/>
    2328 Southgate Parkway, Cambridge, OH 43725</p>
  </div>
  ${buildFooter(contact.email)}
</div>`;

  return { subject, html };
}

// --- Send ---

export async function sendOutreachEmail(
  contact: Contact,
  touchNumber: 1 | 2 | 3
): Promise<{ sent: boolean; emailId?: string; error?: any }> {
  const resend = getResend();

  let emailContent: { subject: string; html: string };
  switch (touchNumber) {
    case 1:
      emailContent = buildTouch1Html(contact);
      break;
    case 2:
      emailContent = buildTouch2Html(contact);
      break;
    case 3:
      emailContent = buildTouch3Html(contact);
      break;
  }

  const token = encodeUnsubToken(contact.email);
  const unsubUrl = `${DASHBOARD_URL}/api/unsubscribe?token=${token}`;

  const result = await resend.emails.send({
    from: OUTREACH_FROM,
    replyTo: OUTREACH_FROM,
    to: [contact.email],
    subject: emailContent.subject,
    html: emailContent.html,
    headers: {
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "X-Apex-Contact-Id": contact.id,
      "X-Apex-Touch": String(touchNumber),
    },
  });

  if (result.error) {
    console.error(
      `Failed to send touch ${touchNumber} to ${contact.email}:`,
      result.error
    );
    return { sent: false, error: result.error };
  }

  console.log(
    `Touch ${touchNumber} sent to ${contact.email} (${contact.companyName}): ${result.data?.id}`
  );
  return { sent: true, emailId: result.data?.id };
}
