begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email, aud, role)
values ('11111111-1111-1111-1111-111111111111', 'a@test.dev', 'authenticated', 'authenticated');

insert into public.organize_runs (user_id, trigger, status, started_at)
values ('11111111-1111-1111-1111-111111111111', 'cron', 'running', now() - interval '11 minutes');

select isnt(public.start_organize_run('11111111-1111-1111-1111-111111111111', 'manual'), null, 'a stale running run does not block');
select is((select count(*)::int from public.organize_runs where status = 'failed' and error = 'stale' and user_id = '11111111-1111-1111-1111-111111111111'), 1, 'the stale run is marked failed');

select lives_ok($$select public.finish_organize_run(
  (select id from public.organize_runs where status = 'running' and user_id = '11111111-1111-1111-1111-111111111111'), 'succeeded', 3, 0, 1, 100, 20, null)$$, 'finish run');
select is(public.ai_calls_this_month('11111111-1111-1111-1111-111111111111'), 1, 'ai calls are summed for the month');

select * from finish();
rollback;
