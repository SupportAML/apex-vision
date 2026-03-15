"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Briefcase, Settings2, Loader2 } from "lucide-react";

type ChatMode = "business" | "system";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatInterface() {
  const [mode, setMode] = useState<ChatMode>("business");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage], mode }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: assistantContent };
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Make sure ANTHROPIC_API_KEY is set in apex-brain/.env" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const suggestions = mode === "business"
    ? ["What should NLC post on LinkedIn this week?", "Draft an investor update for A2Z Equity", "How do we get more cases for NLC?"]
    : ["Add a new workflow for email outreach", "Give Ovi access to Club Haus metrics", "Show me the current system status"];

  return (
    <Card className="flex h-[calc(100vh-8rem)] flex-col border-border/50">
      <CardHeader className="pb-0 pt-4 px-4">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 p-0.5 bg-muted/50 rounded-lg w-fit">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === "business"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setMode("business")}
          >
            <Briefcase className="h-3 w-3" /> Business
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === "system"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setMode("system")}
          >
            <Settings2 className="h-3 w-3" /> System
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden px-4 pt-3">
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 animate-fade-up">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald/20 to-cyan/10 mb-4">
                  <Bot className="h-7 w-7 text-emerald/70" />
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  {mode === "business"
                    ? "Ask about strategy, content, or operations"
                    : "Modify workflows, team access, or system config"}
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-md">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-muted/60 border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 animate-fade-up ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald/20 to-cyan/10">
                    <Bot className="h-3.5 w-3.5 text-emerald" />
                  </div>
                )}
                <div
                  className={`rounded-xl px-3.5 py-2.5 text-sm max-w-[80%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-foreground/10 text-foreground"
                      : "bg-muted/50 border border-border/30"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald/20 to-cyan/10">
                  <Loader2 className="h-3.5 w-3.5 text-emerald animate-spin" />
                </div>
                <div className="rounded-xl px-3.5 py-2.5 bg-muted/50 border border-border/30">
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 animate-pulse" />
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 animate-pulse [animation-delay:150ms]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 animate-pulse [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2 pb-1">
          <div className="flex-1 relative">
            <Textarea
              placeholder={mode === "business" ? "Ask about your businesses..." : "Modify the system..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-[44px] max-h-[120px] text-sm resize-none bg-muted/30 border-border/50 rounded-xl pr-12"
              rows={1}
            />
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-[44px] w-[44px] rounded-xl bg-emerald hover:bg-emerald/90 text-black shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
