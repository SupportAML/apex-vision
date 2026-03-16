# Google Workspace Go-Live Checklist

**For: ahkapuria@gmail.com**
**Date: 2026-03-15**

---

## PHASE 1: AUTHENTICATION (Do First)

- [ ] 1. Install the `gws` CLI (`npm install -g @anthropic-ai/gws` or follow the googleworkspace/cli repo instructions)
- [ ] 2. Run `gws auth login` from the apex-vision directory to authenticate via browser-based OAuth
- [ ] 3. Verify auth works by running `gws gmail triage` — you should see your unread inbox summary
- [ ] 4. If using a service account instead, set `GOOGLE_APPLICATION_CREDENTIALS` env var pointing to your JSON key file

## PHASE 2: ENVIRONMENT VARIABLES

- [ ] 5. Copy `apex-brain/.env.example` to `apex-brain/.env` and fill in:
  - `GOOGLE_CLIENT_ID` (from Google Cloud Console > APIs & Credentials)
  - `GOOGLE_CLIENT_SECRET` (same location)
  - `SMTP_USER` (your Gmail address)
  - `SMTP_PASSWORD` (Gmail App Password — generate at myaccount.google.com > Security > App Passwords)
  - `GOOGLE_ANALYTICS_ID` (your GA4 Measurement ID, format: G-XXXXXXXXXX)
  - `GOOGLE_ANALYTICS_TOKEN` (GA4 API credentials)
- [ ] 6. Add the same variables to Vercel for the dashboard deployment (Settings > Environment Variables)

## PHASE 3: GOOGLE CLOUD PROJECT

- [ ] 7. Go to console.cloud.google.com and create a project (or use existing one)
- [ ] 8. Enable these APIs in the project:
  - Gmail API
  - Google Calendar API
  - Google Drive API
  - Google Docs API
  - Google Sheets API
  - Google Chat API
  - Google Analytics Data API (GA4)
  - Google People API
  - Google Tasks API
  - Google Forms API
- [ ] 9. Set up OAuth consent screen (External or Internal depending on your Workspace plan)
- [ ] 10. Add authorized redirect URIs for your dashboard (localhost:3000 for dev, your Vercel domain for prod)

## PHASE 4: VERIFY CORE SERVICES

- [ ] 11. Test Gmail: `gws gmail triage`
- [ ] 12. Test Calendar: `gws calendar agenda`
- [ ] 13. Test Drive: `gws drive list`
- [ ] 14. Test Sheets: `gws sheets read <spreadsheet-id>` on a test sheet
- [ ] 15. Test email sending: `/gws-gmail-send` skill to send yourself a test email

## PHASE 5: CONNECT WORKFLOWS

- [ ] 16. Update entity workflows (NLC, Club Haus, A2Z Equity) to use GWS skills directly:
  - Email outreach via `gws-gmail-send` (instead of raw SMTP)
  - Calendar scheduling via `gws-calendar-insert`
  - Document generation via `gws-docs-write`
  - Lead tracking via `gws-sheets-append`
- [ ] 17. Set up Gmail watch (`gws-gmail-watch`) for automated email triage on key accounts
- [ ] 18. Configure GitHub Actions secrets with Google credentials for scheduled automation runs

## PHASE 6: DASHBOARD GO-LIVE

- [ ] 19. Deploy dashboard to Vercel with all env vars set
- [ ] 20. Test Google OAuth sign-in on the live dashboard
- [ ] 21. Verify Google Analytics data is flowing to the analytics dashboard

---

## Current Status

**Done:**
- All 93 Google Workspace skills installed and symlinked
- Dashboard built with Google OAuth (NextAuth.js)
- Gmail SMTP tool built (`tools/send_email.py`)
- Google Analytics tool built (`tools/fetch_analytics.py`)
- Skill registry documented

**Not done yet:**
- GWS CLI installation and authentication (`gws auth login`)
- Google Cloud API enablement
- Production env vars (`.env` file and Vercel)
- Workflows wired to use GWS skills directly
- Gmail watch / automated triage
- GitHub Actions secrets for scheduled runs

**Start with Phase 1 — once auth works, everything else flows from there.**
