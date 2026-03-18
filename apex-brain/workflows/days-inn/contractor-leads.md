# Contractor Lead Generation - Days Inn Cambridge
schedule: daily

## Objective
Find construction, oil & gas, FEMA/emergency, and trucking contractors with active projects near Cambridge, OH (Guernsey County) and generate outreach emails to book hotel rooms.

## Steps
1. **Scrape Sources** - Pull active projects from ODOT, SAM.gov, Ohio DNR, FEMA, BidExpress, Corpay/trucking
2. **Qualify Leads** - Score by proximity, crew size, duration; deduplicate across sources
3. **Draft Outreach** - Personalized hotel pitch per contractor with real pricing and images
4. **Send Digest** - Email daily lead report to hkapuria@gmail.com and ahkapuria@gmail.com
5. **Archive** - Save leads JSON to outputs/days-inn/leads/

## Skills Used
- email-outreach

## Tools Used
- automations/src/trigger/contractor-leads/daily-pipeline.ts

## Notes
This workflow runs as a dedicated Trigger.dev task (not through the orchestrator)
because it requires HTTP scraping of external data sources.
Task ID: days-inn-contractor-leads
Schedule: 0 12 * * * (8am ET daily)
