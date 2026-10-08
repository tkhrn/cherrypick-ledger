-- 아직 결정하지 않은 정리 대기 건을 원본 알림부터 다시 정리하도록 되돌린다.
-- 해석 규칙이나 AI가 바뀐 뒤 기존 건에 새 규칙을 적용할 때 쓴다. 다음 정리 실행이 다시 해석·묶기·AI를 돌린다.
-- 결정한 건(내 소비·모임장부·무시), 자동 숨김, 메모를 단 건은 건드리지 않는다.
begin;

create temp table reprocess_tx on commit drop as
  select id from public.transactions
  where status = 'pending' and decided_at is null and memo is null;

create temp table reprocess_raw on commit drop as
  select raw_id from public.parsed_events where transaction_id in (select id from reprocess_tx);

delete from public.parsed_events where raw_id in (select raw_id from reprocess_raw);
delete from public.transactions where id in (select id from reprocess_tx);
update public.raw_notifications set processed_at = null, attempts = 0 where id in (select raw_id from reprocess_raw);

select (select count(*) from reprocess_tx) as transactions, (select count(*) from reprocess_raw) as notifications;
commit;
