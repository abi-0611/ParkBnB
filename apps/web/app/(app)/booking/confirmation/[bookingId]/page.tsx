import Link from 'next/link';

import { createServerSupabaseClient } from '@/lib/supabase/server';

type Props = { params: { bookingId: string } };

export default async function BookingConfirmationWebPage({ params }: Props) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="p-8 text-slate-200">
        <Link href="/login" className="text-sky-400">
          Log in
        </Link>
      </div>
    );
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select(
      `
      id,
      status,
      gate_otp,
      spots ( title, address_line ),
      spot_id
    `
    )
    .eq('id', params.bookingId)
    .eq('seeker_id', user.id)
    .single();

  if (!booking) {
    return <p className="p-8 text-slate-300">Booking not found.</p>;
  }

  const b = booking as unknown as {
    gate_otp: string | null;
    spots: { title: string; address_line: string } | null;
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 text-slate-100">
      <p className="text-sm font-semibold text-emerald-400">Confirmed</p>
      <h1 className="mt-2 text-2xl font-bold">{b.spots?.title}</h1>
      <p className="mt-6 text-slate-300">{b.spots?.address_line}</p>
      <p className="mt-4 text-lg font-mono tracking-widest text-sky-400">Code: {b.gate_otp}</p>
      <Link href="/bookings" className="mt-8 inline-block text-sky-400">
        My bookings
      </Link>
    </div>
  );
}
