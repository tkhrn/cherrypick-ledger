import { assertEquals } from 'jsr:@std/assert@1';
import { admin, createTestUser, ingest, registerDevice } from './_env.ts';

const item = (dedupeKey: string) => ({
  sourcePackage: 'com.card', title: 'KB국민카드', body: '승인 7,800원', postedAt: '2026-10-05T10:45:00Z', dedupeKey,
});

Deno.test('ingest stores notifications for the device owner', async () => {
  const { userId, client } = await createTestUser();
  const key = await registerDevice(client);

  const res = await ingest(key, [item('a'), item('b')]);
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { accepted: 2, duplicates: 0 });

  const { count } = await admin.from('raw_notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  assertEquals(count, 2);
});

Deno.test('ingest ignores a re-posted notification with the same dedupe key', async () => {
  const { client } = await createTestUser();
  const key = await registerDevice(client);
  await (await ingest(key, [item('same')])).body?.cancel();

  const res = await ingest(key, [item('same')]);
  assertEquals(await res.json(), { accepted: 0, duplicates: 1 });
});

Deno.test('ingest rejects an unknown device key', async () => {
  const res = await ingest('f'.repeat(64), [item('x')]);
  assertEquals(res.status, 401);
  await res.body?.cancel();
});

Deno.test('ingest rejects malformed payloads', async () => {
  const { client } = await createTestUser();
  const key = await registerDevice(client);
  const res = await ingest(key, [{ sourcePackage: 'x' }]);
  assertEquals(res.status, 400);
  await res.body?.cancel();
});
