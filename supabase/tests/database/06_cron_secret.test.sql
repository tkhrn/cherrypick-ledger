begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

select ok((select count(*) = 1 from vault.secrets where name = 'cron_secret'), 'a cron secret is generated in Vault');
select ok(public.is_cron_secret((select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')), 'the stored secret is accepted');
select ok(not public.is_cron_secret('wrong'), 'other tokens are rejected');

select * from finish();
rollback;
