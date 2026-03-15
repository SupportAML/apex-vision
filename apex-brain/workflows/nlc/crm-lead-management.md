# CRM Lead Management - NLC

## Objective
Qualify inbound leads, send relevant docs, and move them through the pipeline with minimal human input.

## Trigger
New lead enters system (form submission, email inquiry, LinkedIn message)

## Steps
1. **Capture** - Log lead details (name, firm, case type, source)
2. **Qualify** - Check if case type matches NLC specialties, firm size, jurisdiction
3. **Respond** - Auto-send acknowledgment email with relevant case studies
4. **Assign** - Match to best physician based on specialty and availability
5. **Follow-up** - If no response in 48 hours, send follow-up with additional materials
6. **Escalate** - If high-value lead (large firm, complex case), flag for Abhi's direct attention

## Skills Used
- email-outreach

## Tools Used
- tools/send_email.py

## Output
- Lead status updates in CRM
- Email logs in outputs/nlc/crm/
