"use client";

import { ApprovalQueue } from "@/components/approval-queue";
import { useEffect, useState } from "react";

export default function ApprovalsPage() {
  const [connectedKeys, setConnectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/connectors")
      .then((res) => res.json())
      .then((data) => {
        const keys = new Set<string>();
        for (const [key, connected] of Object.entries(data.status)) {
          if (connected) keys.add(key);
        }
        setConnectedKeys(keys);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Approval Queue</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Review outputs and connect services</p>
      </div>
      <ApprovalQueue connectedKeys={connectedKeys} />
    </div>
  );
}
