import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Key, Plug } from "lucide-react";

interface ConnectorConfig {
  label: string;
  envVars: string[];
  description: string;
  affects: string;
}

const connectors: ConnectorConfig[] = [
  {
    label: "Anthropic (Brain)",
    envVars: ["ANTHROPIC_API_KEY"],
    description: "Powers the chat interface and all AI workflows",
    affects: "Chat, all workflows",
  },
  {
    label: "Google OAuth",
    envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXTAUTH_SECRET"],
    description: "Team login via Google accounts",
    affects: "Authentication",
  },
  {
    label: "LinkedIn API",
    envVars: ["LINKEDIN_ACCESS_TOKEN"],
    description: "Auto-posting and engagement tracking",
    affects: "NLC LinkedIn workflow, metrics",
  },
  {
    label: "Google Analytics",
    envVars: ["GOOGLE_ANALYTICS_PROPERTY_ID", "GOOGLE_SERVICE_ACCOUNT_KEY"],
    description: "Website traffic data",
    affects: "NLC, Club Haus, Titan, Porcupine Edu metrics",
  },
  {
    label: "Google Search Console",
    envVars: ["GOOGLE_SEARCH_CONSOLE_SITE_URL"],
    description: "Keyword rankings and search performance",
    affects: "Porcupine Edu, NLC metrics",
  },
  {
    label: "Square POS",
    envVars: ["SQUARE_ACCESS_TOKEN", "SQUARE_LOCATION_ID"],
    description: "Bookings and revenue data",
    affects: "Club Haus metrics and workflows",
  },
  {
    label: "Twitter / X",
    envVars: ["TWITTER_API_KEY", "TWITTER_API_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_SECRET"],
    description: "Auto-posting and engagement",
    affects: "NLC, social media workflows",
  },
  {
    label: "Instagram (Meta)",
    envVars: ["META_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID"],
    description: "Auto-posting and engagement",
    affects: "NLC, Club Haus Instagram workflows",
  },
  {
    label: "WaveApps",
    envVars: ["WAVEAPPS_API_TOKEN"],
    description: "Invoice and revenue tracking",
    affects: "Titan Renovations metrics",
  },
  {
    label: "Printful",
    envVars: ["PRINTFUL_API_KEY"],
    description: "Merch sales and inventory",
    affects: "Porcupine Edu metrics",
  },
  {
    label: "Vercel",
    envVars: ["VERCEL_TOKEN"],
    description: "Deployment status monitoring",
    affects: "All entity website deployments",
  },
  {
    label: "Gmail API",
    envVars: ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET"],
    description: "Email outreach and automated follow-ups",
    affects: "NLC law firm outreach, email workflows",
  },
];

function getConnectorStatus(envVars: string[]): { connected: boolean; missing: string[] } {
  const missing = envVars.filter((v) => !process.env[v]);
  return { connected: missing.length === 0, missing };
}

export default function SettingsPage() {
  const statuses = connectors.map((c) => ({
    ...c,
    ...getConnectorStatus(c.envVars),
  }));

  const connectedCount = statuses.filter((s) => s.connected).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          {connectedCount} of {connectors.length} connectors active
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" /> How to connect
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Add environment variables to <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.local</code> in the dashboard directory.</p>
          <p>Each connector unlocks live data for metrics, auto-posting, and workflows. Start with ANTHROPIC_API_KEY to enable the brain, then add others one by one.</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {statuses.map((connector) => (
          <Card key={connector.label} className={connector.connected ? "" : "border-dashed opacity-80"}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  {connector.connected ? (
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  )}
                  {connector.label}
                </CardTitle>
                <Badge variant={connector.connected ? "default" : "outline"}>
                  {connector.connected ? "Connected" : "Not connected"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{connector.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Affects:</span> {connector.affects}
              </p>
              {!connector.connected && connector.missing.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {connector.missing.map((v) => (
                    <code key={v} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {v}
                    </code>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
