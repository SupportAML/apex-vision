"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, TrendingUp, TrendingDown, AlertTriangle, Brain, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketNotification } from "@/lib/markets/types";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<MarketNotification[]>([]);
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/markets/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function markAllRead() {
    await fetch("/api/markets/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const iconMap: Record<string, any> = {
    signal: Brain,
    trade: TrendingUp,
    alert: AlertTriangle,
    prediction: Brain,
  };

  const urgencyColor: Record<string, string> = {
    low: "text-muted-foreground",
    medium: "text-amber",
    high: "text-rose",
    critical: "text-rose",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose text-[9px] font-bold text-white flex items-center justify-center glow-rose">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <h3 className="text-xs font-bold uppercase tracking-wider">Market Alerts</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-emerald hover:underline">
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground/40 text-xs">
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 20).map((n) => {
                  const Icon = iconMap[n.type] || AlertTriangle;
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "px-4 py-3 border-b border-border/10 hover:bg-muted/20 transition-colors",
                        !n.read && "bg-muted/10"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", urgencyColor[n.urgency])} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium truncate">{n.title}</p>
                            {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-emerald shrink-0" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-[9px] text-muted-foreground/40 mt-1">
                            {formatTimeAgo(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
