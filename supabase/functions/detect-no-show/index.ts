import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const cronSecret = Deno.env.get('CRON_SECRET');

  if (!serviceKey) {
    return jsonResponse({ error: 'Server misconfigured' }, 500);
  }

  const auth = req.headers.get('Authorization');
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data, error } = await admin.rpc('run_no_show_detection');

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ processed: data ?? 0 });
});
