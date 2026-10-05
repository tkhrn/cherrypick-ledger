begin;
create extension if not exists pgtap with schema extensions;
select plan(1);

insert into auth.users (id, email, aud, role)
values ('11111111-1111-1111-1111-111111111111', 'a@test.dev', 'authenticated', 'authenticated');
select public.start_organize_run('11111111-1111-1111-1111-111111111111', 'manual');
select public.finish_organize_run(
  (select id from public.organize_runs where user_id = '11111111-1111-1111-1111-111111111111'),
  'succeeded', 1, 0, 0, 0, 0, null, 'Error: Gemini request failed: 400');

select is((select ai_error from public.organize_runs where user_id = '11111111-1111-1111-1111-111111111111'),
  'Error: Gemini request failed: 400', 'the AI failure reason is kept on the run');

select * from finish();
rollback;
