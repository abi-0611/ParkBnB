import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

type Body = {
  booking_id: string;
  amount_paise: number;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const keyId = Deno.env.get('RAZORPAY_KEY_ID');
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  if (!keyId || !keySecret) {
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

  if (!body.booking_id || typeof body.amount_paise !== 'number' || body.amount_paise < 100) {
    return jsonResponse({ error: 'Invalid booking_id or amount_paise' }, 400);
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
    .select('id, seeker_id, total_price, status, payment_status, razorpay_order_id')
    .eq('id', body.booking_id)
    .single();

  if (bErr || !booking) {
    return jsonResponse({ error: 'Booking not found' }, 404);
  }

  if (booking.seeker_id !== user.id) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  if (booking.status !== 'pending' || booking.payment_status !== 'pending') {
    return jsonResponse({ error: 'Booking not payable' }, 400);
  }

  const expectedPaise = Math.round(Number(booking.total_price) * 100);
  if (body.amount_paise !== expectedPaise) {
    return jsonResponse({ error: 'Amount mismatch', expected_paise: expectedPaise }, 400);
  }

  const basic = btoa(`${keyId}:${keySecret}`);
  const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: body.amount_paise,
      currency: 'INR',
      receipt: body.booking_id.replace(/-/g, '').slice(0, 40),
      notes: { booking_id: body.booking_id },
    }),
  });

  const orderJson = (await orderRes.json()) as { id?: string; error?: { description?: string } };
  if (!orderRes.ok || !orderJson.id) {
    return jsonResponse(
      { error: orderJson.error?.description ?? 'Razorpay order failed', details: orderJson },
      502
    );
  }

  const { error: upErr } = await admin
    .from('bookings')
    .update({ razorpay_order_id: orderJson.id })
    .eq('id', body.booking_id);

  if (upErr) {
    return jsonResponse({ error: upErr.message }, 500);
  }

  return jsonResponse({
    order_id: orderJson.id,
    amount: body.amount_paise,
    currency: 'INR',
    key_id: keyId,
  });
});
