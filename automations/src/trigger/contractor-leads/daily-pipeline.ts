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
