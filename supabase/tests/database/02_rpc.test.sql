begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id, email, aud, role)
values ('11111111-1111-1111-1111-111111111111', 'a@test.dev', 'authenticated', 'authenticated');

-- 결제 건 2개와 해석 결과 3개 준비 (postgres 권한)
insert into public.raw_notifications (id, user_id, source_package, title, body, posted_at, dedupe_key) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'com.card', '', 'x', now(), 'k1'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'sms', '', 'y', now(), 'k2'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'com.toss', '', 'z', now(), 'k3');
insert into public.transactions (id, user_id, kind, amount, merchant, occurred_at, status) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'payment', 5600, '스타벅스', '2026-10-05 12:00+09', 'pending'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'payment', 5600, null, '2026-10-05 12:05+09', 'pending');
insert into public.parsed_events (id, user_id, raw_id, source_package, kind, amount, merchant, occurred_at, parser, transaction_id) values
  ('cccccccc-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'com.card', 'payment', 5600, null, '2026-10-05 12:00+09', 'rule:generic', 'bbbbbbbb-0000-0000-0000-000000000001'),
  ('cccccccc-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000002', 'sms', 'payment', 5600, '스타벅스', '2026-10-05 12:01+09', 'rule:card-sms', 'bbbbbbbb-0000-0000-0000-000000000001'),
  ('cccccccc-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000003', 'com.toss', 'payment', 5600, '스타벅스강남', '2026-10-05 12:05+09', 'rule:generic', 'bbbbbbbb-0000-0000-0000-000000000002');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- register_device
select matches(public.register_device('내 폰'), '^[0-9a-f]{64}$', 'register_device returns a 64-char hex key');
select is((select count(*)::int from public.devices where key_hash ~ '^[0-9a-f]{64}$'), 1, 'only the key hash is stored');

-- decide_transaction
select throws_ok(
  $$select public.decide_transaction('bbbbbbbb-0000-0000-0000-000000000001', 'group', null, null, null, null)$$,
  'P0001', 'group_id is required for group status', 'group status requires a group');
select lives_ok(
  $$select public.decide_transaction('bbbbbbbb-0000-0000-0000-000000000001', 'mine',
      (select id from public.categories where name = '카페·간식'), null, '아아', '스타벅스')$$,
  'decide mine');
select is((select status from public.transactions where id = 'bbbbbbbb-0000-0000-0000-000000000001'), 'mine', 'status updated');
select isnt((select decided_at from public.transactions where id = 'bbbbbbbb-0000-0000-0000-000000000001'), null, 'decided_at set');
select is((select c.name from public.merchant_memory m join public.categories c on c.id = m.category_id where m.merchant_key = '스타벅스'),
  '카페·간식', 'deciding mine remembers the merchant category');
select lives_ok($$select public.decide_transaction('bbbbbbbb-0000-0000-0000-000000000001', 'pending', null, null, null, null)$$, 'undo to pending');
select is((select decided_at from public.transactions where id = 'bbbbbbbb-0000-0000-0000-000000000001'), null, 'undo clears decided_at');

-- split_transaction
select isnt(public.split_transaction('bbbbbbbb-0000-0000-0000-000000000001', array['cccccccc-0000-0000-0000-000000000002'::uuid]), null, 'split returns a new id');
select is((select count(*)::int from public.transactions), 3, 'split creates a transaction');
select is((select t.merchant from public.parsed_events e join public.transactions t on t.id = e.transaction_id where e.id = 'cccccccc-0000-0000-0000-000000000002'),
  '스타벅스', 'the new transaction takes the moved event merchant');

-- merge_transactions
select lives_ok($$select public.merge_transactions('bbbbbbbb-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001')$$, 'merge');
select is((select count(*)::int from public.transactions where id = 'bbbbbbbb-0000-0000-0000-000000000001'), 0, 'merged source is deleted');
select is((select count(*)::int from public.parsed_events where transaction_id = 'bbbbbbbb-0000-0000-0000-000000000002'), 2, 'events moved to the target');

reset role;

-- organize run lock (service role 전용)
select isnt(public.start_organize_run('11111111-1111-1111-1111-111111111111', 'cron'), null, 'first run starts');
select is(public.start_organize_run('11111111-1111-1111-1111-111111111111', 'manual'), null, 'second run is locked out');

select * from finish();
rollback;
