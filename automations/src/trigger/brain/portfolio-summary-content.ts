/**
 * Portfolio Summary Content
 *
 * Single source of truth for the Apex Vision portfolio summary email.
 * Edit this file directly, or reply to the summary email with feedback
 * and process-portfolio-feedback.ts will update it automatically.
 */

export const PORTFOLIO_SUMMARY_VERSION = "2026-03-16";

export function buildPortfolioSummaryHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
  .wrap { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .header { background: #18181b; padding: 28px 32px; }
  .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
  .header p { color: #a1a1aa; margin: 4px 0 0; font-size: 13px; }
  .body { padding: 28px 32px; }
  h2 { font-size: 15px; font-weight: 700; color: #18181b; margin: 28px 0 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e4e4e7; padding-bottom: 8px; }
  h2:first-child { margin-top: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin-bottom: 8px; }
  th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; padding: 6px 8px; background: #fafafa; border-bottom: 1px solid #e4e4e7; }
  td { padding: 8px; border-bottom: 1px solid #f4f4f5; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .badge-yellow { background: #fef9c3; color: #b45309; }
  .badge-gray { background: #f4f4f5; color: #52525b; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .section-note { font-size: 12px; color: #71717a; margin: 0 0 12px; }
  .footer { background: #fafafa; border-top: 1px solid #e4e4e7; padding: 16px 32px; font-size: 12px; color: #71717a; }
  .footer strong { color: #52525b; }
</style>
</head>
<body>
<div class="wrap">

  <div class="header">
    <h1>Apex Vision — Portfolio Overview</h1>
    <p>Generated ${PORTFOLIO_SUMMARY_VERSION} · Reply with feedback to update this report</p>
  </div>

  <div class="body">

    <h2>Entities &amp; Status</h2>
    <table>
      <thead><tr><th>Entity</th><th>Type</th><th>Status</th><th>Key Next Step</th></tr></thead>
      <tbody>
        <tr>
          <td><strong>NLC</strong></td>
          <td>Medical-legal consulting</td>
          <td><span class="badge badge-green">Active</span></td>
          <td>Scale to 8+ cases/mo</td>
        </tr>
        <tr>
          <td><strong>ApexMedLaw</strong></td>
          <td>Holding company</td>
          <td><span class="badge badge-green">Active</span></td>
          <td>Launch critical care branch</td>
        </tr>
        <tr>
          <td><strong>A2Z Equity</strong></td>
          <td>Investment club</td>
          <td><span class="badge badge-green">Active</span></td>
          <td>Raise to $500k, 3+ deals</td>
        </tr>
        <tr>
          <td><strong>Club Haus</strong></td>
          <td>Barber parlor</td>
          <td><span class="badge badge-yellow">Launching</span></td>
          <td>Website + Square POS live</td>
        </tr>
        <tr>
          <td><strong>Titan Renovations</strong></td>
          <td>Cleanup/renovation</td>
          <td><span class="badge badge-yellow">Unstructured</span></td>
          <td>Website + invoicing setup</td>
        </tr>
        <tr>
          <td><strong>AI Influencer (Farah)</strong></td>
          <td>Instagram model</td>
          <td><span class="badge badge-blue">Pending activation</span></td>
          <td>Approve $127–177/mo budget + API keys</td>
        </tr>
        <tr>
          <td><strong>Porcupine Edu</strong></td>
          <td>Education + merch</td>
          <td><span class="badge badge-gray">Complete (test)</span></td>
          <td>Framework validation done</td>
        </tr>
      </tbody>
    </table>

    <h2>Revenue Snapshot</h2>
    <table>
      <thead><tr><th>Entity</th><th>Current Volume</th><th>Avg. Revenue / Unit</th><th>Est. Monthly Revenue</th><th>Notes</th></tr></thead>
      <tbody>
        <tr>
          <td><strong>NLC</strong></td>
          <td>3–4 cases/mo</td>
          <td>$1,500–$2,000 / case</td>
          <td>$4,500–$8,000</td>
          <td>Target: 8+ cases/mo (~$12k–$16k)</td>
        </tr>
        <tr>
          <td><strong>Club Haus</strong></td>
          <td>Pre-launch</td>
          <td>—</td>
          <td>—</td>
          <td>Targeting 5 barbers by end of Q2</td>
        </tr>
        <tr>
          <td><strong>A2Z Equity</strong></td>
          <td>—</td>
          <td>—</td>
          <td>—</td>
          <td>Investment vehicle; revenue via deal returns</td>
        </tr>
        <tr>
          <td><strong>Titan Renovations</strong></td>
          <td>—</td>
          <td>—</td>
          <td>—</td>
          <td>Unstructured; no invoicing yet</td>
        </tr>
      </tbody>
    </table>

    <h2>Automations Running</h2>
    <table>
      <thead><tr><th>Workflow</th><th>Schedule</th><th>What It Does</th><th>Status</th></tr></thead>
      <tbody>
        <tr>
          <td><strong>daily-morning</strong></td>
          <td>8am ET daily</td>
          <td>Runs orchestrator + scrapes trending content</td>
          <td><span class="badge badge-green">Live</span></td>
        </tr>
        <tr>
          <td><strong>weekly-monday</strong></td>
          <td>10am ET Monday</td>
          <td>Runs orchestrator + fetches 7-day analytics</td>
          <td><span class="badge badge-green">Live</span></td>
        </tr>
        <tr>
          <td><strong>auto-merge-claude</strong></td>
          <td>On push to claude/*</td>
          <td>Auto-creates PR + merges to main</td>
          <td><span class="badge badge-green">Live</span></td>
        </tr>
        <tr>
          <td><strong>Trigger.dev: status reports</strong></td>
          <td>Scheduled</td>
          <td>Dashboard + portfolio status generation</td>
          <td><span class="badge badge-green">Live</span></td>
        </tr>
        <tr>
          <td><strong>Trigger.dev: AI influencer pipeline</strong></td>
          <td>8am ET daily</td>
          <td>Full content → post pipeline for Farah</td>
          <td><span class="badge badge-blue">Scaffolded, pending</span></td>
        </tr>
      </tbody>
    </table>

    <h2>Python Tools</h2>
    <table>
      <thead><tr><th>Script</th><th>Purpose</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>orchestrator.py</td><td>Master scheduler — reads workflows, executes via Claude</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>post_to_linkedin.py</td><td>LinkedIn API v2 posting</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>post_to_twitter.py</td><td>Twitter API v2 tweets</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>send_email.py</td><td>Gmail/SMTP email sending</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>fetch_analytics.py</td><td>Google Analytics data pull</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>scrape_trending.py</td><td>GitHub trending + TrendShift</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>wave_connector.py</td><td>WaveApps accounting sync</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>generate_status_report.py</td><td>Portfolio status reports</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>browser_agent.py</td><td>Playwright browser automation</td><td><span class="badge badge-gray">Template only</span></td></tr>
        <tr><td>deploy_to_vercel.py</td><td>Triggers Vercel deployments</td><td><span class="badge badge-green">Complete</span></td></tr>
      </tbody>
    </table>

    <h2>Skills</h2>
    <table>
      <thead><tr><th>Skill</th><th>Source</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>social-media-content</td><td>Community</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>seo-content</td><td>Community</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>email-outreach</td><td>Community</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>competitor-analysis</td><td>Community</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>trend-scout</td><td>Community</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>browser-automation</td><td>ComposioHQ</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>frontend-design</td><td>Superpowers</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>google-ads</td><td>Community</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>cli-anything</td><td>HKUDS</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>accounting-connector</td><td>Custom</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>status-report</td><td>Custom</td><td><span class="badge badge-green">Complete</span></td></tr>
        <tr><td>skill-creator</td><td>Anthropic</td><td><span class="badge badge-green">Complete</span></td></tr>
      </tbody>
    </table>

    <h2>Workflows (SOPs)</h2>
    <table>
      <thead><tr><th>Entity</th><th>Workflows</th></tr></thead>
      <tbody>
        <tr><td><strong>NLC</strong></td><td>LinkedIn content, Instagram content, law-firm outreach, physician recruitment, CRM lead management</td></tr>
        <tr><td><strong>A2Z Equity</strong></td><td>Opportunity scouting, investor reporting</td></tr>
        <tr><td><strong>AI Influencer</strong></td><td>Character setup, content pipeline, video production, growth strategy, monetization funnel</td></tr>
        <tr><td><strong>Club Haus</strong></td><td>Website launch, barber onboarding</td></tr>
        <tr><td><strong>Titan Renovations</strong></td><td>Website launch</td></tr>
        <tr><td><strong>ApexMedLaw</strong></td><td>Specialty branch launch</td></tr>
        <tr><td><strong>Porcupine Edu</strong></td><td>SEO content pipeline, merch store setup</td></tr>
        <tr><td><strong>Portfolio</strong></td><td>Status report generation</td></tr>
      </tbody>
    </table>

    <h2>Integrations</h2>
    <table>
      <thead><tr><th>Service</th><th>Purpose</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>Anthropic (Claude)</td><td>All AI generation</td><td><span class="badge badge-green">Active</span></td></tr>
        <tr><td>LinkedIn API</td><td>Post publishing</td><td><span class="badge badge-green">Configured</span></td></tr>
        <tr><td>Twitter API v2</td><td>Post publishing</td><td><span class="badge badge-green">Configured</span></td></tr>
        <tr><td>Google Analytics</td><td>Metrics pull</td><td><span class="badge badge-green">Configured</span></td></tr>
        <tr><td>WaveApps (GraphQL)</td><td>Accounting</td><td><span class="badge badge-green">Configured</span></td></tr>
        <tr><td>Vercel</td><td>Deployments</td><td><span class="badge badge-green">Configured</span></td></tr>
        <tr><td>Resend</td><td>Email delivery + inbound replies</td><td><span class="badge badge-green">Active</span></td></tr>
        <tr><td>NextAuth (Google OAuth)</td><td>Dashboard auth</td><td><span class="badge badge-green">Live</span></td></tr>
        <tr><td>GitHub API (Octokit)</td><td>Repo operations from automations</td><td><span class="badge badge-green">Active</span></td></tr>
        <tr><td>Replicate (Flux + Kling)</td><td>Image training + video generation</td><td><span class="badge badge-blue">Pending</span></td></tr>
        <tr><td>ElevenLabs</td><td>Voice cloning for AI influencer</td><td><span class="badge badge-blue">Pending</span></td></tr>
        <tr><td>Instagram Graph API</td><td>Reels/post publishing</td><td><span class="badge badge-blue">Scaffolded</span></td></tr>
      </tbody>
    </table>

    <h2>Pending / Blockers</h2>
    <table>
      <thead><tr><th>Item</th><th>What's Needed</th><th>Priority</th></tr></thead>
      <tbody>
        <tr><td><strong>AI Influencer activation</strong></td><td>Replicate, ElevenLabs, Instagram API keys + $127–177/mo</td><td><span class="badge badge-yellow">Decision needed</span></td></tr>
        <tr><td><strong>NLC end-to-end posting</strong></td><td>LinkedIn/Instagram auto-post not running yet</td><td><span class="badge badge-yellow">High</span></td></tr>
        <tr><td><strong>Club Haus website + POS</strong></td><td>Build Next.js site + Square integration</td><td><span class="badge badge-yellow">High</span></td></tr>
        <tr><td><strong>Titan Renovations</strong></td><td>Website + invoicing unstarted</td><td><span class="badge badge-gray">Medium</span></td></tr>
        <tr><td><strong>Dashboard approval queue</strong></td><td>Not yet wired to automation outputs</td><td><span class="badge badge-gray">Medium</span></td></tr>
        <tr><td><strong>CRM integration</strong></td><td>No system yet — leads via forms/email only</td><td><span class="badge badge-gray">Medium</span></td></tr>
      </tbody>
    </table>

    <h2>Reminders</h2>
    <table>
      <thead><tr><th>Due</th><th>Action</th><th>Context</th></tr></thead>
      <tbody>
        <tr>
          <td><strong>2026-03-18</strong></td>
          <td>Complete Meta Business Portfolio verification</td>
          <td>Needed to create Developer App → get Instagram Graph API token → activate Farah pipeline. Go to business.facebook.com/settings → Authorizations and verifications → complete identity verification started 2026-03-16.</td>
        </tr>
      </tbody>
    </table>

    <h2>Q2 2026 Targets</h2>
    <table>
      <thead><tr><th>Entity</th><th>Target</th></tr></thead>
      <tbody>
        <tr><td><strong>NLC</strong></td><td>8+ cases/mo (from 3–4), 2+ new law firm relationships</td></tr>
        <tr><td><strong>A2Z Equity</strong></td><td>$500k raised, 3+ vetted opportunities</td></tr>
        <tr><td><strong>ApexMedLaw</strong></td><td>Critical care branch live</td></tr>
        <tr><td><strong>Club Haus</strong></td><td>Website live, Square POS, 5 barbers onboarded by end of Q2</td></tr>
        <tr><td><strong>Abhi</strong></td><td>Meeting hours reduced 50% via AI feedback loops</td></tr>
      </tbody>
    </table>

  </div>

  <div class="footer">
    <strong>Reply to this email</strong> with any changes you'd like — formatting, missing data, new sections, anything. Claude will update this report for future runs automatically.
  </div>

</div>
</body>
</html>`;
}