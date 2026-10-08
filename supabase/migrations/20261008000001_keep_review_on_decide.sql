-- 결정해도 확인 필요 표시(needs_review)를 지우지 않는다.
-- 되돌리기(pending)로 돌아왔을 때 왜 확인이 필요했는지 다시 보이도록 한다. 결정된 건에서는 앱이 표시하지 않는다.
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
    decided_at = case when p_status = 'pending' then null else now() end
  where id = p_id;
  if not found then raise exception 'transaction not found'; end if;

  if p_status = 'mine' and p_category_id is not null and nullif(p_merchant_key, '') is not null then
    insert into public.merchant_memory (user_id, merchant_key, category_id)
    values (auth.uid(), p_merchant_key, p_category_id)
    on conflict (user_id, merchant_key) do update set category_id = excluded.category_id, updated_at = now();
  end if;
end $$;
