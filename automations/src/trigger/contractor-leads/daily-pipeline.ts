import { schedules, task } from "@trigger.dev/sdk";
import { dateStamp } from "./config.js";
import { scrapeAllSources } from "./source-scrapers.js";
import { qualifyLeads } from "./lead-qualifier.js";
import { sendDigestEmail } from "./send-digest.js";
import {
  loadContacts,
  saveContacts,
  addContact,
  unsubscribeContact,
  findContact,
  updateContactStatus,
} from "./contacts-db.js";
import { sendInitialOutreach, runFollowUpSequence } from "./sequence-runner.js";
import type { Contact } from "./contacts-db.js";

/**
 * Daily contractor lead generation + outreach pipeline for Days Inn Cambridge.
 *
 * Flow:
 * 1. Scrape all public data sources
 * 2. Qualify and rank leads with Claude
 * 3. Deduplicate against contacts DB
 * 4. Add new contacts + send Touch 1 outreach
 * 5. Run follow-up sequence (Touch 2/3 for existing contacts)
 * 6. Send owner digest with activity summary
 *
 * After deploying, create the schedule in Trigger.dev dashboard:
 *   Task: days-inn-contractor-leads
 *   Cron: 0 12 * * * (8am ET)
 */
export const contractorLeadsPipeline = schedules.task({
  id: "days-inn-contractor-leads",
  maxDuration: 300,
  run: async () => {
    const date = dateStamp();
    console.log(`=== Days Inn Contractor Leads Pipeline: ${date} ===`);

    // Step 1: Scrape all sources
    console.log("Step 1: Scraping data sources...");
    const scrapeResults = await scrapeAllSources();
    console.log(`Scraped ${scrapeResults.leads.length} raw leads`);

    // Step 2: Qualify leads with Claude
    console.log("Step 2: Qualifying leads with Claude...");
    const qualifiedLeads = await qualifyLeads(scrapeResults.leads);
    console.log(`Qualified ${qualifiedLeads.length} leads`);

    // Step 3: Deduplicate against contacts DB + add new contacts
    console.log("Step 3: Adding new contacts to DB...");
    const db = loadContacts();
    const newContacts: Contact[] = [];

    for (const lead of qualifiedLeads) {
      if (!lead.contactEmail) continue;

      const added = addContact(db, {
        companyName: lead.companyName,
        email: lead.contactEmail,
        phone: lead.contactPhone || undefined,
        contactName: lead.contactName || undefined,
        project: lead.projectTitle,
        location: lead.location,
        source: lead.source,
        whyGoodFit: lead.whyGoodFit || lead.relevanceReason || "",
        relevanceScore: lead.relevanceScore,
        draftEmail: lead.draftEmail,
      });

      if (added) {
        newContacts.push(added);
      }
    }
    saveContacts(db);
    console.log(`${newContacts.length} new contacts added (${qualifiedLeads.length - newContacts.length} already in DB)`);

    // Step 4: Send Touch 1 to new contacts
    console.log("Step 4: Sending initial outreach...");
    const outreachResults = await sendInitialOutreach(newContacts);

    // Step 5: Run follow-up sequence
    console.log("Step 5: Running follow-up sequence...");
    const sequenceResults = await runFollowUpSequence();

    // Step 6: Send owner digest
    console.log("Step 6: Sending owner digest...");
    const emailResult = await sendDigestEmail(qualifiedLeads, scrapeResults, {
      newContacts: newContacts.length,
      outreachSent: outreachResults.sent,
      followUp1Sent: sequenceResults.followUp1Sent,
      followUp2Sent: sequenceResults.followUp2Sent,
      sequenceCompleted: sequenceResults.sequenceCompleted,
      totalContacts: db.contacts.length,
    });

    console.log(
      `=== Pipeline complete: ${scrapeResults.leads.length} scraped, ${qualifiedLeads.length} qualified, ${newContacts.length} new contacts, ${outreachResults.sent} outreach sent ===`
    );

    return {
      date,
      totalScraped: scrapeResults.leads.length,
      qualified: qualifiedLeads.length,
      newContacts: newContacts.length,
      outreachSent: outreachResults.sent,
      followUps: sequenceResults,
      sourceCounts: scrapeResults.sourceCounts,
      emailSent: emailResult.sent,
    };
  },
});

/**
 * On-demand trigger (manual run from dashboard).
 */
export const runContractorLeads = task({
  id: "days-inn-contractor-leads-manual",
  maxDuration: 300,
  run: async () => {
    // Same flow as scheduled -- just trigger the logic
    const date = dateStamp();
    console.log(`=== Manual contractor leads run: ${date} ===`);

    const scrapeResults = await scrapeAllSources();
    const qualifiedLeads = await qualifyLeads(scrapeResults.leads);

    const db = loadContacts();
    const newContacts: Contact[] = [];
    for (const lead of qualifiedLeads) {
      if (!lead.contactEmail) continue;
      const added = addContact(db, {
        companyName: lead.companyName,
        email: lead.contactEmail,
        phone: lead.contactPhone || undefined,
        contactName: lead.contactName || undefined,
        project: lead.projectTitle,
        location: lead.location,
        source: lead.source,
        whyGoodFit: lead.whyGoodFit || lead.relevanceReason || "",
        relevanceScore: lead.relevanceScore,
        draftEmail: lead.draftEmail,
      });
      if (added) newContacts.push(added);
    }
    saveContacts(db);

    const outreachResults = await sendInitialOutreach(newContacts);
    const sequenceResults = await runFollowUpSequence();
    const emailResult = await sendDigestEmail(qualifiedLeads, scrapeResults, {
      newContacts: newContacts.length,
      outreachSent: outreachResults.sent,
      followUp1Sent: sequenceResults.followUp1Sent,
      followUp2Sent: sequenceResults.followUp2Sent,
      sequenceCompleted: sequenceResults.sequenceCompleted,
      totalContacts: db.contacts.length,
    });

    return {
      date,
      totalScraped: scrapeResults.leads.length,
      qualified: qualifiedLeads.length,
      newContacts: newContacts.length,
      outreachSent: outreachResults.sent,
      followUps: sequenceResults,
      emailSent: emailResult.sent,
    };
  },
});

/**
 * Unsubscribe task -- triggered by the dashboard API route.
 */
export const unsubscribeTask = task({
  id: "days-inn-unsubscribe",
  run: async (payload: { email: string }) => {
    const db = loadContacts();
    const result = unsubscribeContact(db, payload.email);
    if (result) {
      saveContacts(db);
      console.log(`Unsubscribed: ${payload.email}`);
    } else {
      console.log(`Email not found in contacts: ${payload.email}`);
    }
    return { unsubscribed: result, email: payload.email };
  },
});

/**
 * Handle contractor reply -- triggered by inbound webhook when someone
 * replies to an outreach email. Stops the follow-up sequence and
 * forwards the reply to the hotel owners.
 */
export const handleReplyTask = task({
  id: "days-inn-handle-reply",
  run: async (payload: {
    from: string;
    subject: string;
    text: string;
    contactId: string;
  }) => {
    const db = loadContacts();
    const resend = (await import("./config.js")).getResend();
    const REVIEW_FROM_EMAIL =
      process.env.REVIEW_FROM_EMAIL || "review@updates.apexmedlaw.com";
    const DIGEST_RECIPIENTS = ["hkapuria@gmail.com", "ahkapuria@gmail.com"];

    // Find the contact by ID or by email
    let contact = db.contacts.find((c) => c.id === payload.contactId);
    if (!contact) {
      // Try matching by sender email
      const senderEmail = payload.from.match(/<(.+?)>/)?.[1] || payload.from;
      contact = db.contacts.find(
        (c) => c.email.toLowerCase() === senderEmail.toLowerCase()
      );
    }

    if (contact) {
      // Stop the sequence -- mark as replied
      updateContactStatus(db, contact.id, {
        status: "replied",
        nextFollowUp: undefined,
        notes: `Replied ${new Date().toISOString().split("T")[0]}: ${payload.text.slice(0, 200)}`,
      });
      saveContacts(db);
      console.log(`Contact ${contact.companyName} (${contact.email}) marked as replied`);
    }

    // Forward the reply to owners with context
    const companyInfo = contact
      ? `<strong>${contact.companyName}</strong> (${contact.email})<br/>
         Project: ${contact.project}<br/>
         Location: ${contact.location}<br/>
         Score: ${contact.relevanceScore} | Source: ${contact.source}<br/>
         Status was: ${contact.status} (now: replied)`
      : `<strong>Unknown contact</strong> (${payload.from})`;

    const html = `
<div style="font-family:-apple-system,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#059669;color:white;padding:16px;border-radius:8px;margin-bottom:16px;">
    <h2 style="margin:0;font-size:18px;">Contractor Reply Received</h2>
    <p style="margin:4px 0 0;opacity:0.9;font-size:13px;">${new Date().toISOString().split("T")[0]}</p>
  </div>

  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin-bottom:16px;font-size:13px;">
    ${companyInfo}
  </div>

  <div style="margin-bottom:16px;">
    <strong style="font-size:13px;color:#64748b;">From:</strong> ${payload.from}<br/>
    <strong style="font-size:13px;color:#64748b;">Subject:</strong> ${payload.subject}
  </div>

  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;font-size:14px;line-height:1.6;white-space:pre-line;">
${payload.text}
  </div>

  <div style="margin-top:16px;font-size:12px;color:#94a3b8;">
    Follow-up sequence has been stopped for this contact. Reply directly to them at their email address.
  </div>
</div>`;

    const result = await resend.emails.send({
      from: REVIEW_FROM_EMAIL,
      to: DIGEST_RECIPIENTS,
      subject: `[REPLY] ${contact?.companyName || payload.from} responded to Days Inn outreach`,
      html,
    });

    console.log(
      `Reply forwarded to owners: ${result.data?.id || "failed"}`
    );

    return {
      contactFound: !!contact,
      companyName: contact?.companyName || payload.from,
      forwarded: !result.error,
    };
  },
});
