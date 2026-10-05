import { assertEquals } from 'jsr:@std/assert@1';
import { admin, callFunction, createTestUser, CRON_SECRET, ingest, registerDevice } from './_env.ts';

const payment = (sourcePackage: string, body: string, dedupeKey: string, postedAt = '2026-10-05T10:42:00Z') =>
  ({ sourcePackage, title: '', body, postedAt, dedupeKey });

async function seedOnePayment() {
  const user = await createTestUser();
  const key = await registerDevice(user.client);
  const res = await ingest(key, [
    payment('com.card', '고기굽는집에서 20,000원 결제', `${user.userId}-1`),
    payment('sms', '[Web발신]\n신한카드(1234)승인\n홍*동\n20,000원\n10/05 19:42\n고기굽는집', `${user.userId}-2`, '2026-10-05T10:42:20Z'),
    payment('viva.republica.toss', '고기굽는집에서 20,000원 결제했어요', `${user.userId}-3`, '2026-10-05T10:43:00Z'),
  ]);
  await res.body?.cancel();
  return user;
}

Deno.test('organize groups the user notifications into one transaction', async () => {
  const user = await seedOnePayment();

  const res = await callFunction('organize', user.accessToken);
  assertEquals(await res.json(), { status: 'succeeded', processed: 3 });

  const { data: txs } = await user.client.from('transactions').select('kind, amount, merchant, status');
  assertEquals(txs, [{ kind: 'payment', amount: 20000, merchant: '고기굽는집', status: 'pending' }]);
  const { count } = await admin.from('raw_notifications').select('*', { count: 'exact', head: true })
    .eq('user_id', user.userId).is('processed_at', null);
  assertEquals(count, 0);
  const { data: runs } = await user.client.from('organize_runs').select('status, trigger, processed_count');
  assertEquals(runs, [{ status: 'succeeded', trigger: 'manual', processed_count: 3 }]);
});

Deno.test('organize reports already_running while a run holds the lock', async () => {
  const user = await seedOnePayment();
  await admin.from('organize_runs').insert({ user_id: user.userId, trigger: 'cron', status: 'running' });

  const res = await callFunction('organize', user.accessToken);
  assertEquals(await res.json(), { status: 'already_running', processed: 0 });
});

Deno.test('organize in cron mode processes every user with pending notifications', async () => {
  const user = await seedOnePayment();

  const res = await callFunction('organize', CRON_SECRET);
  assertEquals(res.status, 200);
  await res.body?.cancel();

  const { count } = await user.client.from('transactions').select('*', { count: 'exact', head: true });
  assertEquals(count, 1);
});

Deno.test('organize rejects an invalid token', async () => {
  const res = await callFunction('organize', 'not-a-token');
  assertEquals(res.status, 401);
  await res.body?.cancel();
});
