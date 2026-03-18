import {
  loadContacts,
  saveContacts,
  getContactsDueForFollowUp,
  updateContactStatus,
  type Contact,
} from "./contacts-db.js";
import { sendOutreachEmail } from "./outreach-sender.js";

// --- Follow-up schedule ---

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// --- Send initial outreach for new contacts ---

export async function sendInitialOutreach(
  contacts: Contact[]
): Promise<{ sent: number; failed: number }> {
  const db = loadContacts();
  let sent = 0;
  let failed = 0;
  const today = new Date().toISOString().split("T")[0];

  for (const contact of contacts) {
    // Find this contact in the DB (it should already be added)
    const dbContact = db.contacts.find((c) => c.id === contact.id);
    if (!dbContact) continue;
    if (dbContact.status !== "new") continue; // Already handled

    // Rate limit: max 4 emails/second for Resend
    if (sent > 0 || failed > 0) {
      await new Promise((r) => setTimeout(r, 300));
    }

    const result = await sendOutreachEmail(dbContact, 1);
    if (result.sent) {
      updateContactStatus(db, dbContact.id, {
        status: "emailed",
        sequenceStep: 1,
        lastEmailed: today,
        nextFollowUp: addDays(today, 3), // Follow-up in 3 days
      });
      sent++;
    } else {
      if (
        result.error?.name === "validation_error" ||
        result.error?.message?.includes("bounce")
      ) {
        updateContactStatus(db, dbContact.id, { status: "bounced" });
      }
      failed++;
    }
  }

  saveContacts(db);
  console.log(`Initial outreach: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}

// --- Run follow-up sequence ---

export interface SequenceResults {
  followUp1Sent: number;
  followUp2Sent: number;
  sequenceCompleted: number;
  errors: number;
}

export async function runFollowUpSequence(): Promise<SequenceResults> {
  const db = loadContacts();
  const due = getContactsDueForFollowUp(db);
  const today = new Date().toISOString().split("T")[0];

  const results: SequenceResults = {
    followUp1Sent: 0,
    followUp2Sent: 0,
    sequenceCompleted: 0,
    errors: 0,
  };

  console.log(`${due.length} contacts due for follow-up`);

  let emailsSent = 0;
  for (const contact of due) {
    // Rate limit: max 4 emails/second for Resend
    if (emailsSent > 0) {
      await new Promise((r) => setTimeout(r, 300));
    }

    if (contact.sequenceStep === 1) {
      // Send Touch 2 (follow-up 1)
      const result = await sendOutreachEmail(contact, 2);
      if (result.sent) {
        updateContactStatus(db, contact.id, {
          status: "follow_up_1",
          sequenceStep: 2,
          lastEmailed: today,
          nextFollowUp: addDays(today, 4), // Touch 3 in 4 more days (day 7 total)
        });
        results.followUp1Sent++;
        emailsSent++;
      } else {
        results.errors++;
      }
    } else if (contact.sequenceStep === 2) {
      // Send Touch 3 (follow-up 2 / final)
      const result = await sendOutreachEmail(contact, 3);
      if (result.sent) {
        updateContactStatus(db, contact.id, {
          status: "sequence_complete",
          sequenceStep: 3,
          lastEmailed: today,
          nextFollowUp: undefined, // No more follow-ups
        });
        results.followUp2Sent++;
        results.sequenceCompleted++;
        emailsSent++;
      } else {
        results.errors++;
      }
    }
  }

  saveContacts(db);
  console.log(
    `Follow-ups: ${results.followUp1Sent} touch-2, ${results.followUp2Sent} touch-3, ${results.errors} errors`
  );
  return results;
}
