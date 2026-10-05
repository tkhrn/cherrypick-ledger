begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email, aud, role)
values ('11111111-1111-1111-1111-111111111111', 'a@test.dev', 'authenticated', 'authenticated'),
       ('22222222-2222-2222-2222-222222222222', 'b@test.dev', 'authenticated', 'authenticated');

select is((select count(*)::int from public.categories where user_id = '11111111-1111-1111-1111-111111111111'), 9, 'signup seeds 9 default categories');
select is((select count(*)::int from public.user_settings where user_id = '11111111-1111-1111-1111-111111111111'), 1, 'signup creates user settings');
select is((select digest_time from public.user_settings where user_id = '11111111-1111-1111-1111-111111111111'), '21:00'::time, 'digest defaults to 21:00');

insert into public.transactions (user_id, kind, amount, occurred_at, status)
values ('11111111-1111-1111-1111-111111111111', 'payment', 5600, now(), 'pending');

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is((select count(*)::int from public.transactions), 0, 'another user cannot read my transactions');
select is((select count(*)::int from public.categories), 9, 'a user reads only their own categories');
select throws_ok(
  $$insert into public.groups (user_id, name) values ('11111111-1111-1111-1111-111111111111', '남의 모임')$$,
  '42501', null, 'cannot insert rows for another user');
select throws_ok(
  $$insert into public.raw_notifications (source_package, title, body, posted_at, dedupe_key) values ('sms', '', 'x', now(), 'k')$$,
  '42501', null, 'users cannot write raw notifications directly');

set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is((select count(*)::int from public.transactions), 1, 'owner reads their transaction');
insert into public.groups (name) values ('풋살');
select is((select user_id from public.groups where name = '풋살'), '11111111-1111-1111-1111-111111111111'::uuid, 'user_id defaults to the caller');

select * from finish();
rollback;
