"use client";

import type { ActivityItem } from "@parknear/shared";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, AlertTriangle, FileCheck, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/motion-variants";

function KindIcon({ kind }: { kind: ActivityItem["kind"] }) {
  switch (kind) {
    case "dispute":
      return <AlertTriangle className="h-3.5 w-3.5 text-warning" />;
    case "kyc":
      return <FileCheck className="h-3.5 w-3.5 text-neon-bright" />;
    case "cancel":
      return <X className="h-3.5 w-3.5 text-danger" />;
    default:
      return <CalendarClock className="h-3.5 w-3.5 text-electric-bright" />;
  }
}

const kindStyles: Record<ActivityItem["kind"], string> = {
  booking:  "bg-electric/10 ring-1 ring-electric/20",
  dispute:  "bg-warning/10  ring-1 ring-warning/20",
  kyc:      "bg-neon/10     ring-1 ring-neon/20",
  cancel:   "bg-danger/10   ring-1 ring-danger/20",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ActivityFeed({ initial }: { initial: ActivityItem[] }) {
  const [items, setItems] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/activity");
      if (!res.ok) return;
      const json = (await res.json()) as { activity: ActivityItem[] };
      setItems(json.activity);
      setLastRefresh(new Date());
    } catch {
      /* ignore */
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const id = setInterval(() => void refresh(), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border-token bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-token px-4 py-3">
        <p className="text-xs font-medium text-txt-muted">
          Refreshes every 60s · last {timeAgo(lastRefresh.toISOString())}
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-txt-muted transition-colors hover:text-txt-primary disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Items */}
      <ul className="divide-y divide-border-token">
        <AnimatePresence initial={false}>
          {items.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-txt-muted">
              No recent activity.
            </li>
          ) : (
            items.map((a, i) => (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, ...springs.gentle }}
              >
                <Link
                  href={a.href}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-bg-elevated"
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                      kindStyles[a.kind]
                    )}
                  >
                    <KindIcon kind={a.kind} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-txt-primary">{a.label}</p>
                    <p className="mt-0.5 text-xs text-txt-muted">{timeAgo(a.at)}</p>
                  </div>
                </Link>
              </motion.li>
            ))
          )}
        </AnimatePresence>
      </ul>
    </div>
  );
}
