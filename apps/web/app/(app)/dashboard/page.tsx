import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ParkingSquare, Calendar, TrendingUp, Star,
  Plus, Home, Shield, ChevronRight, MapPin, Car, IdCard, ArrowRight,
} from "lucide-react";
import type { Spot } from "@parknear/shared";

import { OwnerSpotList } from "@/components/owner/OwnerSpotList";
import { SignOutButton } from "@/components/SignOutButton";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@/auth";
import { AnimatedSection, AnimatedItem } from "@/components/ui/animated-section";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { Pill } from "@/components/ui/pill";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { fadeUp } from "@/lib/motion-variants";

export default async function OwnerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const supabase = createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email, role, kyc_status")
    .eq("id", userId)
    .single();

  const isAdmin = profile?.role === "admin";

  const { data: spots } = await supabase
    .from("spots")
    .select(
      "id, title, photos, is_active, avg_rating, total_reviews, spot_type, coverage, price_per_hour, created_at"
    )
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  const { data: myBookings } = await supabase
    .from("bookings")
    .select("id, status, start_time, total_price, spots ( title, address_line )")
    .eq("seeker_id", userId)
    .order("start_time", { ascending: false })
    .limit(5);

  const spotIds = (spots ?? []).map((s) => s.id);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  let totalBookingsMonth = 0;
  let monthlyEarnings = 0;
  if (spotIds.length) {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("status, owner_payout, created_at")
      .in("spot_id", spotIds)
      .gte("created_at", monthStart.toISOString());

    for (const b of bookings ?? []) {
      totalBookingsMonth += 1;
      if (b.status === "completed" && b.owner_payout != null) {
        monthlyEarnings += Number(b.owner_payout);
      }
    }
  }

  const activeListings = (spots ?? []).filter((s) => s.is_active).length;
  const { count: vehicleCount } = await supabase
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const hasVehicle = (vehicleCount ?? 0) > 0;
  const kycDone = ["submitted", "verified"].includes(String(profile?.kyc_status ?? ""));
  const profileCompletion = Math.round(((Number(hasVehicle) + Number(kycDone)) / 2) * 100);
  let avgRatingSum = 0;
  let ratingCount = 0;
  for (const s of spots ?? []) {
    if (Number(s.total_reviews) > 0) {
      avgRatingSum += Number(s.avg_rating);
      ratingCount += 1;
    }
  }
  const avgRating = ratingCount ? avgRatingSum / ratingCount : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = profile?.full_name ?? session.user.email ?? "Owner";

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function bookingTone(status: string) {
    const s = status.toLowerCase();
    if (["confirmed", "active", "checked_in", "completed"].includes(s)) return "text-emerald";
    if (["cancelled_by_owner", "cancelled_by_seeker", "cancelled", "no_show"].includes(s)) return "text-danger";
    return "text-warning";
  }

  return (
    <main className="min-h-screen bg-bg-base">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[50vh] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(61,123,255,0.10)_0%,transparent_65%)]" />

      <div className="relative mx-auto max-w-5xl px-4 pb-8 pt-24 sm:px-6">
        <AnimatedSection stagger staggerDelay={0.06}>

          {/* ─── Header ─── */}
          <AnimatedItem variants={fadeUp}>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-electric shadow-glow-sm">
                    <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </div>
                  <Link href="/" className="text-sm font-bold text-white">
                    Park<span className="text-gradient">Near</span>
                  </Link>
                </div>
                <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                  {greeting},{" "}
                  <span className="text-gradient">{displayName.split(" ")[0]}</span>
                </h1>
                <p className="mt-1 text-sm text-txt-muted">{session.user.email}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!["submitted", "verified"].includes(String(session.user.kycStatus ?? "")) && (
                  <Link href="/kyc">
                    <GlowButton variant="outline" size="sm" icon={<Shield className="h-3.5 w-3.5" />}>
                      Submit KYC
                    </GlowButton>
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin">
                    <GlowButton variant="outline" size="sm" icon={<Shield className="h-3.5 w-3.5" />}>
                      Admin
                    </GlowButton>
                  </Link>
                )}
                <Link href="/spots/new">
                  <GlowButton variant="emerald" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
                    New spot
                  </GlowButton>
                </Link>
                <Link href="/">
                  <GlowButton variant="glass" size="sm" icon={<Home className="h-3.5 w-3.5" />}>
                    Home
                  </GlowButton>
                </Link>
                <Link href="/profile">
                  <GlowButton variant="glass" size="sm" icon={<Car className="h-3.5 w-3.5" />}>
                    Profile
                  </GlowButton>
                </Link>
                <Link href="/bookings">
                  <GlowButton variant="glass" size="sm" icon={<Calendar className="h-3.5 w-3.5" />}>
                    My bookings
                  </GlowButton>
                </Link>
                <SignOutButton className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border-token bg-bg-surface/50 px-3 text-sm font-medium text-txt-secondary backdrop-blur-sm transition-colors hover:border-border-token-bright hover:text-txt-primary" />
              </div>
            </div>
          </AnimatedItem>

          <AnimatedItem variants={fadeUp}>
            <div className="mb-6 grid gap-3 rounded-2xl border border-border-token bg-bg-surface p-4 sm:grid-cols-2">
              <Link href="/profile" className="rounded-xl border border-border-token bg-bg-elevated p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Car className="h-4 w-4 text-electric-bright" />
                  Vehicle setup
                </p>
                <p className="mt-1 text-xs text-txt-muted">Required before booking.</p>
                <p className={`mt-2 text-xs ${hasVehicle ? "text-emerald" : "text-warning"}`}>
                  {hasVehicle ? "Completed" : "Add your first vehicle"}
                </p>
              </Link>
              <Link href="/kyc" className="rounded-xl border border-border-token bg-bg-elevated p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <IdCard className="h-4 w-4 text-electric-bright" />
                  ID/KYC details
                </p>
                <p className="mt-1 text-xs text-txt-muted">Required before listing spots.</p>
                <p className={`mt-2 text-xs ${kycDone ? "text-emerald" : "text-warning"}`}>
                  {kycDone ? `Status: ${String(profile?.kyc_status ?? "submitted")}` : "Submit your documents"}
                </p>
              </Link>
            </div>
          </AnimatedItem>

          <AnimatedItem variants={fadeUp}>
            <div className="mb-6 rounded-2xl border border-border-token bg-bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Profile completion</p>
                <p className="text-xs font-semibold text-electric-bright">{profileCompletion}%</p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-bg-elevated">
                <div
                  className="h-full rounded-full bg-electric transition-all duration-300"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-txt-muted">
                {profileCompletion === 100
                  ? "All required setup is complete."
                  : "Complete vehicle and KYC details to unlock all flows."}
              </p>
            </div>
          </AnimatedItem>

          <AnimatedItem variants={fadeUp}>
            <div className="mb-8 rounded-2xl border border-border-token bg-bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Your recent bookings</h2>
                <Link href="/bookings" className="text-xs text-electric-bright hover:underline">
                  View all
                </Link>
              </div>
              {(myBookings ?? []).length === 0 ? (
                <div className="rounded-xl border border-border-token bg-bg-elevated p-4">
                  <p className="text-sm text-txt-secondary">No bookings yet.</p>
                  <Link href="/search" className="mt-2 inline-flex items-center gap-1 text-xs text-electric-bright hover:underline">
                    Find and book a space <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {(myBookings ?? []).map((b) => {
                    const spot = Array.isArray(b.spots) ? b.spots[0] : b.spots;
                    return (
                      <li key={b.id} className="rounded-xl border border-border-token bg-bg-elevated p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{spot?.title ?? "Parking spot"}</p>
                            {spot?.address_line ? (
                              <p className="truncate text-xs text-txt-muted">{spot.address_line}</p>
                            ) : null}
                            <p className="mt-1 text-xs text-txt-secondary">{fmtDate(b.start_time)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xs font-semibold uppercase ${bookingTone(String(b.status ?? ""))}`}>
                              {String(b.status ?? "pending")}
                            </p>
                            <p className="mt-1 text-sm font-bold text-white">₹{Number(b.total_price ?? 0).toFixed(0)}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Link
                            href={`/booking/confirmation/${b.id}`}
                            className="text-xs font-medium text-electric-bright hover:underline"
                          >
                            Open booking details
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </AnimatedItem>

          {/* ─── KPI cards ─── */}
          <AnimatedItem variants={fadeUp}>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <DashKpi
                icon={ParkingSquare}
                label="Active listings"
                value={activeListings}
                suffix=""
                iconBg="bg-electric/10"
                iconColor="text-electric-bright"
                glowColor="rgba(61,123,255,0.15)"
              />
              <DashKpi
                icon={Calendar}
                label="Bookings this month"
                value={totalBookingsMonth}
                suffix=""
                iconBg="bg-neon/10"
                iconColor="text-neon-bright"
                glowColor="rgba(0,170,255,0.15)"
              />
              <DashKpi
                icon={TrendingUp}
                label="Earnings this month"
                prefix="₹"
                value={Math.round(monthlyEarnings)}
                suffix=""
                iconBg="bg-emerald/10"
                iconColor="text-emerald"
                glowColor="rgba(16,185,129,0.15)"
              />
              <DashKpi
                icon={Star}
                label="Average rating"
                value={avgRating}
                suffix=""
                decimals={1}
                iconBg="bg-warning/10"
                iconColor="text-warning"
                glowColor="rgba(251,191,36,0.15)"
                empty={ratingCount === 0}
                emptyLabel="—"
              />
            </div>
          </AnimatedItem>

          {/* ─── Quick actions strip ─── */}
          {spots && spots.length > 0 && (
            <AnimatedItem variants={fadeUp}>
              <div className="mb-8 flex flex-wrap gap-3">
                <Pill variant="primary">
                  <ParkingSquare className="h-3 w-3" />
                  {spots.length} listing{spots.length !== 1 ? "s" : ""}
                </Pill>
                <Pill variant={activeListings > 0 ? "emerald" : "primary"}>
                  {activeListings} active
                </Pill>
              </div>
            </AnimatedItem>
          )}

          {/* ─── Spots list ─── */}
          <AnimatedItem variants={fadeUp}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Your listings</h2>
              <Link href="/spots/new">
                <GlowButton variant="glass" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
                  Add spot
                </GlowButton>
              </Link>
            </div>
            <OwnerSpotList spots={(spots ?? []) as unknown as Spot[]} />
          </AnimatedItem>

          {/* ─── Empty state ─── */}
          {(!spots || spots.length === 0) && (
            <AnimatedItem variants={fadeUp}>
              <GlassCard variant="elevated" className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-electric/10">
                  <ParkingSquare className="h-8 w-8 text-electric-bright" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">No listings yet</h3>
                <p className="mb-6 text-sm text-txt-secondary">
                  Create your first parking spot and start earning.
                </p>
                <Link href="/spots/new">
                  <GlowButton variant="primary" icon={<ChevronRight className="h-4 w-4" />} iconPosition="right">
                    Create your first spot
                  </GlowButton>
                </Link>
              </GlassCard>
            </AnimatedItem>
          )}

        </AnimatedSection>
      </div>
    </main>
  );
}

// ─── Inline KPI Card ────────────────────────────────────────
function DashKpi({
  icon: Icon,
  label,
  value,
  suffix,
  prefix,
  decimals = 0,
  iconBg,
  iconColor,
  glowColor,
  empty = false,
  emptyLabel,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix: string;
  prefix?: string;
  decimals?: number;
  iconBg: string;
  iconColor: string;
  glowColor: string;
  empty?: boolean;
  emptyLabel?: string;
}) {
  return (
    <GlassCard variant="elevated" className="p-4 sm:p-5" hover={false}>
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}
        style={{ boxShadow: `0 0 16px ${glowColor}` }}
      >
        <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={1.75} />
      </div>
      {empty ? (
        <p className="text-2xl font-bold text-txt-muted">{emptyLabel ?? "—"}</p>
      ) : (
        <AnimatedNumber
          value={value}
          suffix={suffix}
          prefix={prefix}
          decimals={decimals}
          className="text-2xl font-bold text-white sm:text-3xl"
        />
      )}
      <p className="mt-1 text-xs font-medium text-txt-muted">{label}</p>
    </GlassCard>
  );
}
