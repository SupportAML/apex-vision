"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Check, X, MessageSquare, Edit3, Plug, Key, Loader2, CheckCircle2,
  ExternalLink, DollarSign, Clock, ChevronDown, ChevronUp, Shield,
} from "lucide-react";
import { useState } from "react";

export interface ApprovalItem {
  id: string;
  entity: string;
  workflow: string;
  step: string;
  type: "post" | "email" | "website" | "ad" | "document" | "connector";
  title: string;
  content: string;
  createdAt: string;
  actionLabel?: string;
  envVars?: string[];
}

interface ConnectorGuide {
  id: string;
  entity: string;
  workflow: string;
  title: string;
  icon: string;
  cost: string;
  costNote: string;
  timeEstimate: string;
  envVars: string[];
  steps: { label: string; detail: string; url?: string }[];
  whatItUnlocks: string[];
}

const connectorGuides: ConnectorGuide[] = [
  {
    id: "c1",
    entity: "System",
    workflow: "Authentication",
    title: "Google OAuth",
    icon: "G",
    cost: "Free",
    costNote: "No charges. Part of Google Cloud free tier.",
    timeEstimate: "10 min",
    envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXTAUTH_SECRET"],
    steps: [
      {
        label: "Go to Google Cloud Console",
        detail: "Sign in with your Google account. Create a new project or select existing.",
        url: "https://console.cloud.google.com/apis/credentials",
      },
      {
        label: "Create OAuth 2.0 Client ID",
        detail: "Click \"+ CREATE CREDENTIALS\" at top, choose \"OAuth client ID\". Select \"Web application\" as type.",
      },
      {
        label: "Set Authorized Redirect URIs",
        detail: "Add: http://localhost:3000/api/auth/callback/google (for dev). Add your production URL later.",
      },
      {
        label: "Copy Client ID and Client Secret",
        detail: "Google shows them after creation. Paste both below.",
      },
      {
        label: "Generate a NEXTAUTH_SECRET",
        detail: "Run this in terminal: openssl rand -base64 32 and paste the output below.",
      },
    ],
    whatItUnlocks: ["Team login via Google accounts", "Role-based dashboard access per team member"],
  },
  {
    id: "c2",
    entity: "NLC",
    workflow: "LinkedIn Content",
    title: "LinkedIn API",
    icon: "in",
    cost: "Free",
    costNote: "LinkedIn API is free for posting to your own company pages.",
    timeEstimate: "15 min",
    envVars: ["LINKEDIN_ACCESS_TOKEN"],
    steps: [
      {
        label: "Create a LinkedIn App",
        detail: "Log in and create a new app. Associate it with the NLC company page.",
        url: "https://www.linkedin.com/developers/apps/new",
      },
      {
        label: "Request products",
        detail: "In your app, go to Products tab. Request \"Share on LinkedIn\" and \"Sign In with LinkedIn using OpenID Connect\".",
      },
      {
        label: "Verify your company page",
        detail: "LinkedIn requires you to be a super admin of the NLC company page. Go to the Settings tab and verify.",
      },
      {
        label: "Generate an access token",
        detail: "Go to Auth tab. Use the OAuth 2.0 tools to generate a token with w_member_social and w_organization_social scopes. Token lasts 60 days.",
        url: "https://www.linkedin.com/developers/tools/oauth",
      },
      {
        label: "Paste the access token below",
        detail: "Note: you will need to refresh this token every 60 days. We can automate this later.",
      },
    ],
    whatItUnlocks: ["Auto-post to NLC LinkedIn company page", "Track post engagement and follower growth", "LinkedIn metrics in dashboard"],
  },
  {
    id: "c3",
    entity: "All Entities",
    workflow: "Website Metrics",
    title: "Google Analytics",
    icon: "GA",
    cost: "Free",
    costNote: "GA4 is free for up to 10M events/month. More than enough.",
    timeEstimate: "20 min",
    envVars: ["GOOGLE_ANALYTICS_ID", "GOOGLE_ANALYTICS_TOKEN"],
    steps: [
      {
        label: "Set up GA4 properties",
        detail: "Create a GA4 property for each entity website (NLC, Club Haus, etc). Note the Measurement ID (starts with G-).",
        url: "https://analytics.google.com/analytics/web/#/a/p/admin",
      },
      {
        label: "Create a service account",
        detail: "In Google Cloud Console, go to IAM & Admin > Service Accounts. Create one named 'apex-brain-analytics'.",
        url: "https://console.cloud.google.com/iam-admin/serviceaccounts",
      },
      {
        label: "Enable the Analytics Data API",
        detail: "Search for 'Google Analytics Data API' in the API Library and enable it.",
        url: "https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com",
      },
      {
        label: "Grant access in GA4",
        detail: "In GA4 Admin > Property Access Management, add the service account email as a Viewer.",
      },
      {
        label: "Download the JSON key",
        detail: "In Cloud Console, go to the service account > Keys > Add Key > JSON. Paste the file contents as GOOGLE_ANALYTICS_TOKEN.",
      },
    ],
    whatItUnlocks: ["Website traffic for NLC, Club Haus, Titan, Porcupine Edu", "Visitor counts, bounce rate, top pages in metrics dashboard", "Trend arrows that actually update"],
  },
  {
    id: "c4",
    entity: "All Entities",
    workflow: "SEO Tracking",
    title: "Google Search Console",
    icon: "SC",
    cost: "Free",
    costNote: "Completely free. Uses same Google service account as Analytics.",
    timeEstimate: "10 min",
    envVars: ["GOOGLE_SEARCH_CONSOLE_SITE_URL"],
    steps: [
      {
        label: "Add your sites to Search Console",
        detail: "Add each entity website as a property. Choose 'URL prefix' method for simplicity.",
        url: "https://search.google.com/search-console",
      },
      {
        label: "Verify ownership",
        detail: "Use the HTML tag method or DNS verification. If you set up GA4 already, it may auto-verify.",
      },
      {
        label: "Grant service account access",
        detail: "In Search Console > Settings > Users and permissions, add the same service account email from GA setup as a Full user.",
      },
      {
        label: "Paste your primary site URL below",
        detail: "Example: https://neurologylegalconsulting.com. We will auto-discover other verified sites.",
      },
    ],
    whatItUnlocks: ["Keyword ranking positions for all entity sites", "Search impressions and click-through rates", "SEO performance tracking in metrics"],
  },
  {
    id: "c5",
    entity: "Club Haus",
    workflow: "POS & Bookings",
    title: "Square POS",
    icon: "SQ",
    cost: "2.6% + $0.10 per transaction",
    costNote: "Square charges per transaction. No monthly fee for standard plan. Free plan works fine.",
    timeEstimate: "15 min",
    envVars: ["SQUARE_ACCESS_TOKEN", "SQUARE_LOCATION_ID"],
    steps: [
      {
        label: "Create a Square Developer account",
        detail: "Use the same Square account that Club Haus will use for POS.",
        url: "https://developer.squareup.com/apps",
      },
      {
        label: "Create an application",
        detail: "Click 'New Application', name it 'Apex Brain - Club Haus'. This creates sandbox and production credentials.",
      },
      {
        label: "Get your production access token",
        detail: "Switch to Production mode (toggle at top). Go to Credentials tab. Copy the Access Token.",
      },
      {
        label: "Find your Location ID",
        detail: "Go to Locations in the Square Dashboard. Your Location ID is in the URL or shown on the location details page.",
        url: "https://squareup.com/dashboard/locations",
      },
    ],
    whatItUnlocks: ["Real-time booking and revenue data for Club Haus", "Transaction volume and average ticket metrics", "Square POS status in dashboard"],
  },
  {
    id: "c6",
    entity: "NLC",
    workflow: "Social Media",
    title: "Twitter / X",
    icon: "X",
    cost: "Free tier: read + post. Basic: $100/mo",
    costNote: "Free tier allows posting and reading your own tweets. Basic ($100/mo) adds higher rate limits. Start free.",
    timeEstimate: "15 min",
    envVars: ["TWITTER_API_KEY", "TWITTER_API_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_SECRET"],
    steps: [
      {
        label: "Apply for a Developer account",
        detail: "Log in with the NLC Twitter account. Apply for 'Free' access to start. Describe use as 'automated content posting for business'.",
        url: "https://developer.x.com/en/portal/petition/essential/basic-info",
      },
      {
        label: "Create a Project and App",
        detail: "In the Developer Portal, create a project. Name the app 'NLC Content Bot'. Set permissions to Read and Write.",
        url: "https://developer.x.com/en/portal/projects-and-apps",
      },
      {
        label: "Generate API keys",
        detail: "Under Keys and Tokens, generate: API Key, API Secret, Access Token, Access Token Secret. All four are needed.",
      },
      {
        label: "Paste all four values below",
        detail: "Keep these secret. They give full read/write access to the NLC Twitter account.",
      },
    ],
    whatItUnlocks: ["Auto-post to NLC Twitter/X account", "Track tweet engagement and follower growth", "Social media metrics in dashboard"],
  },
  {
    id: "c7",
    entity: "NLC, Club Haus",
    workflow: "Social Media",
    title: "Instagram (Meta Graph API)",
    icon: "IG",
    cost: "Free",
    costNote: "Meta Graph API is free for business accounts. Instagram account must be Business or Creator type.",
    timeEstimate: "25 min",
    envVars: ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID"],
    steps: [
      {
        label: "Convert to Business Account",
        detail: "In Instagram app: Settings > Account > Switch to Professional Account > Business. Link to a Facebook Page.",
      },
      {
        label: "Create a Meta App",
        detail: "Go to Meta for Developers. Create a new app, choose 'Business' type.",
        url: "https://developers.facebook.com/apps/create/",
      },
      {
        label: "Add Instagram Graph API product",
        detail: "In your app dashboard, find 'Instagram Graph API' and click Set Up.",
      },
      {
        label: "Generate a long-lived token",
        detail: "Use the Graph API Explorer to generate a User Token with instagram_basic, instagram_content_publish, pages_show_list permissions. Then exchange it for a long-lived token (60 days).",
        url: "https://developers.facebook.com/tools/explorer/",
      },
      {
        label: "Get your Business Account ID",
        detail: "Call: GET /me/accounts to find the Facebook Page, then GET /{page-id}?fields=instagram_business_account to get the IG Business Account ID.",
      },
    ],
    whatItUnlocks: ["Auto-post images and carousels to NLC and Club Haus Instagram", "Track follower growth and post reach", "Instagram metrics in dashboard"],
  },
  {
    id: "c8",
    entity: "Titan Renovations",
    workflow: "Invoicing",
    title: "WaveApps",
    icon: "W",
    cost: "Free for invoicing. Payments: 2.9% + $0.60",
    costNote: "Invoicing is completely free. Only pay processing fees if clients pay online through Wave.",
    timeEstimate: "5 min",
    envVars: ["WAVEAPPS_API_TOKEN"],
    steps: [
      {
        label: "Log into WaveApps",
        detail: "Use the Titan Renovations WaveApps account.",
        url: "https://www.waveapps.com/",
      },
      {
        label: "Go to API settings",
        detail: "Wave uses a GraphQL API. Go to Settings > Integrations or use the developer portal to create an API token.",
        url: "https://developer.waveapps.com/hc/en-us/articles/360019493652",
      },
      {
        label: "Create a Full Access token",
        detail: "Generate a token with full access to invoices, customers, and payments. Paste it below.",
      },
    ],
    whatItUnlocks: ["Invoice and revenue tracking for Titan Renovations", "Outstanding payments and cash flow metrics", "Invoicing data in dashboard"],
  },
  {
    id: "c9",
    entity: "Porcupine Edu",
    workflow: "Merch Store",
    title: "Printful",
    icon: "PF",
    cost: "Free to integrate. Pay per item fulfilled.",
    costNote: "No monthly fee. You only pay when an order is placed. Typical t-shirt cost: $8-12 + shipping.",
    timeEstimate: "5 min",
    envVars: ["PRINTFUL_API_KEY"],
    steps: [
      {
        label: "Create a Printful account",
        detail: "Sign up and set up your Porcupine Edu store.",
        url: "https://www.printful.com/auth/register",
      },
      {
        label: "Go to API settings",
        detail: "Navigate to Settings > API. Click 'Create token' to generate a new API key.",
        url: "https://www.printful.com/dashboard/developer/api-keys",
      },
      {
        label: "Copy and paste the token below",
        detail: "This gives read access to orders, products, and store data.",
      },
    ],
    whatItUnlocks: ["Track t-shirt sales and inventory for Porcupine Edu", "Order volume and revenue metrics", "Merch performance in dashboard"],
  },
  {
    id: "c10",
    entity: "All Entities",
    workflow: "Deployments",
    title: "Vercel",
    icon: "V",
    cost: "Free (Hobby) / $20/mo (Pro)",
    costNote: "Hobby plan is free for personal projects. Pro at $20/mo per member adds team features and more bandwidth.",
    timeEstimate: "5 min",
    envVars: ["VERCEL_TOKEN", "VERCEL_PROJECT_ID"],
    steps: [
      {
        label: "Go to Vercel account settings",
        detail: "Log into Vercel with the account that hosts your projects.",
        url: "https://vercel.com/account/tokens",
      },
      {
        label: "Create a new token",
        detail: "Click 'Create'. Name it 'Apex Brain'. Set scope to your team. Set expiration to 'No expiration' or 1 year.",
      },
      {
        label: "Find your Project ID",
        detail: "Go to any project > Settings > General. The Project ID is shown at the top. Paste below for the primary dashboard project.",
      },
    ],
    whatItUnlocks: ["Deployment status monitoring for all entity websites", "Auto-deploy when system mode chat makes changes", "Build status and preview URLs in dashboard"],
  },
  {
    id: "c11",
    entity: "NLC",
    workflow: "Email Outreach",
    title: "Gmail SMTP",
    icon: "@",
    cost: "Free",
    costNote: "Uses Gmail SMTP. Free with any Google Workspace or personal Gmail account. 500 emails/day limit.",
    timeEstimate: "10 min",
    envVars: ["SMTP_USER", "SMTP_PASSWORD"],
    steps: [
      {
        label: "Enable 2-Factor Authentication",
        detail: "Go to Google Account security settings. 2FA must be on to create app passwords.",
        url: "https://myaccount.google.com/security",
      },
      {
        label: "Create an App Password",
        detail: "Search 'App passwords' in Google Account settings. Select 'Mail' and 'Other' (name it 'Apex Brain'). Google generates a 16-character password.",
        url: "https://myaccount.google.com/apppasswords",
      },
      {
        label: "Paste credentials below",
        detail: "SMTP_USER is your full Gmail address. SMTP_PASSWORD is the 16-character app password (not your Gmail password).",
      },
    ],
    whatItUnlocks: ["Automated email outreach to law firms", "Follow-up sequences for physician recruitment", "Email delivery tracking in workflows"],
  },
];

function ConnectorCard({ guide, connectedKeys }: { guide: ConnectorGuide; connectedKeys: Set<string> }) {
  const [expanded, setExpanded] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveResult, setSaveResult] = useState<{ mode: string; message: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const allConnected = guide.envVars.every((v) => connectedKeys.has(v));

  if ((allConnected && !saved) || verified) {
    return (
      <Card className="border-emerald/20 bg-emerald/5">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald/15 text-emerald text-xs font-bold">
                {guide.icon}
              </div>
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  {guide.title}
                  <CheckCircle2 className="h-4 w-4 text-emerald" />
                </CardTitle>
                <p className="text-[11px] text-emerald/70">{guide.entity}</p>
              </div>
            </div>
            <Badge className="bg-emerald/15 text-emerald border-0 text-[10px]">Connected</Badge>
          </div>
        </CardHeader>
      </Card>
    );
  }

  async function handleSave() {
    const keys: Record<string, string> = {};
    for (const v of guide.envVars) {
      if (values[v]?.trim()) keys[v] = values[v].trim();
    }
    if (Object.keys(keys).length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys }),
      });
      const data = await res.json();
      setSaveResult(data);
      setSaved(true);
    } catch { /* */ }
    finally { setSaving(false); }
  }

  async function handleVerify() {
    setVerifying(true);
    try {
      const res = await fetch("/api/connectors");
      const data = await res.json();
      const allSet = guide.envVars.every((v) => data.status[v]);
      if (allSet) {
        setVerified(true);
      } else {
        const missing = guide.envVars.filter((v) => !data.status[v]);
        setSaveResult({
          mode: data.mode,
          message: `Not yet active. Missing: ${missing.join(", ")}. ${data.mode === "vercel" ? "You may need to redeploy on Vercel for new env vars to take effect." : "Restart the dev server."}`,
        });
      }
    } catch { /* */ }
    finally { setVerifying(false); }
  }

  const isFree = guide.cost.toLowerCase().startsWith("free");

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground/60 text-xs font-bold border border-border/50">
              {guide.icon}
            </div>
            <div>
              <CardTitle className="text-sm font-bold">{guide.title}</CardTitle>
              <p className="text-[11px] text-muted-foreground">{guide.entity} &middot; {guide.workflow}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] border-0 ${isFree ? "bg-emerald/10 text-emerald" : "bg-amber/10 text-amber"}`}
            >
              <DollarSign className="h-2.5 w-2.5 mr-0.5" />
              {guide.cost}
            </Badge>
            <Badge variant="outline" className="text-[10px] border-0 bg-muted text-muted-foreground">
              <Clock className="h-2.5 w-2.5 mr-0.5" />
              {guide.timeEstimate}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Cost detail */}
        <p className="text-xs text-muted-foreground mb-3">{guide.costNote}</p>

        {/* What it unlocks */}
        <div className="mb-3">
          <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/60 font-medium mb-1.5">Unlocks</p>
          <div className="flex flex-wrap gap-1.5">
            {guide.whatItUnlocks.map((item, i) => (
              <span key={i} className="text-[11px] bg-muted/80 px-2 py-0.5 rounded-md text-muted-foreground">
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Expandable step-by-step guide */}
        {expanded && (
          <div className="mt-4 space-y-3 animate-fade-up">
            <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/60 font-medium">Setup Guide</p>
            <div className="space-y-2">
              {guide.steps.map((step, i) => (
                <div key={i} className="flex gap-3 group">
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground border border-border/50">
                      {i + 1}
                    </div>
                    {i < guide.steps.length - 1 && (
                      <div className="w-px flex-1 bg-border/30 my-1" />
                    )}
                  </div>
                  <div className="pb-3 flex-1">
                    <p className="text-xs font-medium flex items-center gap-1.5">
                      {step.label}
                      {step.url && (
                        <a
                          href={step.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald hover:underline inline-flex items-center gap-0.5"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{step.detail}</p>
                    {step.url && (
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald/80 hover:text-emerald hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        Open {new URL(step.url).hostname} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Key input fields */}
            {showKeys && (
              <div className="space-y-2 pt-2 border-t border-border/30 animate-fade-up">
                <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/60 font-medium flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Paste Your Keys
                </p>
                {guide.envVars.map((v) => (
                  <div key={v}>
                    <label className="text-[11px] font-medium text-muted-foreground font-mono">{v}</label>
                    <Input
                      type="password"
                      placeholder={`Paste ${v}...`}
                      value={values[v] || ""}
                      onChange={(e) => setValues((prev) => ({ ...prev, [v]: e.target.value }))}
                      className="text-sm mt-1 bg-muted/50 border-border/50 font-mono"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Post-save verification banner */}
      {saved && !verified && (
        <div className="px-6 pb-3">
          <div className="rounded-lg bg-amber/5 border border-amber/20 p-3 space-y-2 animate-fade-up">
            {saveResult && (
              <p className="text-[11px] text-amber">
                {saveResult.mode === "vercel"
                  ? "Keys saved to Vercel. Add them in Vercel Dashboard > Settings > Environment Variables, then redeploy."
                  : "Keys saved to .env. Restart the dev server to activate."}
              </p>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1.5 border-amber/30 text-amber hover:bg-amber/10" onClick={handleVerify} disabled={verifying}>
                {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Verify Connection
              </Button>
            </div>
            {saveResult && saveResult.message.includes("Missing") && (
              <p className="text-[11px] text-rose">{saveResult.message}</p>
            )}
          </div>
        </div>
      )}

      <CardFooter className="flex gap-2 border-t border-border/30 pt-3">
        {saved && !verified ? (
          <p className="text-[11px] text-muted-foreground">Saved. Verify above after restarting or redeploying.</p>
        ) : expanded ? (
          showKeys ? (
            <>
              <Button size="sm" className="flex-1 gap-1.5 bg-emerald hover:bg-emerald/90 text-black font-medium" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save & Connect
              </Button>
              <Button size="sm" variant="outline" className="border-border/50" onClick={() => setShowKeys(false)}>
                Back
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" className="flex-1 gap-1.5 bg-emerald hover:bg-emerald/90 text-black font-medium" onClick={() => setShowKeys(true)}>
                <Key className="h-3.5 w-3.5" /> I Have My Keys
              </Button>
              <Button size="sm" variant="outline" className="border-border/50" onClick={() => setExpanded(false)}>
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
            </>
          )
        ) : (
          <>
            <Button size="sm" variant="outline" className="flex-1 gap-1.5 border-border/50" onClick={() => setExpanded(true)}>
              <ChevronDown className="h-3.5 w-3.5" /> Show Setup Guide
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

function ContentApprovalCard({ item }: { item: ApprovalItem }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");

  const typeColors: Record<string, string> = {
    post: "bg-cyan/10 text-cyan",
    email: "bg-violet/10 text-violet",
    website: "bg-emerald/10 text-emerald",
    ad: "bg-amber/10 text-amber",
    document: "bg-rose/10 text-rose",
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={`${typeColors[item.type] || typeColors.document} border-0 text-[10px]`}>{item.type}</Badge>
            <Badge variant="outline" className="text-[10px] border-border/50">{item.entity}</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">{item.createdAt}</span>
        </div>
        <CardTitle className="text-sm font-bold">{item.title}</CardTitle>
        <p className="text-[11px] text-muted-foreground">
          {item.workflow} &middot; {item.step}
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-muted/40 border border-border/30 p-4 text-sm whitespace-pre-wrap leading-relaxed">
          {item.content}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        {showFeedback && (
          <Textarea
            placeholder="Add feedback..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="text-sm bg-muted/30 border-border/50"
          />
        )}
        <div className="flex w-full gap-2">
          <Button size="sm" className="flex-1 gap-1.5 bg-emerald hover:bg-emerald/90 text-black font-medium">
            <Check className="h-3.5 w-3.5" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 border-border/50" onClick={() => setShowFeedback(!showFeedback)}>
            <MessageSquare className="h-3.5 w-3.5" /> Feedback
          </Button>
          <Button size="sm" variant="outline" className="gap-1 border-border/50">
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" className="gap-1 border-rose/30 text-rose hover:bg-rose/10">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export function ApprovalQueue({ items, connectedKeys }: { items?: ApprovalItem[]; connectedKeys?: Set<string> }) {
  const connected = connectedKeys || new Set<string>();
  const pendingCount = connectorGuides.filter((c) => !c.envVars.every((v) => connected.has(v))).length;
  const doneCount = connectorGuides.length - pendingCount;

  return (
    <div className="space-y-6 animate-fade-up">
      {(items || []).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs tracking-[0.15em] uppercase text-muted-foreground/60 font-medium">Content Approvals</h3>
          {(items || []).map((item) => (
            <ContentApprovalCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs tracking-[0.15em] uppercase text-muted-foreground/60 font-medium">
            Connectors
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald font-medium">{doneCount} connected</span>
            <span className="text-xs text-muted-foreground">&middot;</span>
            <span className="text-xs text-muted-foreground">{pendingCount} remaining</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Each connector lights up metrics and workflows. Expand any card for a step-by-step guide with direct links.
        </p>
        <div className="space-y-3 stagger-children">
          {connectorGuides.map((guide) => (
            <ConnectorCard key={guide.id} guide={guide} connectedKeys={connected} />
          ))}
        </div>
      </div>
    </div>
  );
}
