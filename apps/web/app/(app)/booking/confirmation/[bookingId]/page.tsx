import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnerContactForSeekerBooking } from "@parknear/shared";
import { MapPin, Navigation, ArrowRight, Phone, Star } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@/auth";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { Pill } from "@/components/ui/pill";
import { ConfirmationClient } from "./ConfirmationClient";
import { CancelBookingButton } from "@/components/booking/CancelBookingButton";

type Props = { params: { bookingId: string } };

function parseCoords(raw: unknown): { lat: number; lng: number } | null {
  if (!raw) return null;
  if (Array.isArray(raw) && raw.length > 0) {
    return parseCoords(raw[0]);
  }
  if (typeof raw === "object" && raw !== null && "coordinates" in raw) {
    const coords = (raw as { coordinates?: unknown }).coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }
  const s = String(raw);
  // EWKB hex fallback (common shape for PostGIS geography)
  if (/^[0-9A-Fa-f]{50,}$/.test(s) && s.length % 2 === 0) {
    try {
      const buf = Buffer.from(s, "hex");
      const littleEndian = buf.readUInt8(0) === 1;
      const type = littleEndian ? buf.readUInt32LE(1) : buf.readUInt32BE(1);
      const hasSrid = (type & 0x20000000) !== 0;
      let off = 1 + 4 + (hasSrid ? 4 : 0);
      const lng = littleEndian ? buf.readDoubleLE(off) : buf.readDoubleBE(off);
      off += 8;
      const lat = littleEndian ? buf.readDoubleLE(off) : buf.readDoubleBE(off);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    } catch {
      // ignore and continue other parsers
    }
  }
  const m = s.match(/POINT\((-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)\)/i);
  if (m) {
    const lng = Number(m[1]);
    const lat = Number(m[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

export default async function BookingConfirmationWebPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const supabase = createServerSupabaseClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      gate_otp,
      start_time,
      end_time,
      total_price,
      spots ( title, address_line, location ),
      spot_id
    `)
    .eq("id", params.bookingId)
    .eq("seeker_id", session.user.id)
    .single();

  if (!booking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-base px-4">
        <GlassCard variant="elevated" className="max-w-sm py-16 text-center">
          <p className="text-txt-secondary">Booking not found.</p>
          <Link href="/bookings" className="mt-4 inline-block text-sm text-electric-bright hover:underline">
            ← My bookings
          </Link>
        </GlassCard>
      </main>
    );
  }

  const b = booking as unknown as {
    id: string;
    status: string;
    gate_otp: string | null;
    start_time: string;
    end_time: string | null;
    total_price: number;
    spots: { title: string; address_line: string; location?: unknown } | Array<{ title: string; address_line: string; location?: unknown }> | null;
    spot_id: string;
  };
  const spot = Array.isArray(b.spots) ? b.spots[0] : b.spots;
  const ownerContact = await getOwnerContactForSeekerBooking(supabase, params.bookingId);
  let coords: { lat: number; lng: number } | null = null;

  // 1) Preferred: seeker-scoped RPC that reads exact saved spot coordinates.
  if (b.spot_id) {
    const { data: exactRows } = await supabase.rpc("get_spot_coordinates_for_seeker", {
      p_spot_id: b.spot_id,
    });
    const first = Array.isArray(exactRows) ? exactRows[0] : null;
    const lat = Number((first as { lat?: unknown } | null)?.lat);
    const lng = Number((first as { lng?: unknown } | null)?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      coords = { lat, lng };
    }
  }

  // 2) Fallback: parse joined location payload / service-role read.
  if (!coords) {
    let parsedCoords = parseCoords(spot?.location);
    if (!parsedCoords && b.spot_id) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (url && key) {
        const admin = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: spotRow } = await admin
          .from("spots")
          .select("location")
          .eq("id", b.spot_id)
          .maybeSingle();
        parsedCoords = parseCoords(spotRow?.location);
      }
    }
    coords = parsedCoords;
  }
  const mapToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? "";
  const mapSrc =
    coords && mapToken
      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+3D7BFF(${coords.lng},${coords.lat})/${coords.lng},${coords.lat},14/900x320?access_token=${mapToken}`
      : null;
  const googleMapsUrl = coords
    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
    : null;

  function fmt(iso: string) {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="min-h-screen bg-bg-base">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[60vh] bg-[radial-gradient(ellipse_60%_50%_at_50%_-5%,rgba(16,185,129,0.12)_0%,transparent_65%)]" />

      <div className="relative mx-auto max-w-lg px-4 py-8 pt-24 sm:px-6">
        {/* ─── Animated success hero (client) ─── */}
        <ConfirmationClient />

        {/* ─── Confirmation header ─── */}
        <div className="mb-6 text-center">
          <Pill variant="emerald" pulse className="mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
            Booking confirmed
          </Pill>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{spot?.title}</h1>
          {spot?.address_line && (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-txt-secondary">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-electric-bright" />
              {spot.address_line}
            </p>
          )}
        </div>

        {/* ─── Gate OTP ─── */}
        {b.gate_otp && (
          <GlassCard variant="elevated" className="mb-4 overflow-hidden" hover={false}>
            {/* Top glow line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald/50 to-transparent" />
            <div className="p-6 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-txt-muted">
                Gate Entry Code
              </p>
              <p className="mb-4 font-mono text-5xl font-black tracking-[0.3em] text-white text-glow">
                {b.gate_otp}
              </p>
              <p className="mb-4 text-xs text-txt-muted">
                Show this code at the parking entrance
              </p>
              {/* Copy code link — server rendered, client copy handled by browser */}
              <CopyOtpButton otp={b.gate_otp} />
            </div>
          </GlassCard>
        )}

        {/* ─── Booking details ─── */}
        <GlassCard variant="elevated" className="mb-4 p-5" hover={false}>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-txt-muted">
            Booking details
          </h2>
          <dl className="space-y-3">
            <DetailRow label="Booking ID" value={b.id.slice(0, 8).toUpperCase()} mono />
            <DetailRow label="Status">
              <Pill variant="emerald" className="text-[10px]">{b.status}</Pill>
            </DetailRow>
            <DetailRow label="Start" value={fmt(b.start_time)} />
            {b.end_time && <DetailRow label="End" value={fmt(b.end_time)} />}
            <DetailRow
              label="Total paid"
              value={`₹${Number(b.total_price).toFixed(0)}`}
              highlight
            />
          </dl>
        </GlassCard>

        {/* ─── Owner contact (RPC: seeker + confirmed/active booking only) ─── */}
        {ownerContact ? (
          <GlassCard variant="elevated" className="mb-4 p-5" hover={false}>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-txt-muted">
              <Phone className="h-3.5 w-3.5 text-electric-bright" />
              Spot owner
            </h2>
            <p className="text-sm font-semibold text-white">{ownerContact.full_name}</p>
            {ownerContact.phone ? (
              <a
                href={`tel:${ownerContact.phone}`}
                className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-electric-bright hover:underline"
              >
                {ownerContact.phone}
              </a>
            ) : (
              <p className="mt-2 text-xs text-txt-muted">Phone not on file — use Message host in the app if available.</p>
            )}
            <p className="mt-3 text-2xs text-txt-disabled">
              Contact details are shown once your booking is confirmed.
            </p>
          </GlassCard>
        ) : null}

        {/* ─── Post-booking location map (seeker-visible only after booking) ─── */}
        <GlassCard variant="elevated" className="mb-4 overflow-hidden" hover={false}>
          <div className="border-b border-border-token px-4 py-2.5">
            <p className="text-sm font-semibold text-white">Parking location</p>
            <p className="text-xs text-txt-muted">Visible after booking confirmation.</p>
          </div>
          {mapSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mapSrc} alt="Booked parking location map" className="h-52 w-full object-cover" />
          ) : (
            <div className="px-4 py-6 text-center text-xs text-txt-muted">
              {mapToken
                ? "Location map unavailable for this spot."
                : "Map preview unavailable. Missing NEXT_PUBLIC_MAPBOX_TOKEN."}
            </div>
          )}
          {googleMapsUrl ? (
            <div className="border-t border-border-token p-3">
              <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="block">
                <GlowButton variant="glass" fullWidth icon={<Navigation className="h-4 w-4" />}>
                  Open in map
                </GlowButton>
              </a>
            </div>
          ) : null}
        </GlassCard>

        {/* ─── Actions ─── */}
        <div className="flex flex-col gap-3">
          <Link href={`/spot/${b.spot_id}`}>
            <GlowButton variant="glass" fullWidth icon={<Navigation className="h-4 w-4" />}>
              View spot details
            </GlowButton>
          </Link>

          {/* Leave a review — only for completed bookings */}
          {b.status === "completed" && (
            <Link href={`/booking/review/${b.id}`}>
              <GlowButton
                variant="glass"
                fullWidth
                icon={<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                className="border-yellow-500/20 hover:border-yellow-500/40"
              >
                Leave a review
              </GlowButton>
            </Link>
          )}

          {/* Cancel — only for pending/confirmed */}
          {["pending", "confirmed"].includes(b.status) && (
            <CancelBookingButton
              bookingId={b.id}
              status={b.status}
              startTime={b.start_time}
            />
          )}

          <Link href="/bookings">
            <GlowButton variant="primary" fullWidth icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
              My bookings
            </GlowButton>
          </Link>
          <Link href="/search">
            <GlowButton variant="ghost" fullWidth>
              Find more parking
            </GlowButton>
          </Link>
        </div>
      </div>
    </main>
  );
}

// ─── Static detail row ──────────────────────────────────────
function DetailRow({
  label,
  value,
  mono,
  highlight,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  highlight?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-txt-muted">{label}</dt>
      <dd
        className={[
          mono ? "font-mono" : "",
          highlight ? "font-bold text-white" : "text-txt-primary",
          "text-sm text-right",
        ].join(" ")}
      >
        {children ?? value}
      </dd>
    </div>
  );
}

// ─── Copy button — static fallback (navigator.clipboard handled by the browser's built-in context menu) ─────
function CopyOtpButton({ otp }: { otp: string }) {
  // Static link that the user can long-press/right-click to copy
  // A client component version can be added if clipboard API is needed
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald/25 bg-emerald/10 px-4 py-2 text-xs font-semibold text-emerald select-all cursor-copy">
      {otp}
    </span>
  );
}
