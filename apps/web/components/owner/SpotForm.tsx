'use client';

import { spotSchema } from '@parknear/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';


const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Nominatim reverse-geocode response (OpenStreetMap — free, no key needed)
type NominatimResult = {
  display_name: string;
  address: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    quarter?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    state_district?: string;
  };
};

type Mode = 'create' | 'edit';

export function SpotForm({ mode, spotId }: { mode: Mode; spotId?: string }) {
  const router = useRouter();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const { data: session } = useSession();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [latitude, setLatitude] = useState('13.0827');
  const [longitude, setLongitude] = useState('80.2707');
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [fuzzyLandmark, setFuzzyLandmark] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [spotType, setSpotType] = useState('car');
  const [coverage, setCoverage] = useState('covered');
  const [vehicleSize, setVehicleSize] = useState('any');
  const [totalSlots, setTotalSlots] = useState(1);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [priceHour, setPriceHour] = useState('');
  const [priceDay, setPriceDay] = useState('');
  const [priceMonth, setPriceMonth] = useState('');
  const [availableAllDay, setAvailableAllDay] = useState(false);
  const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');
  const [instantBook, setInstantBook] = useState(true);

  // ── Geolocation ──────────────────────────────────────────────────────────
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError,   setGeoError]   = useState<string | null>(null);
  const [geoSuccess, setGeoSuccess] = useState(false);
  const [geoAttemptedOnce, setGeoAttemptedOnce] = useState(false);

  async function detectLocation() {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    setGeoSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));

        // Reverse geocode with Nominatim (free, no API key)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
            { headers: { 'User-Agent': 'ParkNear/1.0' } }
          );
          const data = (await res.json()) as NominatimResult;
          const addr = data.address;

          const streetParts = [addr.road, addr.neighbourhood ?? addr.suburb ?? addr.quarter]
            .filter(Boolean)
            .join(', ');
          setAddressLine(streetParts || data.display_name.split(',').slice(0, 2).join(', ').trim());
          setLandmark(addr.suburb ?? addr.neighbourhood ?? addr.quarter ?? '');
          setPincode(addr.postcode ?? '');
          setFuzzyLandmark(
            addr.suburb ?? addr.neighbourhood ?? addr.city_district ?? addr.city ?? addr.town ?? ''
          );
        } catch {
          // Coords are already set — reverse geocode failure is non-fatal
        }
        setGeoSuccess(true);
        setGeoLoading(false);
      },
      (err) => {
        const msg =
          err.code === 1 ? 'Location access denied. Allow it in browser settings and try again.' :
          err.code === 2 ? 'Position unavailable. Try entering coordinates manually.' :
                           'Location request timed out. Try again.';
        setGeoError(msg);
        setGeoLoading(false);
      },
      { timeout: 12000, maximumAge: 60_000, enableHighAccuracy: true }
    );
  }

  useEffect(() => {
    if (mode !== 'edit' || !spotId) return;
    void (async () => {
      const res = await fetch(`/api/owner/spots/${spotId}/edit-data`);
      const json = (await res.json()) as { spot?: Record<string, unknown>; availability?: Array<{ day_of_week: number; start_time: string; end_time: string }>; error?: string };
      setLoading(false);
      if (!res.ok || !json.spot) {
        setError(json.error ?? 'Not found');
        return;
      }
      const row = json.spot;
      setLatitude(String(row.latitude ?? ''));
      setLongitude(String(row.longitude ?? ''));
      setAddressLine(String(row.address_line ?? ''));
      setLandmark(String(row.landmark ?? ''));
      setPincode(String(row.pincode ?? ''));
      setFuzzyLandmark(String(row.fuzzy_landmark ?? ''));
      setTitle(String(row.title ?? ''));
      setDescription(String(row.description ?? ''));
      setSpotType(String(row.spot_type ?? 'car'));
      setCoverage(String(row.coverage ?? 'covered'));
      setVehicleSize(String(row.vehicle_size ?? 'any'));
      setTotalSlots(Number(row.total_slots ?? 1));
      setAmenities(Array.isArray(row.amenities) ? (row.amenities as string[]) : []);
      setPhotos(Array.isArray(row.photos) ? (row.photos as string[]) : []);
      setVideoUrl(String(row.video_url ?? ''));
      setPriceHour(row.price_per_hour != null ? String(row.price_per_hour) : '');
      setPriceDay(row.price_per_day != null ? String(row.price_per_day) : '');
      setPriceMonth(row.price_per_month != null ? String(row.price_per_month) : '');
      setInstantBook(Boolean(row.is_instant_book));

      const av = json.availability ?? [];
      if (av.length > 0) {
        const allDays = av.map((r) => r.day_of_week).sort((a, b) => a - b);
        const isFullWeek = allDays.length === 7 && allDays.every((d, i) => d === i);
        setAvailableAllDay(isFullWeek);
        if (!isFullWeek) setActiveDays(allDays);
        const first = av[0];
        if (first?.start_time) setStartTime(String(first.start_time).slice(0, 5));
        if (first?.end_time) setEndTime(String(first.end_time).slice(0, 5));
      }
    })();
  }, [mode, spotId]);

  // Auto-attempt current location on create flow (Step 1),
  // so owners usually don't need to type coordinates manually.
  useEffect(() => {
    if (mode !== 'create' || step !== 1 || geoAttemptedOnce) return;
    setGeoAttemptedOnce(true);
    void detectLocation();
  }, [mode, step, geoAttemptedOnce]);

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const next = [...photos];
    for (const file of Array.from(files)) {
      if (next.length >= 6) break;
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/owner/spot-photos/upload', {
        method: 'POST',
        body: form,
      });
      const json = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !json.path) {
        setError(json.error ?? 'Photo upload failed');
        continue;
      }
      next.push(json.path);
    }
    setPhotos(next);
  }

  async function onSubmit() {
    setError(null);
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const ph = parseFloat(priceHour);
    const pd = parseFloat(priceDay);
    const pm = parseFloat(priceMonth);
    const parsed = spotSchema.safeParse({
      title,
      description: description || undefined,
      spot_type: spotType,
      coverage,
      vehicle_size: vehicleSize,
      total_slots: totalSlots,
      address_line: addressLine,
      landmark: landmark || undefined,
      pincode: pincode || undefined,
      fuzzy_landmark: fuzzyLandmark,
      fuzzy_radius_meters: 500,
      price_per_hour: Number.isFinite(ph) ? ph : undefined,
      price_per_day: Number.isFinite(pd) ? pd : undefined,
      price_per_month: Number.isFinite(pm) ? pm : undefined,
      is_instant_book: instantBook,
      amenities,
      photos,
      video_url: videoUrl.trim() ? videoUrl.trim() : null,
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid');
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError('Invalid coordinates');
      return;
    }
    const hasPrice = [ph, pd, pm].some((x) => Number.isFinite(x) && x > 0);
    if (!hasPrice) {
      setError('Set at least one price');
      return;
    }
    if (photos.length < 2) {
      setError('Upload at least 2 photos');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        mode,
        spotId,
        latitude: lat,
        longitude: lng,
        startTime,
        endTime,
        activeDays,
        availableAllDay,
        spot: {
          title: title.trim(),
          description: description.trim() || undefined,
          spot_type: spotType,
          coverage,
          vehicle_size: vehicleSize,
          total_slots: totalSlots,
          address_line: addressLine.trim(),
          landmark: landmark.trim() || undefined,
          pincode: pincode.trim() || undefined,
          fuzzy_landmark: fuzzyLandmark.trim(),
          fuzzy_radius_meters: 500,
          price_per_hour: Number.isFinite(ph) ? ph : undefined,
          price_per_day: Number.isFinite(pd) ? pd : undefined,
          price_per_month: Number.isFinite(pm) ? pm : undefined,
          is_instant_book: instantBook,
          amenities,
          photos,
          video_url: videoUrl.trim() || null,
        },
      };
      const res = await fetch('/api/owner/spots/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to save spot');
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-slate-400">Loading…</p>;
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="flex flex-wrap gap-2 text-sm text-slate-400">
        {[1, 2, 3, 4].map((s) => (
          <button
            key={s}
            type="button"
            className={`rounded-full px-3 py-1 ${step === s ? 'bg-sky-500 text-slate-950' : 'bg-slate-800'}`}
            onClick={() => setStep(s)}
          >
            {s}. {['Location', 'Details', 'Photos', 'Pricing'][s - 1]}
          </button>
        ))}
        <Link href="/dashboard" className="ml-auto text-sky-400 hover:underline">
          Back
        </Link>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {mode === 'create' && session?.user?.kycStatus === 'not_submitted' ? (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          KYC proof is required before publishing a listing.
          <Link href="/kyc" className="ml-2 text-electric-bright hover:underline">
            Submit KYC now
          </Link>
        </div>
      ) : null}

      {step === 1 ? (
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">

          {/* ── Detect location button ── */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={geoLoading}
              onClick={() => void detectLocation()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-300 transition-all hover:bg-sky-500/20 hover:border-sky-400/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {geoLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Detecting location…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                    <path d="M12 9a3 3 0 100 6 3 3 0 000-6z" />
                  </svg>
                  Use my current location
                </>
              )}
            </button>

            {geoSuccess && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Location detected — address fields auto-filled. Review and adjust if needed.
              </p>
            )}
            {geoError && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {geoError}
              </p>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-500">or enter manually</span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          {/* ── Coordinate inputs ── */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-slate-500">
              Latitude
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
                placeholder="e.g. 13.082700"
                value={latitude}
                onChange={(e) => { setLatitude(e.target.value); setGeoSuccess(false); }}
              />
            </label>
            <label className="block text-xs text-slate-500">
              Longitude
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
                placeholder="e.g. 80.270700"
                value={longitude}
                onChange={(e) => { setLongitude(e.target.value); setGeoSuccess(false); }}
              />
            </label>
          </div>

          {/* ── Live OSM map preview ── */}
          {(() => {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            const delta = 0.004;
            const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta},${lat - delta},${lng + delta},${lat + delta}&layer=mapnik&marker=${lat},${lng}`;
            return (
              <div className="overflow-hidden rounded-xl border border-slate-700">
                <p className="border-b border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-slate-400">
                  📍 Map preview — {lat.toFixed(5)}, {lng.toFixed(5)}
                </p>
                <iframe
                  src={src}
                  title="Spot location preview"
                  className="h-52 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <a
                  href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border-t border-slate-700 bg-slate-900 px-3 py-1.5 text-center text-[11px] text-sky-400 hover:text-sky-300"
                >
                  Open in OpenStreetMap ↗
                </a>
              </div>
            );
          })()}

          {/* ── Address fields ── */}
          <label className="block text-xs text-slate-500">
            Address line
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
              placeholder="Street / road name"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-slate-500">
              Landmark (optional)
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
                placeholder="Near Anna Nagar Tower"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
              />
            </label>
            <label className="block text-xs text-slate-500">
              Pincode
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
                placeholder="600001"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
            </label>
          </div>
          <label className="block text-xs text-slate-500">
            Public area name <span className="text-slate-600">(shown to seekers instead of exact address)</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
              placeholder="e.g. Anna Nagar, Velachery"
              value={fuzzyLandmark}
              onChange={(e) => setFuzzyLandmark(e.target.value)}
            />
          </label>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <label className="block text-xs text-slate-500">
            Title
            <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block text-xs text-slate-500">
            Description
            <textarea className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Spot type" value={spotType} onChange={setSpotType} options={['car', 'bike', 'both', 'ev_charging']} />
            <Select label="Coverage" value={coverage} onChange={setCoverage} options={['covered', 'open', 'underground']} />
            <Select label="Vehicle size" value={vehicleSize} onChange={setVehicleSize} options={['hatchback', 'sedan', 'suv', 'any']} />
          </div>
          <label className="block text-xs text-slate-500">
            Slots
            <input
              type="number"
              min={1}
              max={20}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={totalSlots}
              onChange={(e) => setTotalSlots(parseInt(e.target.value, 10) || 1)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {['cctv', 'security', 'shade', 'ev_charger', 'wash_bay', 'well_lit', 'easy_access'].map((id) => {
              const on = amenities.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-medium ${on ? 'bg-emerald-600 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                  onClick={() =>
                    setAmenities(on ? amenities.filter((a) => a !== id) : [...amenities, id])
                  }
                >
                  {id}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-sm text-slate-400">Upload 2–6 images (JPEG/PNG/WebP).</p>
          <input type="file" accept="image/*" multiple onChange={(e) => void onFiles(e.target.files)} />
          <p className="text-xs text-slate-500">{photos.length} uploaded</p>
          <div className="flex flex-wrap gap-2">
            {photos.map((p) => (
              <img key={p} src={`${url}/storage/v1/object/public/spot-photos/${p}`} alt="" className="h-20 w-28 rounded-md object-cover" />
            ))}
          </div>
          <label className="block text-xs text-slate-500">
            Video URL (optional)
            <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          </label>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-xs text-slate-500">
              ₹ / hour
              <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={priceHour} onChange={(e) => setPriceHour(e.target.value)} />
            </label>
            <label className="block text-xs text-slate-500">
              ₹ / day
              <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={priceDay} onChange={(e) => setPriceDay(e.target.value)} />
            </label>
            <label className="block text-xs text-slate-500">
              ₹ / month
              <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={priceMonth} onChange={(e) => setPriceMonth(e.target.value)} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={availableAllDay} onChange={(e) => setAvailableAllDay(e.target.checked)} />
            Available all day
          </label>
          {!availableAllDay ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d, i) => {
                  const on = activeDays.includes(i);
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`h-9 w-9 rounded-full text-xs font-bold ${on ? 'bg-emerald-600 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                      onClick={() =>
                        setActiveDays(on ? activeDays.filter((x) => x !== i) : [...activeDays, i].sort())
                      }
                    >
                      {d[0]}
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-slate-500">
                  Start
                  <input type="time" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </label>
                <label className="block text-xs text-slate-500">
                  End
                  <input type="time" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </label>
              </div>
            </div>
          ) : null}
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={instantBook} onChange={(e) => setInstantBook(e.target.checked)} />
            Instant book
          </label>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step > 1 ? (
          <button type="button" className="rounded-lg border border-slate-600 px-4 py-2 text-slate-200" onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4)}>
            Back
          </button>
        ) : null}
        {step < 4 ? (
          <button type="button" className="rounded-lg bg-sky-500 px-4 py-2 font-semibold text-slate-950" onClick={() => setStep((s) => Math.min(4, s + 1) as 1 | 2 | 3 | 4)}>
            Next
          </button>
        ) : (
          <button type="button" disabled={saving} className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50" onClick={onSubmit}>
            {saving ? 'Saving…' : mode === 'create' ? 'Publish' : 'Save'}
          </button>
        )}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block text-xs text-slate-500">
      {label}
      <select className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
