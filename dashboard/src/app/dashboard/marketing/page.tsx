"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialContentQueue, SocialContentItem } from "@/components/marketing/social-content-queue";
import { EmailQueue, EmailItem } from "@/components/marketing/email-queue";
import { IntelligenceFeed, IntelligenceItem } from "@/components/marketing/intelligence-feed";
import { MarketingStatsCards } from "@/components/marketing/marketing-stats";
import {
  Share2, Mail, Lightbulb, RefreshCw, Loader2, Filter,
} from "lucide-react";

type Tab = "social" | "emails" | "intelligence";

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("social");
  const [socialItems, setSocialItems] = useState<SocialContentItem[]>([]);
  const [emailItems, setEmailItems] = useState<EmailItem[]>([]);
  const [intelligenceItems, setIntelligenceItems] = useState<IntelligenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string>("");
  const [filterEntity, setFilterEntity] = useState<string>("");

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/content");
      if (res.ok) {
        const data = await res.json();
        setSocialItems(data.social || []);
        setEmailItems(data.emails || []);
        setIntelligenceItems(data.intelligence || []);
      }
    } catch (err) {
      console.error("Failed to fetch marketing content:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleApprove = async (id: string, notionPageId: string) => {
    try {
      await fetch("/api/marketing/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", notionPageId, id }),
      });
      // Remove from list
      setSocialItems((prev) => prev.filter((i) => i.id !== id));
      setEmailItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };

  const handleReject = async (id: string, notionPageId: string, feedback: string) => {
    try {
      await fetch("/api/marketing/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", notionPageId, id, feedback }),
      });
      setSocialItems((prev) => prev.filter((i) => i.id !== id));
      setEmailItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Rejection failed:", err);
    }
  };

  const handleBulkSend = async (notionPageIds: string[]) => {
    try {
      await fetch("/api/marketing/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_send", notionPageIds }),
      });
      setEmailItems((prev) =>
        prev.map((i) =>
          notionPageIds.includes(i.notionPageId)
            ? { ...i, status: "Sent" as const }
            : i
        )
      );
    } catch (err) {
      console.error("Bulk send failed:", err);
    }
  };

  const handleIncorporate = async (item: IntelligenceItem) => {
    try {
      await fetch("/api/marketing/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "incorporate", finding: item }),
      });
    } catch (err) {
      console.error("Incorporate failed:", err);
    }
  };

  // Calculate stats
  const stats = {
    pendingSocial: socialItems.filter((i) => i.status === "Review").length,
    pendingEmails: emailItems.filter((i) => i.status === "Review").length,
    publishedToday: socialItems.filter((i) => i.status === "Published").length,
    approvalRate: socialItems.length > 0
      ? Math.round(
          (socialItems.filter((i) => i.status === "Approved" || i.status === "Published").length /
            socialItems.length) *
            100
        )
      : 0,
    totalRejected: socialItems.filter((i) => i.status === "Rejected").length +
      emailItems.filter((i) => i.status === "Rejected").length,
    intelligenceFindings: intelligenceItems.length,
  };

  const tabs: { id: Tab; label: string; icon: typeof Share2; count: number }[] = [
    { id: "social", label: "Social Media", icon: Share2, count: stats.pendingSocial },
    { id: "emails", label: "Email Campaigns", icon: Mail, count: stats.pendingEmails },
    { id: "intelligence", label: "Intelligence", icon: Lightbulb, count: stats.intelligenceFindings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Marketing Hub</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review, approve, and manage AI-generated marketing content
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-border/50"
          onClick={fetchContent}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <MarketingStatsCards stats={stats} />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/30 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-emerald text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count > 0 && (
              <Badge className="bg-emerald/15 text-emerald border-0 text-[10px] h-5 px-1.5">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Platform filters (social tab only) */}
      {activeTab === "social" && (
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex gap-1">
            {["", "linkedin", "twitter", "instagram"].map((platform) => (
              <button
                key={platform}
                onClick={() => setFilterPlatform(platform)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  filterPlatform === platform
                    ? "bg-emerald/15 text-emerald"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {platform === "" ? "All" : platform === "twitter" ? "X" : platform.charAt(0).toUpperCase() + platform.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="animate-fade-up">
        {activeTab === "social" && (
          <SocialContentQueue
            items={socialItems}
            onApprove={handleApprove}
            onReject={handleReject}
            filterPlatform={filterPlatform || undefined}
            filterEntity={filterEntity || undefined}
          />
        )}
        {activeTab === "emails" && (
          <EmailQueue
            items={emailItems}
            onApprove={handleApprove}
            onReject={handleReject}
            onBulkSend={handleBulkSend}
          />
        )}
        {activeTab === "intelligence" && (
          <IntelligenceFeed
            items={intelligenceItems}
            onIncorporate={handleIncorporate}
          />
        )}
      </div>
    </div>
  );
}
