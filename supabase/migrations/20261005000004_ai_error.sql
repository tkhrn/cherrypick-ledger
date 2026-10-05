-- AI 호출 실패 이유를 실행 기록에 남긴다 (프롬프트·알림 문구는 담지 않음)
alter table public.organize_runs add column ai_error text;

drop function public.finish_organize_run(uuid, text, int, int, int, int, int, text);
create function public.finish_organize_run(
  p_run uuid, p_status text, p_processed int, p_failed int, p_ai_calls int, p_ai_input int, p_ai_output int, p_error text,
  p_ai_error text default null
) returns void language sql security definer set search_path = '' as $$
  update public.organize_runs set status = p_status, finished_at = now(), processed_count = p_processed, failed_count = p_failed,
    ai_calls = p_ai_calls, ai_input_tokens = p_ai_input, ai_output_tokens = p_ai_output, error = p_error, ai_error = p_ai_error
  where id = p_run;
$$;
revoke execute on function public.finish_organize_run(uuid, text, int, int, int, int, int, text, text) from public, anon, authenticated;
grant execute on function public.finish_organize_run(uuid, text, int, int, int, int, int, text, text) to service_role;
