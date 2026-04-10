'use client';

import { amountToPaise, createBookingRpc, getSpotSeekerDetail, type SpotSeekerDetail } from '@parknear/shared';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

export default function WebBookingPage() {
  const params = useParams();
  const spotId = params.spotId as string;
  const router = useRouter();
  const [spot, setSpot] = useState<SpotSeekerDetail | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<{ id: string; number_plate: string }[]>([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rzpReady, setRzpReady] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: s } = await getSpotSeekerDetail(supabase, spotId);
    setSpot(s);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: vs } = await supabase.from('vehicles').select('id, number_plate').eq('user_id', user.id);
    setVehicles(vs ?? []);
    if (vs?.[0]) setVehicleId(vs[0].id);
  }, [spotId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const sc = document.createElement('script');
    sc.src = 'https://checkout.razorpay.com/v1/checkout.js';
    sc.async = true;
    sc.onload = () => setRzpReady(true);
    document.body.appendChild(sc);
    return () => {
      sc.remove();
    };
  }, []);

  const onPay = async () => {
    if (!spot || !vehicleId || !start || !end) {
      setErr('Fill vehicle and ISO start/end times');
      return;
    }
    setBusy(true);
    setErr(null);
    const supabase = createClient();
    const { data: bid, error: cErr } = await createBookingRpc(supabase, {
      spot_id: spotId,
      vehicle_id: vehicleId,
      booking_type: 'hourly',
      start_time: start,
      end_time: end,
    });
    if (cErr || !bid) {
      setErr(cErr?.message ?? 'Create failed');
      setBusy(false);
      return;
    }
    const { data: booking } = await supabase.from('bookings').select('total_price').eq('id', bid).single();
    const total = Number(booking?.total_price ?? 0);
    const paise = amountToPaise(total);

    const { data: order, error: oErr } = await supabase.functions.invoke<{ order_id: string; key_id: string }>(
      'create-razorpay-order',
      { body: { booking_id: bid, amount_paise: paise } }
    );
    if (oErr || !order?.order_id) {
      setErr(oErr?.message ?? 'Order failed');
      setBusy(false);
      return;
    }

    if (!rzpReady || !window.Razorpay) {
      setErr('Razorpay script loading… retry');
      setBusy(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: order.key_id,
      amount: paise,
      currency: 'INR',
      order_id: order.order_id,
      name: 'ParkNear',
      description: 'Parking',
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        const { error: vErr } = await supabase.functions.invoke('verify-payment', {
          body: {
            booking_id: bid,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          },
        });
        if (vErr) {
          setErr(vErr.message);
          setBusy(false);
          return;
        }
        router.push(`/booking/confirmation/${bid}`);
      },
    });
    rzp.open();
    setBusy(false);
  };

  if (!spot) {
    return (
      <div className="p-8 text-slate-200">
        <p>Loading…</p>
        <Link href="/search" className="mt-4 inline-block text-sky-400">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 text-slate-100">
      <Link href={`/spot/${spotId}`} className="text-sm text-sky-400">
        ← Spot
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Book · {spot.title}</h1>
      <p className="mt-2 text-slate-400">Hourly flow (web). Use ISO times (UTC).</p>

      <label className="mt-6 block text-sm text-slate-400">
        Start (ISO)
        <input
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          placeholder="2026-04-10T10:00:00.000Z"
        />
      </label>
      <label className="mt-4 block text-sm text-slate-400">
        End (ISO)
        <input
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          placeholder="2026-04-10T12:00:00.000Z"
        />
      </label>

      <label className="mt-4 block text-sm text-slate-400">
        Vehicle
        <select
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
          value={vehicleId ?? ''}
          onChange={(e) => setVehicleId(e.target.value)}
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.number_plate}
            </option>
          ))}
        </select>
      </label>

      {err ? <p className="mt-4 text-sm text-red-400">{err}</p> : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void onPay()}
        className="mt-8 w-full rounded-xl bg-sky-500 py-3 font-semibold text-slate-950 disabled:opacity-50"
      >
        {busy ? 'Working…' : 'Create & pay'}
      </button>
    </div>
  );
}
