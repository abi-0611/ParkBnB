import Link from "next/link";
import { FileCheck, Clock, CheckCircle, ExternalLink, ImageOff } from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { GlassCard } from "@/components/ui/glass-card";
import { Pill } from "@/components/ui/pill";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { KycActions } from "./KycActions";

export default async function AdminKycPage() {
  await requireAdmin();
  const supabase = createServerSupabaseClient();

  const { data: queue } = await supabase
    .from("users")
    .select(
      "id, full_name, email, role, kyc_status, aadhaar_doc_url, selfie_url, property_proof_url, updated_at, created_at"
    )
    .eq("kyc_status", "submitted")
    .order("updated_at", { ascending: true });

  async function toSignedUrl(pathOrUrl: string | null): Promise<string | null> {
    if (!pathOrUrl) return null;
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
    const normalized = pathOrUrl.replace(/^\/+/, "");
    const { data } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrl(normalized, 60 * 60);
    return data?.signedUrl ?? null;
  }

  const queueWithSignedDocs = await Promise.all(
    (queue ?? []).map(async (u) => ({
      ...u,
      aadhaar_doc_url: await toSignedUrl(u.aadhaar_doc_url),
      selfie_url: await toSignedUrl(u.selfie_url),
      property_proof_url: await toSignedUrl(u.property_proof_url),
    }))
  );

  const { count: pendingCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("kyc_status", "submitted");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("kyc_status", "verified")
    .gte("updated_at", startOfDay.toISOString());

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return "< 1 hr ago";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">KYC Review</h1>
          <p className="mt-1 text-sm text-txt-muted">
            Submitted applications in order received (oldest first).
          </p>
        </div>
        {pendingCount != null && pendingCount > 0 && (
          <Pill variant="neon" pulse>
            {pendingCount} pending
          </Pill>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <GlassCard variant="elevated" className="p-4" hover={false}>
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-warning/10">
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <AnimatedNumber
            value={pendingCount ?? 0}
            className="text-2xl font-bold text-white"
          />
          <p className="mt-1 text-xs text-txt-muted">Pending review</p>
        </GlassCard>

        <GlassCard variant="elevated" className="p-4" hover={false}>
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald/10">
            <CheckCircle className="h-4 w-4 text-emerald" />
          </div>
          <AnimatedNumber
            value={todayCount ?? 0}
            className="text-2xl font-bold text-white"
          />
          <p className="mt-1 text-xs text-txt-muted">Verified today</p>
        </GlassCard>

        <GlassCard variant="elevated" className="p-4 sm:col-span-1 col-span-2" hover={false}>
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-electric/10">
            <FileCheck className="h-4 w-4 text-electric-bright" />
          </div>
          <p className="text-2xl font-bold text-txt-muted">—</p>
          <p className="mt-1 text-xs text-txt-muted">Avg review time</p>
        </GlassCard>
      </div>

      {/* Queue */}
      {queueWithSignedDocs.length === 0 ? (
        <GlassCard variant="elevated" className="py-20 text-center" hover={false}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10">
            <CheckCircle className="h-7 w-7 text-emerald" />
          </div>
          <h3 className="text-lg font-semibold text-white">All clear!</h3>
          <p className="mt-1 text-sm text-txt-muted">No pending KYC submissions.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {queueWithSignedDocs.map((u) => (
            <GlassCard key={u.id} variant="elevated" className="overflow-hidden p-0" hover={false}>
              {/* Top bar */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-token p-5">
                <div>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="text-lg font-semibold text-electric-bright hover:underline"
                  >
                    {u.full_name ?? "Unknown"}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-txt-muted">
                    <span>{u.email}</span>
                    <span>·</span>
                    <span className="capitalize">{u.role}</span>
                    <span>·</span>
                    <span>Submitted {timeAgo(u.updated_at)}</span>
                  </div>
                </div>
                <KycActions userId={u.id} />
              </div>

              {/* Document grid */}
              <div className="grid gap-3 p-5 sm:grid-cols-3">
                {(
                  [
                    ["Aadhaar / ID", u.aadhaar_doc_url],
                    ["Selfie",       u.selfie_url],
                    ["Property doc", u.property_proof_url],
                  ] as [string, string | null][]
                ).map(([label, url]) => (
                  <div key={label} className="overflow-hidden rounded-xl border border-border-token bg-bg-overlay">
                    <div className="flex items-center justify-between border-b border-border-token px-3 py-2">
                      <p className="text-xs font-semibold text-txt-muted">{label}</p>
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] text-electric-bright hover:underline"
                        >
                          <ExternalLink className="h-2.5 w-2.5" />
                          Full size
                        </a>
                      )}
                    </div>
                    <div className="flex h-36 items-center justify-center">
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={label}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-txt-disabled">
                          <ImageOff className="h-6 w-6" />
                          <span className="text-xs">Not uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
