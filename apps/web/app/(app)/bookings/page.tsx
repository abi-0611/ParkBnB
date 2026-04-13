import Link from "next/link";
import { redirect } from "next/navigation";
import { getSpotPhotoPublicUrl } from "@parknear/shared";
import { CalendarClock, MapPin, ArrowRight, ParkingSquare, Star } from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@/auth";
import { AnimatedSection, AnimatedItem } from "@/components/ui/animated-section";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { Pill } from "@/components/ui/pill";
import { fadeUp } from "@/lib/motion-variants";
import { CancelBookingButton } from "@/components/booking/CancelBookingButton";

type BookingRow = {
  id: string;
  status: string;
  start_time: string;
  end_time: string | null;
  total_price: number;
  spots: { title: string; address_line: string | null; photos: string[] | null } | null;
};

const CANCELLABLE = ["pending", "confirmed"] as const;

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "primary" | "emerald" | "neon"; dot: string }
> = {
  upcoming:  { label: "Upcoming",  variant: "neon",    dot: "bg-neon" },
  confirmed: { label: "Confirmed", variant: "emerald",  dot: "bg-emerald" },
  active:    { label: "Active",    variant: "emerald",  dot: "bg-emerald animate-ping-slow" },
  completed: { label: "Completed", variant: "primary",  dot: "bg-electric" },
  cancelled: { label: "Cancelled", variant: "primary",  dot: "bg-txt-disabled" },
  pending:   { label: "Pending",   variant: "neon",     dot: "bg-warning" },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function WebBookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const supabase = createServerSupabaseClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const { data: rows } = await supabase
    .from("bookings")
    .select("id, status, start_time, end_time, total_price, spots ( title, address_line, photos )")
    .eq("seeker_id", session.user.id)
    .order("start_time", { ascending: false });

  const bookings = (rows ?? []) as unknown as BookingRow[];

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[40vh] bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(61,123,255,0.08)_0%,transparent_65%)]" />

      <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 pt-24">
        <AnimatedSection stagger staggerDelay={0.07}>

          {/* Header */}
          <AnimatedItem variants={fadeUp}>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">My Bookings</h1>
                <p className="mt-1 text-sm text-txt-muted">
                  {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Link href="/search">
                <GlowButton variant="primary" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />} iconPosition="right">
                  Find parking
                </GlowButton>
              </Link>
            </div>
          </AnimatedItem>

          {/* Booking cards */}
          {bookings.length === 0 ? (
            <AnimatedItem variants={fadeUp}>
              <GlassCard variant="elevated" className="py-20 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-electric/10">
                  <CalendarClock className="h-8 w-8 text-electric-bright" />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-white">No bookings yet</h2>
                <p className="mb-6 text-sm text-txt-secondary">
                  Find a parking spot and book it in seconds.
                </p>
                <Link href="/search">
                  <GlowButton variant="primary" icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
                    Find parking now
                  </GlowButton>
                </Link>
              </GlassCard>
            </AnimatedItem>
          ) : (
            <ul className="space-y-3">
              {bookings.map((b) => {
                const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
                const photo = b.spots?.photos?.[0];
                const photoSrc = photo ? getSpotPhotoPublicUrl(supabaseUrl, photo) : null;

                return (
                  <AnimatedItem key={b.id} variants={fadeUp}>
                    <GlassCard
                      variant="elevated"
                      hover={false}
                      className="group overflow-hidden transition-all duration-300 hover:border-electric/25 hover:shadow-[0_0_20px_rgba(61,123,255,0.10)]"
                    >
                      <div className="flex gap-4 p-4 sm:p-5">
                          {/* Photo or icon */}
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-bg-overlay sm:h-24 sm:w-24">
                            {photoSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={photoSrc}
                                alt={b.spots?.title ?? ""}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ParkingSquare className="h-7 w-7 text-txt-disabled" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-white">{b.spots?.title ?? "Parking spot"}</h3>
                              <Pill variant={cfg.variant} className="text-[10px]">
                                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                              </Pill>
                            </div>

                            {b.spots?.address_line && (
                              <p className="mb-1.5 flex items-center gap-1 text-xs text-txt-muted">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {b.spots.address_line}
                              </p>
                            )}

                            <p className="mb-2 flex items-center gap-1 text-xs text-txt-secondary">
                              <CalendarClock className="h-3 w-3 shrink-0" />
                              {fmt(b.start_time)}
                            </p>

                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-white">
                                ₹{Number(b.total_price).toFixed(0)}
                              </span>
                              <Link
                                href={`/booking/confirmation/${b.id}`}
                                className="flex items-center gap-1 text-xs font-medium text-electric-bright hover:underline"
                              >
                                View details <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>

                            {/* Action row — cancel / review */}
                            {(CANCELLABLE.includes(b.status as typeof CANCELLABLE[number]) || b.status === "completed") && (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {CANCELLABLE.includes(b.status as typeof CANCELLABLE[number]) && (
                                  <CancelBookingButton
                                    bookingId={b.id}
                                    status={b.status}
                                    startTime={b.start_time}
                                    compact
                                  />
                                )}
                                {b.status === "completed" && (
                                  <Link
                                    href={`/booking/review/${b.id}`}
                                    className="flex items-center gap-1 text-xs font-semibold text-yellow-400 hover:text-yellow-300"
                                  >
                                    <Star className="h-3 w-3 fill-yellow-400" />
                                    Review
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                    </GlassCard>
                  </AnimatedItem>
                );
              })}
            </ul>
          )}

        </AnimatedSection>
      </div>
    </main>
  );
}
