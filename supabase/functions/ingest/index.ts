import { json, sha256Hex } from '../_shared/http.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';

const MAX_ITEMS = 100;

interface IngestItem {
  sourcePackage: string;
  title?: string;
  body: string;
  postedAt: string;
  dedupeKey: string;
}

function isIngestItem(v: unknown): v is IngestItem {
  if (typeof v !== 'object' || v === null) return false;
  const i = v as Record<string, unknown>;
  return typeof i.sourcePackage === 'string' && typeof i.body === 'string' && typeof i.dedupeKey === 'string'
    && typeof i.postedAt === 'string' && !Number.isNaN(Date.parse(i.postedAt))
    && (i.title === undefined || typeof i.title === 'string');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const deviceKey = req.headers.get('x-device-key');
  if (!deviceKey) return json({ error: 'unauthorized' }, 401);

  const payload = await req.json().catch(() => null) as { items?: unknown } | null;
  const items = Array.isArray(payload?.items) ? payload.items : null;
  if (!items || items.length === 0 || items.length > MAX_ITEMS || !items.every(isIngestItem)) {
    return json({ error: 'invalid_payload' }, 400);
  }

  const admin = createAdminClient();
  const { data: device } = await admin
    .from('devices')
    .select('id, user_id')
    .eq('key_hash', await sha256Hex(deviceKey))
    .is('revoked_at', null)
    .maybeSingle();
  if (!device) return json({ error: 'unauthorized' }, 401);

  const rows = items.map((i) => ({
    user_id: device.user_id,
    source_package: i.sourcePackage,
    title: i.title ?? '',
    body: i.body,
    posted_at: i.postedAt,
    dedupe_key: i.dedupeKey,
  }));
  const { data: inserted, error } = await admin
    .from('raw_notifications')
    .upsert(rows, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true })
    .select('id');
  if (error) {
    console.error('ingest insert failed', error.code);
    return json({ error: 'insert_failed' }, 500);
  }
  await admin.from('devices').update({ last_seen_at: new Date().toISOString() }).eq('id', device.id);

  const accepted = inserted?.length ?? 0;
  return json({ accepted, duplicates: items.length - accepted });
});
