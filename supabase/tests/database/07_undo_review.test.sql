begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

insert into auth.users (id, email, aud, role)
values ('11111111-1111-1111-1111-111111111111', 'a@test.dev', 'authenticated', 'authenticated');
insert into public.transactions (id, user_id, kind, amount, merchant, occurred_at, status, needs_review, review_reason) values
  ('bbbbbbbb-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'payment', 5600, null, now(), 'pending', true, 'missing_merchant');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select public.decide_transaction('bbbbbbbb-0000-0000-0000-000000000009', 'ignored', null, null, null, null);
select public.decide_transaction('bbbbbbbb-0000-0000-0000-000000000009', 'pending', null, null, null, null);
select is((select needs_review from public.transactions where id = 'bbbbbbbb-0000-0000-0000-000000000009'), true,
  'undoing a decision keeps the needs-review flag');
select is((select review_reason from public.transactions where id = 'bbbbbbbb-0000-0000-0000-000000000009'), 'missing_merchant',
  'undoing a decision keeps the review reason');

select * from finish();
