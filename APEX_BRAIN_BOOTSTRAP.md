# APEX BRAIN — Master Bootstrap Instructions

You are building a self-improving AI operating system. This is a single GitHub repo that serves as the brain for all of the user's businesses, with a dashboard for monitoring, feedback, and chat-based control. Read this entire document before doing anything.

## PHASE 0: Learn About the User

Before building anything, you need to know who you're building for. Ask the user these questions ONE SECTION AT A TIME. Wait for answers before moving on. Do not prefill anything. Do not assume.

### Section 1: About You
- What's your name?
- What do you do in one sentence?
- What's your #1 priority — the thing everything else should support?
- What's your timezone?

### Section 2: Your Companies / Ventures
- List every company, business, or venture you're running or involved in
- For each one: name, one-line description, your role, current status (active, launching, planning)
- Which one matters most right now?

### Section 3: Your Team
- Who are the key people I should know about? (name, role, which entities they touch)
- Who needs dashboard access and what should they be able to see/do?
- What's your biggest pain point managing people?

### Section 4: What You Want This System To Do
- What are the 3-5 things eating your time that you'd hand off first?
- Any specific workflows you want automated? (content, marketing, reports, etc.)
- What tools do you already use? (Notion, Google Workspace, Slack, etc.)

### Section 5: Communication Style
- How do you like information presented?
- Any writing pet peeves?
- What tone for internal vs external content?

Store all answers. You'll use them to populate every file.

---

## PHASE 1: Build the Repo Structure

Initialize a git repo. Create this exact structure:

```
apex-brain/
├── CLAUDE.md                          # The brain file (instructions for Claude Code)
├── CLAUDE.local.md                    # Personal overrides (gitignored)
├── .gitignore
├── .env.example                       # Template for required API keys
├── .claude/
│   ├── settings.json
│   └── rules/
│       └── communication-style.md     # From Section 5 answers
├── context/
│   ├── me.md                          # From Section 1
│   ├── priorities.md                  # From Section 4
│   └── goals.md                       # Derived from priorities
├── team/                              # One file per person from Section 3
│   └── [name].md                      # Role, permissions, entities they access
├── entities/                          # One folder per company from Section 2
│   └── [company-name]/
│       ├── config.md                  # Name, description, brand voice, audience
│       ├── goals.md                   # Measurable targets
│       └── brand.md                   # Tone, style, dos/donts
├── skills/                            # Modular abilities (start empty, populate below)
├── workflows/                         # Multi-step processes per entity
│   └── [entity]/
│       └── [workflow-name].md
├── tools/                             # Python scripts for execution
├── outputs/                           # Generated content per entity
│   └── [entity]/
├── decisions/
│   └── log.md                         # Append-only decision log
├── archives/                          # Old/completed material
├── .github/
│   └── workflows/                     # GitHub Actions cron files
└── dashboard/                         # Next.js dashboard app (built in Phase 3)
```

For empty directories, add `.gitkeep`.

### CLAUDE.md Template

Keep UNDER 150 lines. Use this structure:

```markdown
# Apex Brain

You are [USER NAME]'s AI operating system across all business entities.

## Top Priority
[From Section 1 answer]

## Context
@context/me.md
@context/priorities.md
@context/goals.md

## Team
@team/ (one file per team member with role and permissions)

## Entities
@entities/ (one folder per business — each has config.md, goals.md, brand.md)

## How This System Works

### Skills (what you know how to do)
Skills live in `skills/`. Each skill is a folder with a SKILL.md file.
Skills are reusable across entities. When you need an ability, check skills/ first.
If a skill doesn't exist for a task, search for one online before building from scratch.

### Workflows (processes that use skills)
Workflows live in `workflows/[entity]/`. Each is a markdown SOP.
A workflow defines: objective, steps, which skills to use, which tools to call, what to output.
Workflows run on schedule via GitHub Actions or on-demand via dashboard chat.

### Tools (scripts that do mechanical work)
Tools live in `tools/`. Python scripts, zero or minimal dependencies.
API calls, data fetching, posting, scraping. Deterministic and testable.

### Decision Log
@decisions/log.md — append-only. Log every meaningful decision with date, reasoning, context.

## Self-Improvement Rules
1. When a workflow fails, fix the tool, update the workflow, log what you learned.
2. When feedback is given on a skill, update the skill file permanently.
3. When an example of "good output" is provided, save it in the skill's examples/ folder.
4. Track which skill+workflow combos get the most approvals. Favor those in future runs.
5. Weekly: check if any skills are outdated. Search for better alternatives.
6. When proposing changes that cost money or affect external services, always ask for approval.

## Keeping Context Current
- Update context/priorities.md when focus shifts
- Update [entity]/goals.md when targets change
- Log decisions in decisions/log.md
- Archive completed material to archives/
- Never delete, always archive

## Skills to Build Backlog
[Populated from Section 4 answers — what the user wants automated]
```

---

## PHASE 2: Install Skills

Before writing any skills from scratch, search for existing ones:

### Required searches (run these):
1. Search GitHub for: `alirezarezvani/claude-skills` — 180+ production skills with Python tools
2. Search GitHub for: `VoltAgent/awesome-agent-skills` — 500+ curated skills
3. Search GitHub for: `anthropics/skills` — official Anthropic skills
4. Search GitHub for: `ComposioHQ/awesome-claude-skills` — community curated list
5. Search GitHub for: `obra/superpowers` — Claude Code superpowers library

### Skill selection criteria:
- Does this skill serve any of the user's entities?
- Does it have good documentation (clear SKILL.md)?
- Is it actively maintained (commits in last 3 months)?
- Does it solve something the user asked for in Section 4?

### Minimum skills to install (find best version of each):
- **frontend-design** — for building websites and landing pages
- **seo-content** — for blog posts and SEO optimization
- **social-media-content** — for LinkedIn, Twitter, Instagram posts
- **google-ads** — for ad campaign creation
- **competitor-analysis** — for monitoring competition
- **trend-scout** — for watching GitHub trending, Trendshift, Product Hunt
- **browser-automation** — Playwright/Puppeteer for sites without APIs
- **email-outreach** — for cold email and newsletter content

For each skill installed, note where it came from in a `skills/REGISTRY.md` file:
```
| Skill | Source | Installed | Version |
|-------|--------|-----------|---------|
| frontend-design | anthropics/skills | 2026-03-14 | latest |
```

---

## PHASE 3: Build the Dashboard

### Step 1: Find and clone the best dashboard template

Search GitHub for: `shadcn admin dashboard nextjs` — find the most starred, actively maintained one. Requirements:
- Next.js 15+ with App Router
- shadcn/ui components
- Sidebar navigation
- Chart components (recharts or similar)
- TypeScript

Clone it into `dashboard/`.

### Step 2: Customize the dashboard

The dashboard needs these features. Build them in this order:

#### A. Entity Tabs (top navigation)
One tab per entity from `entities/`. Read entity names from the repo. The selected tab filters everything below it.

#### B. Workflow Status View
For each entity, show its workflows from `workflows/[entity]/`. Each workflow shows:
- Name and last run time
- Steps as a horizontal pipeline (like: Research → Draft → Review → Publish)
- Status per step (done, running, waiting, failed)
- Click any step to see its output and give feedback

#### C. Approval Queue
Show all outputs waiting for review. For each:
- Render the output visually (not just text — if it's a website, show iframe; if it's an ad, show the ad preview; if it's a post, show formatted post)
- Buttons: Approve, Give Feedback, Reject, Edit Manually
- Feedback box that accepts text + optional example attachment

#### D. Chat Interface
Integrate Vercel AI SDK (`npm install ai @ai-sdk/anthropic`). Two modes:

**Business mode**: Talks to agents about your businesses.
- "We're not getting traction on LinkedIn" → generates multiple strategy options
- "Drop Twitter to 3x/day" → updates workflow file, shows confirmation
- Generic input → thinks about it, proposes options with previews

**System mode**: Changes the system itself.
- "Add OAuth" → plans the code change, builds it on approval
- "Give Ovi access to NLC" → updates team file, shows diff
- "Add a new workflow for email outreach" → creates workflow file

The chat calls the Anthropic API with the full CLAUDE.md context. It can read and write to the repo.

#### E. Metrics Dashboard
Per entity: key numbers from goals.md. Pull from analytics APIs when connected.
Show: target vs actual, trend arrow, last updated.

#### F. Intervention Timeline (can be V2 — add placeholder)
Chart showing who changed what and what happened after. Leave as a placeholder card that says "Intervention tracking — coming soon" for now.

#### G. Authentication
Install NextAuth.js with Google OAuth. Map users to team/ files for role-based access.
Each team member sees only the entities listed in their team file.

### Step 3: Deploy
- Push dashboard/ to the GitHub repo
- Connect to Vercel for auto-deploy
- Set environment variables (ANTHROPIC_API_KEY, NEXTAUTH_SECRET, etc.)

---

## PHASE 4: Build Tools

Create these Python scripts in `tools/`. Keep each under 100 lines. Use only stdlib + requests where possible.

- `tools/post_to_linkedin.py` — LinkedIn API v2 post
- `tools/post_to_twitter.py` — Twitter API v2 tweet
- `tools/fetch_analytics.py` — Pull basic metrics from Google Analytics / LinkedIn
- `tools/deploy_to_vercel.py` — Trigger Vercel deployment via API
- `tools/scrape_trending.py` — Scrape GitHub trending + Trendshift
- `tools/browser_agent.py` — Playwright script template for sites without APIs
- `tools/send_email.py` — Send email via Gmail API or SMTP

Each tool should:
- Read credentials from environment variables (never hardcoded)
- Accept arguments via command line
- Return JSON output
- Handle errors gracefully with clear messages
- Include a `--dry-run` flag that shows what would happen without executing

---

## PHASE 5: Set Up Scheduling

Create GitHub Actions workflow files in `.github/workflows/`:

### daily-morning.yml
```yaml
name: Daily Morning Run
on:
  schedule:
    - cron: '0 12 * * *'  # 8am ET
  workflow_dispatch:       # Manual trigger

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Run daily workflows
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          # Add other API keys as secrets
        run: |
          # This is where Claude Code or a Python orchestrator
          # reads workflows/ and executes the daily ones
          echo "Daily run placeholder — wire to orchestrator"
```

### weekly-monday.yml
Same structure, `cron: '0 14 * * 1'` (10am ET Monday).
Runs: competitor analysis, metrics rollup, system improvement check.

### Note: The cron jobs need an orchestrator script
Create `tools/orchestrator.py` that:
1. Reads all workflow files
2. Checks which ones are scheduled for today
3. Executes them step by step
4. Writes outputs to `outputs/[entity]/`
5. Logs results to a run log

---

## PHASE 6: Test With a Sample Project

Once the system is built, test it with this prompt in the dashboard chat:

> "I'm building an educational website about porcupines. I want it to have the #1 spot in Google search with the most visitors and a place to buy porcupine T-shirts that you can customize with your name on it."

The system should:
1. Create a new entity: `entities/porcupine-edu/`
2. Decompose this into workstreams (website, SEO, merch store)
3. For the website: search for the best frontend-design skill available, use it
4. For SEO: create a content workflow targeting "porcupine facts", "porcupine habitat", etc.
5. For merch: research best print-on-demand integrations (Printful, Printify), propose one
6. For each workstream: generate outputs, queue for review
7. Deploy the website to Vercel
8. Set up monitoring: track search rankings, traffic, shirt sales

This tests: entity creation, skill selection, workflow generation, tool execution, output review, and deployment. If this works, the real companies will work.

---

## IMPORTANT RULES

1. **Never build from scratch if a community skill exists.** Always search first.
2. **Skills that get approved more often should be favored.** Track approval rates.
3. **When the user gives feedback, update the source file permanently.** Not just the current run.
4. **Every output needs visual review when the output is visual.** Render ads as ads, sites as sites, posts as formatted posts. Never show raw text for visual content.
5. **Propose multiple options when the task is creative.** At least 2-3 variations.
6. **When paused mid-build, commit state to Git.** Everything is resumable.
7. **System improvements get proposed as approval cards.** The AI should suggest dashboard features, new workflows, better skills — but always with approval.
8. **The dashboard can modify itself.** System mode chat writes code, commits, Vercel auto-deploys.
9. **Minimize human intervention.** The goal is always: do the thing, queue for review only when necessary. If the change is low-risk and reversible, just do it and show what you did.
10. **Track every intervention.** Who changed what, when, and what happened after. This data feeds the intervention timeline.

---

## GETTING STARTED

If you are Claude Code reading this for the first time:

1. Start with Phase 0. Ask the user questions.
2. Build Phase 1 based on their answers.
3. Run Phase 2 skill search and installation.
4. Build Phase 3 dashboard (this is the longest phase).
5. Build Phase 4 tools.
6. Set up Phase 5 scheduling.
7. Run Phase 6 test.
8. Commit everything and deploy.

If the user says "skip onboarding" or "use what you know about me", check if context files already exist and proceed from wherever the build left off.

If the user wants to run parallel sessions:
- **Session 1**: Phase 0 + 1 + 2 (brain + skills)
- **Session 2**: Phase 3 (dashboard)
- **Session 3**: Phase 4 + 5 (tools + scheduling)

All three can start simultaneously. Session 2 doesn't depend on Session 1 — it reads entity names from a config file that Session 1 creates first.
