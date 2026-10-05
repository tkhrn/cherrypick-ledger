create or replace function public.increment_raw_attempts(p_ids uuid[])
returns void language sql security definer set search_path = '' as $$
  update public.raw_notifications set attempts = attempts + 1 where id = any(p_ids);
$$;
revoke execute on function public.increment_raw_attempts(uuid[]) from public, anon, authenticated;
grant execute on function public.increment_raw_attempts(uuid[]) to service_role;

-- 예약 실행. Vault에 project_url, cron_secret 두 값이 있어야 동작한다 (README 참고).
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.call_edge_function(p_name text)
returns bigint language sql security definer set search_path = '' as $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/' || p_name,
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000);
$$;
revoke execute on function public.call_edge_function(text) from public, anon, authenticated;

-- DB 시간은 UTC. 3시간 간격 정각은 KST(UTC+9)에서도 0,3,…,21시와 일치한다.
select cron.schedule('organize-every-3h', '0 */3 * * *', $$select public.call_edge_function('organize')$$);
select cron.schedule('daily-digest-hourly', '0 * * * *', $$select public.call_edge_function('daily-digest')$$);
