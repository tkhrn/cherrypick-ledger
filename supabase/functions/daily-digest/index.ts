import { isCronCall } from '../_shared/cron.ts';
import { json } from '../_shared/http.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';

const DEFAULT_EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const KST_OFFSET_HOURS = 9;

function currentKstHour(): string {
  const hour = (new Date().getUTCHours() + KST_OFFSET_HOURS) % 24;
  return `${String(hour).padStart(2, '0')}:00:00`;
}

Deno.serve(async (req) => {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const admin = createAdminClient();
  if (!(await isCronCall(admin, token))) return json({ error: 'unauthorized' }, 401);

  const { data: due } = await admin
    .from('user_settings')
    .select('user_id, expo_push_token')
    .eq('digest_time', currentKstHour())
    .not('expo_push_token', 'is', null);

  const messages = [];
  for (const user of due ?? []) {
    const { count } = await admin
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.user_id)
      .eq('status', 'pending');
    if (!count) continue;
    messages.push({ to: user.expo_push_token, title: 'Cherrypick', body: `정리할 소비 ${count}건이 있어요`, data: { url: '/' } });
  }

  if (messages.length > 0) {
    const res = await fetch(Deno.env.get('EXPO_PUSH_URL') ?? DEFAULT_EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(messages),
    }).catch((error) => {
      console.error('expo push failed', error instanceof Error ? error.message : error);
      return null;
    });
    if (res && !res.ok) console.error('expo push rejected', res.status);
    await res?.body?.cancel();
  }
  return json({ sent: messages.length });
});
