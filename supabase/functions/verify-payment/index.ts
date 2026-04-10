import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

type Body = {
  booking_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  if (!keySecret) {
    return jsonResponse({ error: 'Razorpay not configured' }, 500);
  }

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

  if (!body.booking_id || !body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
    return jsonResponse({ error: 'Missing fields' }, 400);
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

  const expected = createHmac('sha256', keySecret)
    .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
    .digest('hex');

  const admin = createClient(supabaseUrl, serviceKey);

  if (expected !== body.razorpay_signature) {
    await admin
      .from('bookings')
      .update({ payment_status: 'failed' })
      .eq('id', body.booking_id)
      .eq('seeker_id', user.id);

    return jsonResponse({ error: 'Invalid signature' }, 400);
  }

  const { data: booking, error: bErr } = await admin
    .from('bookings')
    .select('id, seeker_id, status, razorpay_order_id')
    .eq('id', body.booking_id)
    .single();

  if (bErr || !booking) {
    return jsonResponse({ error: 'Booking not found' }, 404);
  }

  if (booking.seeker_id !== user.id) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  if (booking.razorpay_order_id && booking.razorpay_order_id !== body.razorpay_order_id) {
    return jsonResponse({ error: 'Order mismatch' }, 400);
  }

  const otp = generateOtp();
  const expires = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

  const { error: upErr } = await admin
    .from('bookings')
    .update({
      status: 'confirmed',
      payment_status: 'paid',
      razorpay_payment_id: body.razorpay_payment_id,
      payment_id: body.razorpay_payment_id,
      gate_otp: otp,
      gate_otp_expires_at: expires,
    })
    .eq('id', body.booking_id);

  if (upErr) {
    return jsonResponse({ error: upErr.message }, 500);
  }

  const { data: bRow } = await admin.from('bookings').select('*').eq('id', body.booking_id).single();

  const [{ data: spot }, { data: vehicle }] = await Promise.all([
    admin.from('spots').select('*').eq('id', bRow!.spot_id).single(),
    bRow!.vehicle_id
      ? admin.from('vehicles').select('*').eq('id', bRow!.vehicle_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return jsonResponse({
    success: true,
    booking: { ...bRow, spot, vehicle },
  });
});
