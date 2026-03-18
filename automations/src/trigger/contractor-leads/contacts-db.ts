import * as fs from "fs";
import * as path from "path";
import { LEADS_DIR } from "./config.js";

// --- Types ---

export interface Contact {
  id: string;
  companyName: string;
  email: string;
  phone?: string;
  contactName?: string;
  project: string;
  location: string;
  source: string;
  whyGoodFit: string;
  relevanceScore: number;
  status:
    | "new"
    | "emailed"
    | "follow_up_1"
    | "follow_up_2"
    | "sequence_complete"
    | "replied"
    | "booked"
    | "unsubscribed"
    | "bounced";
  sequenceStep: number; // 0=not sent, 1=initial, 2=follow-up 1, 3=follow-up 2
  dateAdded: string;
  lastEmailed?: string;
  nextFollowUp?: string;
  draftEmail?: { subject: string; body: string };
  notes?: string;
}

export interface ContactsDB {
  version: number;
  lastUpdated: string;
  contacts: Contact[];
}

// --- File path ---

const CONTACTS_FILE = path.join(LEADS_DIR, "..", "contacts.json");

// --- Read/Write ---

export function loadContacts(): ContactsDB {
  try {
    const raw = fs.readFileSync(CONTACTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { version: 1, lastUpdated: new Date().toISOString(), contacts: [] };
  }
}

export function saveContacts(db: ContactsDB): void {
  db.lastUpdated = new Date().toISOString();
  fs.mkdirSync(path.dirname(CONTACTS_FILE), { recursive: true });
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify(db, null, 2));
}

// --- Deduplication ---

export function findContact(
  db: ContactsDB,
  email: string,
  companyName?: string
): Contact | undefined {
  const emailLower = email.toLowerCase();
  const companyLower = (companyName || "").toLowerCase();

  return db.contacts.find(
    (c) =>
      c.email.toLowerCase() === emailLower ||
      (companyLower && c.companyName.toLowerCase() === companyLower)
  );
}

// --- CRUD ---

function generateId(): string {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addContact(
  db: ContactsDB,
  contact: Omit<Contact, "id" | "status" | "sequenceStep" | "dateAdded">
): Contact | null {
  // Deduplicate
  const existing = findContact(db, contact.email, contact.companyName);
  if (existing) {
    return null; // Already exists
  }

  const newContact: Contact = {
    ...contact,
    id: generateId(),
    status: "new",
    sequenceStep: 0,
    dateAdded: new Date().toISOString().split("T")[0],
  };

  db.contacts.push(newContact);
  return newContact;
}

export function updateContactStatus(
  db: ContactsDB,
  contactId: string,
  updates: Partial<
    Pick<Contact, "status" | "sequenceStep" | "lastEmailed" | "nextFollowUp" | "notes">
  >
): void {
  const contact = db.contacts.find((c) => c.id === contactId);
  if (contact) {
    Object.assign(contact, updates);
  }
}

export function getContactsDueForFollowUp(db: ContactsDB): Contact[] {
  const today = new Date().toISOString().split("T")[0];
  return db.contacts.filter(
    (c) =>
      c.nextFollowUp &&
      c.nextFollowUp <= today &&
      c.status !== "unsubscribed" &&
      c.status !== "bounced" &&
      c.status !== "replied" &&
      c.status !== "booked" &&
      c.status !== "sequence_complete"
  );
}

export function unsubscribeContact(db: ContactsDB, email: string): boolean {
  const contact = db.contacts.find(
    (c) => c.email.toLowerCase() === email.toLowerCase()
  );
  if (contact) {
    contact.status = "unsubscribed";
    contact.nextFollowUp = undefined;
    return true;
  }
  return false;
}

// --- Stats ---

export function getContactStats(db: ContactsDB) {
  const total = db.contacts.length;
  const byStatus: Record<string, number> = {};
  for (const c of db.contacts) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
  }
  return { total, byStatus };
}
