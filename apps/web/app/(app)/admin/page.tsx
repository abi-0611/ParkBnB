import {
  fetchBookingsByPincode,
  fetchBookingsLast30Days,
  fetchCumulativeUsers90Days,
  fetchDashboardKpis,
  fetchRecentActivity,
  fetchRevenueLast30Days,
} from "@parknear/shared";
import { Users, ParkingSquare, CalendarClock, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

import { ActivityFeed } from "@/components/admin/ActivityFeed";
import {
  AreasHorizontalChart,
  BookingsLineChart,
  RevenueBarChart,
  UserGrowthChart,
} from "@/components/admin/DashboardCharts";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { cachedOr, CacheKeys, TTL } from "@/lib/redis";
import { GlassCard } from "@/components/ui/glass-card";
import { Pill } from "@/components/ui/pill";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedSection, AnimatedItem } from "@/components/ui/animated-section";
import { fadeUp } from "@/lib/motion-variants";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = createServerSupabaseClient();

  const [kpis, bookingsSeries, revenueSeries, areas, growth, activity] =
    await Promise.all([
      cachedOr(CacheKeys.adminKpis(),       TTL.adminKpis,   () => fetchDashboardKpis(supabase)),
      cachedOr(CacheKeys.adminBookings30(), TTL.adminCharts, () => fetchBookingsLast30Days(supabase)),
      cachedOr(CacheKeys.adminRevenue30(),  TTL.adminCharts, () => fetchRevenueLast30Days(supabase)),
      cachedOr(CacheKeys.adminAreas(8),     TTL.adminCharts, () => fetchBookingsByPincode(supabase, 8)),
      cachedOr(CacheKeys.adminGrowth90(),   TTL.adminCharts, () => fetchCumulativeUsers90Days(supabase)),
      fetchRecentActivity(supabase, 10),  // always fresh — it's a live feed
    ]);

  const momPositive = kpis.signupsMomPct !== null && kpis.signupsMomPct > 0;
  const momLabel =
    kpis.signupsMomPct === null
      ? null
      : `${kpis.signupsMomPct > 0 ? "+" : ""}${kpis.signupsMomPct}% vs last month`;

  return (
    <AnimatedSection stagger staggerDelay={0.06}>
      {/* ─── Page header ─── */}
      <AnimatedItem variants={fadeUp}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-txt-muted">
            Platform overview — users, listings, and bookings.
          </p>
        </div>
      </AnimatedItem>

      {/* ─── KPI cards ─── */}
      <AnimatedItem variants={fadeUp}>
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <AdminKpi
            icon={Users}
            label="Total users"
            value={kpis.totalUsers}
            iconBg="bg-electric/10"
            iconColor="text-electric-bright"
            glowColor="rgba(61,123,255,0.15)"
            badge={momLabel ?? undefined}
            badgeUp={momPositive}
          />
          <AdminKpi
            icon={ParkingSquare}
            label="Active spots"
            value={kpis.activeSpots}
            iconBg="bg-neon/10"
            iconColor="text-neon-bright"
            glowColor="rgba(0,170,255,0.15)"
          />
          <AdminKpi
            icon={CalendarClock}
            label="Bookings this month"
            value={kpis.bookingsThisMonth}
            iconBg="bg-emerald/10"
            iconColor="text-emerald"
            glowColor="rgba(16,185,129,0.15)"
          />
          <AdminKpi
            icon={TrendingUp}
            label="Revenue this month"
            value={Math.round(kpis.revenueThisMonth)}
            prefix="₹"
            iconBg="bg-warning/10"
            iconColor="text-warning"
            glowColor="rgba(251,191,36,0.15)"
            sub="Service fees on completed bookings"
          />
        </div>
      </AnimatedItem>

      {/* ─── Charts grid ─── */}
      <AnimatedItem variants={fadeUp}>
        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Bookings" sub="Last 30 days">
            <BookingsLineChart data={bookingsSeries} />
          </ChartCard>
          <ChartCard title="Revenue" sub="Last 30 days">
            <RevenueBarChart data={revenueSeries} />
          </ChartCard>
          <ChartCard title="Top areas" sub="By booking volume">
            <AreasHorizontalChart rows={areas} />
          </ChartCard>
          <ChartCard title="User growth" sub="90-day cumulative">
            <UserGrowthChart data={growth} />
          </ChartCard>
        </div>
      </AnimatedItem>

      {/* ─── Activity feed ─── */}
      <AnimatedItem variants={fadeUp}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Recent activity</h2>
          <Pill variant="neon" pulse>Live</Pill>
        </div>
        <ActivityFeed initial={activity} />
      </AnimatedItem>
    </AnimatedSection>
  );
}

// ─── Admin KPI Card ──────────────────────────────────────────
function AdminKpi({
  icon: Icon,
  label,
  value,
  prefix,
  iconBg,
  iconColor,
  glowColor,
  badge,
  badgeUp,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  prefix?: string;
  iconBg: string;
  iconColor: string;
  glowColor: string;
  badge?: string;
  badgeUp?: boolean;
  sub?: string;
}) {
  return (
    <GlassCard variant="elevated" className="p-4 sm:p-5" hover={false}>
      <div className="mb-3 flex items-start justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}
          style={{ boxShadow: `0 0 14px ${glowColor}` }}
        >
          <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={1.75} />
        </div>
        {badge && (
          <span
            className={`flex items-center gap-0.5 text-[10px] font-semibold ${
              badgeUp ? "text-emerald" : "text-danger"
            }`}
          >
            {badgeUp ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {badge}
          </span>
        )}
      </div>
      <AnimatedNumber
        value={value}
        prefix={prefix}
        className="text-2xl font-bold text-white sm:text-3xl"
      />
      <p className="mt-1 text-xs font-medium text-txt-muted">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-txt-disabled">{sub}</p>}
    </GlassCard>
  );
}

// ─── Chart card wrapper ──────────────────────────────────────
function ChartCard({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard variant="elevated" hover={false} className="p-4 sm:p-5">
      <div className="mb-4 flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {sub && <span className="text-xs text-txt-muted">{sub}</span>}
      </div>
      {children}
    </GlassCard>
  );
}
