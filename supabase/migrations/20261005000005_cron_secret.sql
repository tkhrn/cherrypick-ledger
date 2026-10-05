-- cron이 Edge Function을 부를 때 쓰는 비밀값을 DB가 직접 만들어 Vault에 둔다 (사람이 만들거나 옮길 필요 없음).
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'cron_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'cron_secret');
  end if;
end $$;

create or replace function public.is_cron_secret(p_token text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'cron_secret' and decrypted_secret = p_token);
$$;
revoke execute on function public.is_cron_secret(text) from public, anon, authenticated;
grant execute on function public.is_cron_secret(text) to service_role;
