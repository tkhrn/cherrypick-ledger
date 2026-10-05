-- 가입 시 기본값
create or replace function public.seed_defaults(p_user uuid)
returns void language sql security definer set search_path = '' as $$
  insert into public.user_settings (user_id) values (p_user) on conflict do nothing;
  insert into public.categories (user_id, name, icon, color_token, sort_order) values
    (p_user, '식비', 'tools-kitchen-2', 'cat-coral', 1),
    (p_user, '카페·간식', 'coffee', 'cat-amber', 2),
    (p_user, '교통', 'bus', 'cat-teal', 3),
    (p_user, '쇼핑', 'shopping-bag', 'cat-pink', 4),
    (p_user, '주거·고정비', 'home', 'cat-purple', 5),
    (p_user, '의료·건강', 'heartbeat', 'cat-red', 6),
    (p_user, '여가·문화', 'movie', 'cat-blue', 7),
    (p_user, '경조사·선물', 'gift', 'cat-green', 8),
    (p_user, '기타', 'dots', 'cat-gray', 9);
$$;
revoke execute on function public.seed_defaults(uuid) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.seed_defaults(new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- 기기 업로드 키 발급 (평문은 한 번만 반환)
create or replace function public.register_device(p_label text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_key text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  v_key := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.devices (user_id, key_hash, label)
  values (auth.uid(), encode(extensions.digest(v_key, 'sha256'), 'hex'), p_label);
  return v_key;
end $$;
revoke execute on function public.register_device(text) from public, anon;
grant execute on function public.register_device(text) to authenticated;

-- 사용자 결정
create or replace function public.decide_transaction(
  p_id uuid, p_status text, p_category_id uuid, p_group_id uuid, p_memo text, p_merchant_key text
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_status not in ('pending','mine','group','ignored') then raise exception 'invalid status %', p_status; end if;
  if p_status = 'group' and p_group_id is null then raise exception 'group_id is required for group status'; end if;

  update public.transactions set
    status = p_status,
    category_id = case when p_status = 'mine' then coalesce(p_category_id, category_id) else category_id end,
    group_id = case when p_status = 'group' then p_group_id else null end,
    memo = coalesce(p_memo, memo),
    needs_review = case when p_status = 'pending' then needs_review else false end,
    decided_at = case when p_status = 'pending' then null else now() end
  where id = p_id;
  if not found then raise exception 'transaction not found'; end if;

  if p_status = 'mine' and p_category_id is not null and nullif(p_merchant_key, '') is not null then
    insert into public.merchant_memory (user_id, merchant_key, category_id)
    values (auth.uid(), p_merchant_key, p_category_id)
    on conflict (user_id, merchant_key) do update set category_id = excluded.category_id, updated_at = now();
  end if;
end $$;

-- 묶음 대표값 재계산. 해석 결과가 없으면 삭제.
create or replace function public.recompute_transaction(p_tx uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.parsed_events where transaction_id = p_tx) then
    delete from public.transactions where id = p_tx;
    return;
  end if;
  update public.transactions t set
    occurred_at = (select min(occurred_at) from public.parsed_events where transaction_id = p_tx),
    merchant = (
      select merchant from public.parsed_events
      where transaction_id = p_tx and merchant is not null
      order by case when parser = 'rule:generic' then 2 when parser = 'ai' then 1 else 0 end, occurred_at
      limit 1)
  where t.id = p_tx;
end $$;
revoke execute on function public.recompute_transaction(uuid) from public, anon, authenticated;

create or replace function public.assert_owns_transaction(p_tx uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.transactions where id = p_tx and user_id = auth.uid()) then
    raise exception 'transaction not found';
  end if;
end $$;
revoke execute on function public.assert_owns_transaction(uuid) from public, anon, authenticated;

create or replace function public.split_transaction(p_tx uuid, p_event_ids uuid[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_new uuid;
begin
  perform public.assert_owns_transaction(p_tx);
  if coalesce(array_length(p_event_ids, 1), 0) = 0 then raise exception 'no events to split'; end if;

  insert into public.transactions (user_id, kind, amount, occurred_at, status)
  select t.user_id, t.kind, t.amount, t.occurred_at, 'pending' from public.transactions t where t.id = p_tx
  returning id into v_new;

  update public.parsed_events set transaction_id = v_new
  where transaction_id = p_tx and id = any(p_event_ids);
  if not found then raise exception 'events do not belong to the transaction'; end if;

  perform public.recompute_transaction(v_new);
  perform public.recompute_transaction(p_tx);
  return v_new;
end $$;
revoke execute on function public.split_transaction(uuid, uuid[]) from public, anon;
grant execute on function public.split_transaction(uuid, uuid[]) to authenticated;

create or replace function public.merge_transactions(p_target uuid, p_source uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_target = p_source then raise exception 'cannot merge a transaction into itself'; end if;
  perform public.assert_owns_transaction(p_target);
  perform public.assert_owns_transaction(p_source);
  update public.parsed_events set transaction_id = p_target where transaction_id = p_source;
  delete from public.transactions where id = p_source;
  perform public.recompute_transaction(p_target);
end $$;
revoke execute on function public.merge_transactions(uuid, uuid) from public, anon;
grant execute on function public.merge_transactions(uuid, uuid) to authenticated;

-- 정리 배치 잠금 (service role 전용)
create or replace function public.start_organize_run(p_user uuid, p_trigger text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  update public.organize_runs set status = 'failed', error = 'stale', finished_at = now()
  where user_id = p_user and status = 'running' and started_at < now() - interval '10 minutes';
  insert into public.organize_runs (user_id, trigger) values (p_user, p_trigger)
  on conflict (user_id) where status = 'running' do nothing
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.finish_organize_run(
  p_run uuid, p_status text, p_processed int, p_failed int, p_ai_calls int, p_ai_input int, p_ai_output int, p_error text
) returns void language sql security definer set search_path = '' as $$
  update public.organize_runs set status = p_status, finished_at = now(), processed_count = p_processed, failed_count = p_failed,
    ai_calls = p_ai_calls, ai_input_tokens = p_ai_input, ai_output_tokens = p_ai_output, error = p_error
  where id = p_run;
$$;

create or replace function public.ai_calls_this_month(p_user uuid)
returns int language sql stable security definer set search_path = '' as $$
  select coalesce(sum(ai_calls), 0)::int from public.organize_runs
  where user_id = p_user
    and started_at >= (date_trunc('month', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul');
$$;

revoke execute on function public.start_organize_run(uuid, text) from public, anon, authenticated;
revoke execute on function public.finish_organize_run(uuid, text, int, int, int, int, int, text) from public, anon, authenticated;
revoke execute on function public.ai_calls_this_month(uuid) from public, anon, authenticated;
grant execute on function public.start_organize_run(uuid, text) to service_role;
grant execute on function public.finish_organize_run(uuid, text, int, int, int, int, int, text) to service_role;
grant execute on function public.ai_calls_this_month(uuid) to service_role;
