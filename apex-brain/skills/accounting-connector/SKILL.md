# Accounting Connector

Provider-abstracted accounting integration for invoices, expenses, and financial summaries across all entities.

## What It Does
- Pulls invoices, expenses, and payments from accounting providers (Wave, Zoho, QuickBooks)
- Normalizes data into a unified format regardless of provider
- AI-powered expense categorization and anomaly detection
- Generates per-entity financial summaries for the dashboard
- Syncs on schedule via Trigger.dev or on-demand via dashboard chat

## Supported Providers
- **WaveApps** (default) — GraphQL API, OAuth 2.0. Requires Pro Plan for API access.
- **Zoho Books** — REST API. Better coverage, good free tier. Recommended migration target.
- **QuickBooks Online** — REST API via Intuit. Most feature-complete but priciest.

## Architecture
```
Provider Layer (wave_connector.py / zoho_connector.py)
    ↓ normalized JSON
Accounting Sync Task (Trigger.dev)
    ↓ outputs/[entity]/financials/
Dashboard API (/api/accounting)
    ↓
Financial Overview Component
```

## Inputs
- Entity name (maps to a business in the accounting provider)
- Provider config (which provider, API token env var name)
- Date range for queries
- Optional: specific invoice/expense IDs

## Outputs
- `outputs/[entity]/financials/summary_YYYY-MM.json` — monthly rollup
- `outputs/[entity]/financials/invoices_latest.json` — recent invoices
- `outputs/[entity]/financials/expenses_latest.json` — recent expenses
- Dashboard cards: revenue, outstanding, expenses, net

## Entity-Provider Mapping
Each entity that uses accounting should have a `financials.md` in its entity folder:
```markdown
## Accounting
**Provider:** wave
**Business ID:** <wave-business-id>
**Sync Schedule:** daily
**Categories:** legal-consulting, expert-fees, marketing, operations
```

## Environment Variables
- `WAVEAPPS_API_TOKEN` — Wave OAuth token (for Wave provider)
- `WAVEAPPS_BUSINESS_ID` — Default Wave business ID (can be overridden per entity)
- `ZOHO_BOOKS_TOKEN` — Zoho Books OAuth token (for Zoho provider)
- `ZOHO_ORG_ID` — Zoho organization ID

## Usage
```
# Sync all entities
python tools/wave_connector.py --action sync --entity all

# Pull invoices for NLC
python tools/wave_connector.py --action invoices --entity nlc --days 30

# Pull expenses for Titan Renovations
python tools/wave_connector.py --action expenses --entity titan-renovations --days 30

# Dry run
python tools/wave_connector.py --action sync --entity nlc --dry-run
```

## AI Augmentation
The sync task runs Claude on financial data to:
1. Auto-categorize uncategorized expenses
2. Flag unusual charges (>2x typical for that category)
3. Generate a natural-language financial summary per entity
4. Suggest invoice follow-ups for overdue payments

## Source
Custom-built for Apex Brain. Provider abstraction pattern inspired by Nango/Unified.to.
