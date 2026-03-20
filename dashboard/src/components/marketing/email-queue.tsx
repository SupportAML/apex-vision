"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Check, X, MessageSquare, Loader2, Send, Mail, Building2, MapPin, Star,
} from "lucide-react";
import { useState } from "react";

export interface EmailItem {
  id: string;
  notionPageId: string;
  entity: string;
  prospectName: string;
  prospectEmail?: string;
  location?: string;
  relevanceScore?: number;
  needsAnalysis?: string;
  subject: string;
  body: string;
  campaign?: string;
  createdAt: string;
  status: "Review" | "Approved" | "Rejected" | "Published" | "Sent";
}

function EmailCard({
  item,
  selected,
  onToggleSelect,
  onApprove,
  onReject,
}: {
  item: EmailItem;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onApprove: (id: string, notionPageId: string) => void;
  onReject: (id: string, notionPageId: string, feedback: string) => void;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  return (
    <Card className={`border-border/50 transition-colors ${selected ? "ring-1 ring-emerald/50 bg-emerald/5" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(item.id)}
              className="h-3.5 w-3.5 rounded border-border/50 accent-emerald"
            />
            <Badge className="bg-violet/10 text-violet border-0 text-[10px]">
              <Mail className="h-2.5 w-2.5 mr-0.5" />
              Email
            </Badge>
            <Badge variant="outline" className="text-[10px] border-border/50">
              {item.entity}
            </Badge>
            {item.relevanceScore && (
              <Badge
                variant="outline"
                className={`text-[10px] border-0 ${
                  item.relevanceScore >= 70
                    ? "bg-emerald/10 text-emerald"
                    : item.relevanceScore >= 50
                      ? "bg-amber/10 text-amber"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <Star className="h-2.5 w-2.5 mr-0.5" />
                {item.relevanceScore}/100
              </Badge>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">{item.createdAt}</span>
        </div>

        {/* Prospect info */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet/10 text-violet">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">{item.prospectName}</CardTitle>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {item.prospectEmail && <span>{item.prospectEmail}</span>}
              {item.location && (
                <>
                  <span>&middot;</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {item.location}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Needs analysis */}
        {item.needsAnalysis && (
          <div className="rounded-lg bg-muted/20 border border-border/20 p-3">
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">AI Needs Analysis</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.needsAnalysis}</p>
          </div>
        )}

        {/* Email preview */}
        <div className="rounded-lg bg-muted/40 border border-border/30 overflow-hidden">
          <div className="px-4 py-2 border-b border-border/20 bg-muted/20">
            <p className="text-[10px] text-muted-foreground/60">Subject</p>
            <p className="text-sm font-medium">{item.subject}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.body}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {showFeedback && (
          <Textarea
            placeholder="Feedback for the AI (helps improve future emails)..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="text-sm bg-muted/30 border-border/50"
          />
        )}
        <div className="flex w-full gap-2">
          <Button
            size="sm"
            className="flex-1 gap-1.5 bg-emerald hover:bg-emerald/90 text-black font-medium"
            onClick={async () => {
              setLoading("approve");
              await onApprove(item.id, item.notionPageId);
              setLoading(null);
            }}
            disabled={loading !== null}
          >
            {loading === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 border-border/50"
            onClick={() => {
              if (showFeedback && feedback.trim()) {
                setLoading("reject");
                onReject(item.id, item.notionPageId, feedback).then(() => setLoading(null));
              } else {
                setShowFeedback(!showFeedback);
              }
            }}
            disabled={loading !== null}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {showFeedback && feedback.trim() ? "Submit" : "Feedback"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 border-rose/30 text-rose hover:bg-rose/10"
            onClick={() => onReject(item.id, item.notionPageId, "Rejected")}
            disabled={loading !== null}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

interface EmailQueueProps {
  items: EmailItem[];
  onApprove: (id: string, notionPageId: string) => void;
  onReject: (id: string, notionPageId: string, feedback: string) => void;
  onBulkSend: (notionPageIds: string[]) => void;
}

export function EmailQueue({ items, onApprove, onReject, onBulkSend }: EmailQueueProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const pendingItems = items.filter((item) => item.status === "Review");
  const approvedItems = items.filter((item) => item.status === "Approved");

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === pendingItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingItems.map((i) => i.id)));
    }
  };

  const handleBulkApprove = async () => {
    for (const id of selectedIds) {
      const item = pendingItems.find((i) => i.id === id);
      if (item) await onApprove(item.id, item.notionPageId);
    }
    setSelectedIds(new Set());
  };

  const handleBulkSend = async () => {
    setSending(true);
    const notionIds = approvedItems.map((i) => i.notionPageId);
    await onBulkSend(notionIds);
    setSending(false);
  };

  return (
    <div className="space-y-6">
      {/* Approved emails ready to send */}
      {approvedItems.length > 0 && (
        <div className="rounded-lg bg-emerald/5 border border-emerald/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald">
                {approvedItems.length} email{approvedItems.length !== 1 ? "s" : ""} approved and ready to send
              </p>
              <p className="text-[11px] text-emerald/60 mt-0.5">
                Click to send all approved emails at once
              </p>
            </div>
            <Button
              size="sm"
              className="gap-1.5 bg-emerald hover:bg-emerald/90 text-black font-medium"
              onClick={handleBulkSend}
              disabled={sending}
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send All Approved
            </Button>
          </div>
        </div>
      )}

      {/* Pending review */}
      {pendingItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {pendingItems.length} email{pendingItems.length !== 1 ? "s" : ""} pending review
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-[11px] border-border/50" onClick={selectAll}>
                {selectedIds.size === pendingItems.length ? "Deselect All" : "Select All"}
              </Button>
              {selectedIds.size > 0 && (
                <Button
                  size="sm"
                  className="text-[11px] bg-emerald hover:bg-emerald/90 text-black"
                  onClick={handleBulkApprove}
                >
                  Approve {selectedIds.size} Selected
                </Button>
              )}
            </div>
          </div>

          {pendingItems.map((item) => (
            <EmailCard
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              onToggleSelect={toggleSelect}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}

      {pendingItems.length === 0 && approvedItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No emails pending review</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">
            Email campaigns run weekly — new prospect emails will appear here
          </p>
        </div>
      )}
    </div>
  );
}
