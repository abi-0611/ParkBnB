import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

type Payload = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  preferenceKey?: string;
};

type UserPrefs = Record<string, boolean | undefined>;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!serviceKey || !anonKey) {
    return jsonResponse({ error: 'Server misconfigured' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Validate caller token first (any authenticated user/service caller).
  const authed = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user: caller },
  } = await authed.auth.getUser();
  if (!caller) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const payload = (await req.json()) as Payload;
  if (!payload?.userId || !payload?.title || !payload?.body) {
    return jsonResponse({ error: 'userId/title/body required' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: target, error } = await admin
    .from('users')
    .select('push_token, notification_preferences')
    .eq('id', payload.userId)
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }
  if (!target?.push_token) {
    return jsonResponse({ ok: true, skipped: 'no_push_token' });
  }

  const prefs = (target.notification_preferences ?? {}) as UserPrefs;
  if (payload.preferenceKey && prefs[payload.preferenceKey] === false) {
    return jsonResponse({ ok: true, skipped: 'preference_disabled' });
  }

  const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: target.push_token,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: 'default',
    }),
  });

  const expoJson = await expoRes.json().catch(() => ({}));

  // If Expo says token is invalid, clear it to avoid repeated failures.
  const details = (expoJson as { data?: { details?: { error?: string } } }).data?.details;
  if (details?.error === 'DeviceNotRegistered') {
    await admin.from('users').update({ push_token: null }).eq('id', payload.userId);
  }

  return jsonResponse({ ok: expoRes.ok, expo: expoJson }, expoRes.ok ? 200 : 502);
});

