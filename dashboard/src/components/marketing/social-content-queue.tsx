"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, MessageSquare, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { SocialPreview } from "./social-preview";

export interface SocialContentItem {
  id: string;
  notionPageId: string;
  entity: string;
  platform: "linkedin" | "twitter" | "instagram";
  title: string;
  text: string;
  hashtags: string[];
  imagePrompt?: string;
  caption?: string;
  createdAt: string;
  status: "Review" | "Approved" | "Rejected" | "Published";
}

const platformColors: Record<string, string> = {
  linkedin: "bg-blue-500/10 text-blue-400",
  twitter: "bg-foreground/10 text-foreground",
  instagram: "bg-pink-500/10 text-pink-400",
};

const platformLabels: Record<string, string> = {
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  instagram: "Instagram",
};

function SocialContentCard({
  item,
  onApprove,
  onReject,
}: {
  item: SocialContentItem;
  onApprove: (id: string, notionPageId: string) => void;
  onReject: (id: string, notionPageId: string, feedback: string) => void;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handleApprove = async () => {
    setLoading("approve");
    await onApprove(item.id, item.notionPageId);
    setLoading(null);
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      setShowFeedback(true);
      return;
    }
    setLoading("reject");
    await onReject(item.id, item.notionPageId, feedback);
    setLoading(null);
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={`${platformColors[item.platform]} border-0 text-[10px]`}>
              {platformLabels[item.platform]}
            </Badge>
            <Badge variant="outline" className="text-[10px] border-border/50">
              {item.entity}
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">{item.createdAt}</span>
        </div>
        <CardTitle className="text-sm font-bold">{item.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Platform-specific preview */}
        <SocialPreview
          platform={item.platform}
          text={item.text}
          hashtags={item.hashtags}
          imagePrompt={item.imagePrompt}
          caption={item.caption}
        />
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {showFeedback && (
          <Textarea
            placeholder="Why are you rejecting this? Your feedback helps the AI learn..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="text-sm bg-muted/30 border-border/50"
          />
        )}
        <div className="flex w-full gap-2">
          <Button
            size="sm"
            className="flex-1 gap-1.5 bg-emerald hover:bg-emerald/90 text-black font-medium"
            onClick={handleApprove}
            disabled={loading !== null}
          >
            {loading === "approve" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Approve & Post
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 border-border/50"
            onClick={() => {
              if (showFeedback && feedback.trim()) {
                handleReject();
              } else {
                setShowFeedback(!showFeedback);
              }
            }}
            disabled={loading !== null}
          >
            {loading === "reject" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : showFeedback && feedback.trim() ? (
              <Send className="h-3.5 w-3.5" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5" />
            )}
            {showFeedback && feedback.trim() ? "Submit Feedback" : "Reject + Feedback"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 border-rose/30 text-rose hover:bg-rose/10"
            onClick={() => onReject(item.id, item.notionPageId, "Rejected without specific feedback")}
            disabled={loading !== null}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

interface SocialContentQueueProps {
  items: SocialContentItem[];
  onApprove: (id: string, notionPageId: string) => void;
  onReject: (id: string, notionPageId: string, feedback: string) => void;
  filterPlatform?: string;
  filterEntity?: string;
}

export function SocialContentQueue({
  items,
  onApprove,
  onReject,
  filterPlatform,
  filterEntity,
}: SocialContentQueueProps) {
  const filtered = items.filter((item) => {
    if (filterPlatform && item.platform !== filterPlatform) return false;
    if (filterEntity && item.entity !== filterEntity) return false;
    return item.status === "Review";
  });

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No content pending review</p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          New content will appear here when generated by the daily pipeline
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filtered.length} item{filtered.length !== 1 ? "s" : ""} pending review
        </p>
      </div>
      {filtered.map((item) => (
        <SocialContentCard
          key={item.id}
          item={item}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
