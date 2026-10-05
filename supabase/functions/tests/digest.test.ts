import { assertEquals } from 'jsr:@std/assert@1';
import { admin, callFunction, createTestUser, CRON_SECRET } from './_env.ts';

const MOCK_PORT = 54999;

function currentKstHour(): string {
  const hour = (new Date().getUTCHours() + 9) % 24;
  return `${String(hour).padStart(2, '0')}:00:00`;
}

Deno.test('daily-digest pushes to users at their digest time with pending items', async () => {
  const received: { to: string; body: string }[] = [];
  const server = Deno.serve({ port: MOCK_PORT, hostname: '0.0.0.0', onListen: () => {} }, async (req) => {
    received.push(...(await req.json()));
    return new Response(JSON.stringify({ data: [] }));
  });

  const run = crypto.randomUUID().slice(0, 8);
  const token = (name: string) => `ExponentPushToken[${name}-${run}]`;
  try {
    const due = await createTestUser();
    const notDue = await createTestUser();
    const nothingPending = await createTestUser();
    const otherHour = currentKstHour() === '05:00:00' ? '06:00' : '05:00';
    await admin.from('user_settings').update({ digest_time: currentKstHour(), expo_push_token: token('due') }).eq('user_id', due.userId);
    await admin.from('user_settings').update({ digest_time: otherHour, expo_push_token: token('later') }).eq('user_id', notDue.userId);
    await admin.from('user_settings').update({ digest_time: currentKstHour(), expo_push_token: token('empty') }).eq('user_id', nothingPending.userId);
    for (const user of [due, notDue]) {
      await admin.from('transactions').insert([
        { user_id: user.userId, kind: 'payment', amount: 1000, occurred_at: new Date().toISOString(), status: 'pending' },
        { user_id: user.userId, kind: 'payment', amount: 2000, occurred_at: new Date().toISOString(), status: 'pending' },
      ]);
    }

    const res = await callFunction('daily-digest', CRON_SECRET);
    assertEquals(res.status, 200);
    await res.body?.cancel();

    const mine = received.filter((m) => m.to.endsWith(`-${run}]`));
    assertEquals(mine.map((m) => m.to), [token('due')]);
    assertEquals(mine.find((m) => m.to === token('due'))?.body, '정리할 소비 2건이 있어요');
  } finally {
    await server.shutdown();
  }
});

Deno.test('daily-digest rejects callers without the cron secret', async () => {
  const res = await callFunction('daily-digest', 'nope');
  assertEquals(res.status, 401);
  await res.body?.cancel();
});
