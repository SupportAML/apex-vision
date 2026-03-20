"use client";

import { Badge } from "@/components/ui/badge";

interface SocialPreviewProps {
  platform: "linkedin" | "twitter" | "instagram" | "email";
  text: string;
  hashtags?: string[];
  imagePrompt?: string;
  caption?: string;
}

export function SocialPreview({ platform, text, hashtags, imagePrompt, caption }: SocialPreviewProps) {
  switch (platform) {
    case "linkedin":
      return <LinkedInPreview text={text} hashtags={hashtags} />;
    case "twitter":
      return <TwitterPreview text={text} hashtags={hashtags} />;
    case "instagram":
      return <InstagramPreview text={text} hashtags={hashtags} imagePrompt={imagePrompt} caption={caption} />;
    default:
      return <GenericPreview text={text} />;
  }
}

function LinkedInPreview({ text, hashtags }: { text: string; hashtags?: string[] }) {
  const charCount = text.length;
  const isOverLimit = charCount > 3000;

  return (
    <div className="rounded-lg bg-[#1b1f23] border border-border/30 overflow-hidden">
      {/* LinkedIn header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold">
          in
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">Company Page</p>
          <p className="text-[10px] text-muted-foreground">Just now &middot; LinkedIn</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-2">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        {hashtags && hashtags.length > 0 && (
          <p className="text-sm text-blue-400 mt-2">
            {hashtags.map((t) => `#${t}`).join(" ")}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/20">
        <span className={`text-[10px] ${isOverLimit ? "text-rose" : "text-muted-foreground"}`}>
          {charCount.toLocaleString()}/3,000 chars
        </span>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <span>Like</span>
          <span>Comment</span>
          <span>Share</span>
        </div>
      </div>
    </div>
  );
}

function TwitterPreview({ text, hashtags }: { text: string; hashtags?: string[] }) {
  const fullText = hashtags?.length
    ? `${text}\n${hashtags.map((t) => `#${t}`).join(" ")}`
    : text;
  const charCount = fullText.length;
  const isOverLimit = charCount > 280;

  return (
    <div className="rounded-lg bg-[#16181c] border border-border/30 overflow-hidden">
      {/* X header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <div className="h-8 w-8 rounded-full bg-foreground/10 flex items-center justify-center text-foreground text-xs font-bold">
          X
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">@account</p>
          <p className="text-[10px] text-muted-foreground">Just now</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-2">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        {hashtags && hashtags.length > 0 && (
          <p className="text-sm text-blue-400 mt-1">
            {hashtags.map((t) => `#${t}`).join(" ")}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/20">
        <span className={`text-[10px] ${isOverLimit ? "text-rose font-bold" : "text-muted-foreground"}`}>
          {charCount}/280 chars{isOverLimit ? " — OVER LIMIT" : ""}
        </span>
        <div className="flex gap-4 text-[10px] text-muted-foreground">
          <span>Reply</span>
          <span>Repost</span>
          <span>Like</span>
        </div>
      </div>
    </div>
  );
}

function InstagramPreview({
  text,
  hashtags,
  imagePrompt,
  caption,
}: {
  text: string;
  hashtags?: string[];
  imagePrompt?: string;
  caption?: string;
}) {
  return (
    <div className="rounded-lg bg-[#1a1a1a] border border-border/30 overflow-hidden">
      {/* Instagram header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
          IG
        </div>
        <p className="text-xs font-semibold text-foreground">account</p>
      </div>

      {/* Image placeholder */}
      {imagePrompt && (
        <div className="aspect-[4/5] bg-muted/20 border-y border-border/20 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-2">AI Image Prompt</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{imagePrompt}</p>
          </div>
        </div>
      )}

      {/* Caption */}
      <div className="px-4 py-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {caption || text}
        </p>
        {hashtags && hashtags.length > 0 && (
          <p className="text-xs text-blue-400/80 mt-2">
            {hashtags.map((t) => `#${t}`).join(" ")}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/20">
        <span className="text-[10px] text-muted-foreground">
          {(caption || text).length.toLocaleString()}/2,200 chars
        </span>
        <span className="text-[10px] text-muted-foreground">
          {hashtags?.length || 0} hashtags
        </span>
      </div>
    </div>
  );
}

function GenericPreview({ text }: { text: string }) {
  return (
    <div className="rounded-lg bg-muted/40 border border-border/30 p-4">
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}
