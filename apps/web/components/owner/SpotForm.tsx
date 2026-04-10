'use client';

import { generateUploadPath, spotSchema } from '@parknear/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Mode = 'create' | 'edit';

export function SpotForm({ mode, spotId }: { mode: Mode; spotId?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, [supabase]);

  useEffect(() => {
    if (mode !== 'edit' || !spotId) return;
    void (async () => {
      const { data, error: e } = await supabase.rpc('get_spot_for_owner_edit', { p_id: spotId });
      setLoading(false);
      if (e || !data) {
        setError(e?.message ?? 'Not found');
        return;
      }
      const row = (typeof data === 'string' ? JSON.parse(data) : data) as Record<string, unknown>;
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
    })();
  }, [mode, spotId, supabase]);

  async function onFiles(files: FileList | null) {
    if (!files || !userId) return;
    const next = [...photos];
    for (const file of Array.from(files)) {
      if (next.length >= 6) break;
      const path = generateUploadPath(userId, file.name);
      const { error: up } = await supabase.storage.from('spot-photos').upload(path, file, { upsert: true });
      if (!up) next.push(path);
    }
    setPhotos(next);
  }

  function toTimeSql(hhmm: string) {
    const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  }

  async function persistAvailability(id: string) {
    await supabase.from('availability').delete().eq('spot_id', id);
    const days = availableAllDay ? [0, 1, 2, 3, 4, 5, 6] : activeDays;
    const start = availableAllDay ? '00:00:00' : toTimeSql(startTime);
    const end = availableAllDay ? '23:59:59' : toTimeSql(endTime);
    const rows = days.map((day_of_week) => ({
      spot_id: id,
      day_of_week,
      start_time: start,
      end_time: end,
      is_recurring: true,
      specific_date: null as string | null,
    }));
    const { error: ae } = await supabase.from('availability').insert(rows);
    if (ae) throw ae;
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
      if (mode === 'create') {
        const { data: newId, error: ce } = await supabase.rpc('create_spot', {
          p_title: title.trim(),
          p_description: description.trim(),
          p_spot_type: spotType,
          p_coverage: coverage,
          p_vehicle_size: vehicleSize,
          p_total_slots: totalSlots,
          p_longitude: lng,
          p_latitude: lat,
          p_address_line: addressLine.trim(),
          p_landmark: landmark.trim(),
          p_pincode: pincode.trim(),
          p_fuzzy_landmark: fuzzyLandmark.trim(),
          p_fuzzy_radius_meters: 500,
          p_price_per_hour: Number.isFinite(ph) ? ph : null,
          p_price_per_day: Number.isFinite(pd) ? pd : null,
          p_price_per_month: Number.isFinite(pm) ? pm : null,
          p_is_instant_book: instantBook,
          p_amenities: amenities,
          p_photos: photos,
          p_video_url: videoUrl.trim(),
        });
        if (ce) throw ce;
        const id = newId as string;
        await persistAvailability(id);
        router.push('/dashboard');
        router.refresh();
      } else if (spotId) {
        const { error: ue } = await supabase.rpc('update_spot', {
          p_spot_id: spotId,
          p_title: title.trim(),
          p_description: description.trim(),
          p_spot_type: spotType,
          p_coverage: coverage,
          p_vehicle_size: vehicleSize,
          p_total_slots: totalSlots,
          p_longitude: lng,
          p_latitude: lat,
          p_address_line: addressLine.trim(),
          p_landmark: landmark.trim(),
          p_pincode: pincode.trim(),
          p_fuzzy_landmark: fuzzyLandmark.trim(),
          p_fuzzy_radius_meters: 500,
          p_price_per_hour: Number.isFinite(ph) ? ph : null,
          p_price_per_day: Number.isFinite(pd) ? pd : null,
          p_price_per_month: Number.isFinite(pm) ? pm : null,
          p_is_instant_book: instantBook,
          p_is_active: true,
          p_amenities: amenities,
          p_photos: photos,
          p_video_url: videoUrl.trim(),
        });
        if (ue) throw ue;
        await persistAvailability(spotId);
        router.push('/dashboard');
        router.refresh();
      }
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

      {step === 1 ? (
        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-sm text-slate-400">Set coordinates (decimal degrees). Default: Chennai.</p>
          <label className="block text-xs text-slate-500">
            Latitude
            <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
          </label>
          <label className="block text-xs text-slate-500">
            Longitude
            <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
          </label>
          <label className="block text-xs text-slate-500">
            Address line
            <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
          </label>
          <label className="block text-xs text-slate-500">
            Landmark (optional)
            <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
          </label>
          <label className="block text-xs text-slate-500">
            Pincode
            <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={pincode} onChange={(e) => setPincode(e.target.value)} />
          </label>
          <label className="block text-xs text-slate-500">
            Fuzzy landmark (public)
            <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={fuzzyLandmark} onChange={(e) => setFuzzyLandmark(e.target.value)} />
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
