begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

insert into auth.users (id, email, aud, role)
values ('11111111-1111-1111-1111-111111111111', 'a@test.dev', 'authenticated', 'authenticated');
insert into public.raw_notifications (id, user_id, source_package, body, posted_at, dedupe_key)
values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'sms', 'x', now(), 'k1');

select lives_ok($$select public.increment_raw_attempts(array['aaaaaaaa-0000-0000-0000-000000000001'::uuid])$$, 'increment attempts');
select is((select attempts from public.raw_notifications where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 1, 'attempts incremented');

select * from finish();
rollback;
