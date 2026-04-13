import Link from "next/link";
import { AlertTriangle, CheckCircle, ChevronRight, Calendar } from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { GlassCard } from "@/components/ui/glass-card";
import { Pill } from "@/components/ui/pill";

type Dispute = {
  id: string;
  booking_id: string;
  raised_by: string;
  against_user: string;
  reason: string;
  status: string;
  created_at: string;
};

type UserStub = { id: string; full_name: string; role: string };

const STATUS_STYLE: Record<string, string> = {
  open:         "text-danger  border-danger/30  bg-danger/10",
  under_review: "text-warning border-warning/30 bg-warning/10",
  resolved:     "text-emerald border-emerald/30 bg-emerald/10",
  closed:       "text-txt-muted border-border-token bg-bg-elevated",
};

function DisputeCard({ d, users }: { d: Dispute; users: UserStub[] }) {
  const raiser = users.find((u) => u.id === d.raised_by);
  const other  = users.find((u) => u.id === d.against_user);
  const isOpen = d.status === "open" || d.status === "under_review";
  const style  = STATUS_STYLE[d.status] ?? STATUS_STYLE.closed;

  return (
    <GlassCard variant="elevated" hover={false} className="overflow-hidden p-0">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
        {/* Left */}
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/disputes/${d.id}`}
              className="font-mono text-sm font-semibold text-electric-bright hover:underline"
            >
              #{d.id.slice(0, 8).toUpperCase()}
            </Link>
            <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${style}`}>
              {d.status.replace("_", " ")}
            </span>
          </div>
          <p className="mb-1 text-sm text-txt-primary">
            <span className="font-semibold">{raiser?.full_name ?? "Unknown"}</span>{" "}
            <span className="text-txt-muted">({raiser?.role})</span>{" "}
            <span className="text-txt-muted">vs</span>{" "}
            <span className="font-semibold">{other?.full_name ?? "Unknown"}</span>{" "}
            <span className="text-txt-muted">({other?.role})</span>
          </p>
          <p className="text-xs text-txt-muted">
            Reason: <span className="text-txt-secondary">{d.reason}</span>
          </p>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-txt-muted">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(d.created_at).toLocaleString("en-IN")}
            </span>
            <Link
              href={`/admin/bookings/${d.booking_id}`}
              className="text-neon-bright hover:underline"
            >
              View booking →
            </Link>
          </div>
        </div>

        {/* Action */}
        <Link
          href={`/admin/disputes/${d.id}`}
          className="flex items-center gap-1.5 rounded-xl border border-border-token bg-bg-surface px-3 py-2 text-xs font-medium text-txt-secondary transition-colors hover:border-electric/30 hover:text-electric-bright"
        >
          {isOpen ? "Review" : "View"}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </GlassCard>
  );
}

export default async function AdminDisputesPage() {
  await requireAdmin();
  const supabase = createServerSupabaseClient();

  const { data: rows } = await supabase
    .from("disputes")
    .select("*")
    .order("created_at", { ascending: false });

  const userIds = Array.from(
    new Set((rows ?? []).flatMap((d) => [d.raised_by, d.against_user]))
  );
  const { data: users } = userIds.length
    ? await supabase
        .from("users")
        .select("id, full_name, role")
        .in("id", userIds)
    : { data: [] };

  const openCases   = (rows ?? []).filter((d) => d.status === "open" || d.status === "under_review");
  const closedCases = (rows ?? []).filter((d) => d.status !== "open" && d.status !== "under_review");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Disputes</h1>
          <p className="mt-1 text-sm text-txt-muted">
            Open cases first · Refunds handled via Razorpay dashboard.
          </p>
        </div>
        {openCases.length > 0 && (
          <Pill variant="primary" pulse>
            <AlertTriangle className="h-3 w-3" />
            {openCases.length} open
          </Pill>
        )}
      </div>

      {/* Open cases */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-danger">
          <AlertTriangle className="h-3.5 w-3.5" />
          Open ({openCases.length})
        </h2>
        <div className="space-y-3">
          {openCases.length === 0 ? (
            <GlassCard variant="elevated" className="py-10 text-center" hover={false}>
              <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald" />
              <p className="text-sm text-txt-muted">No open disputes.</p>
            </GlassCard>
          ) : (
            openCases.map((d) => <DisputeCard key={d.id} d={d} users={users ?? []} />)
          )}
        </div>
      </section>

      {/* Closed cases */}
      {closedCases.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-txt-muted">
            Closed ({closedCases.length})
          </h2>
          <div className="space-y-3">
            {closedCases.map((d) => <DisputeCard key={d.id} d={d} users={users ?? []} />)}
          </div>
        </section>
      )}
    </div>
  );
}
