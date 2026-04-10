import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

type Body = {
  booking_id: string;
  reason?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  if (!body.booking_id) {
    return jsonResponse({ error: 'booking_id required' }, 400);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: booking, error: bErr } = await admin
    .from('bookings')
    .select('id, seeker_id, status, start_time, total_price, payment_status')
    .eq('id', body.booking_id)
    .single();

  if (bErr || !booking) {
    return jsonResponse({ error: 'Booking not found' }, 404);
  }

  if (booking.seeker_id !== user.id) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    return jsonResponse({ error: 'Cannot cancel this booking' }, 400);
  }

  const start = new Date(booking.start_time).getTime();
  const now = Date.now();
  const minutesBefore = (start - now) / 60000;

  let refund = 0;
  if (booking.status === 'pending') {
    refund = 0;
  } else if (minutesBefore >= 30) {
    refund = Number(booking.total_price);
  } else if (minutesBefore > 0) {
    refund = Math.round(Number(booking.total_price) * 0.5 * 100) / 100;
  } else {
    refund = 0;
  }

  const { error: upErr } = await admin
    .from('bookings')
    .update({
      status: 'cancelled_by_seeker',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: body.reason ?? null,
      refund_amount: refund,
      payment_status: booking.payment_status === 'paid' ? 'refunded' : booking.payment_status,
    })
    .eq('id', body.booking_id);

  if (upErr) {
    return jsonResponse({ error: upErr.message }, 500);
  }

  if (refund > 0 && booking.payment_status === 'paid') {
    await admin.from('transactions').insert({
      booking_id: body.booking_id,
      user_id: user.id,
      type: 'refund',
      amount: refund,
      status: 'completed',
      razorpay_ref: 'test_mode',
    });
  }

  return jsonResponse({ success: true, refund_amount: refund });
});
