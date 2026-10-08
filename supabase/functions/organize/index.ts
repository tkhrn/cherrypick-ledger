import { createGeminiClient, runOrganize } from '../_shared/core/index.ts';
import { isCronCall } from '../_shared/cron.ts';
import { json } from '../_shared/http.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';
import { createSupabaseRepo } from '../_shared/supabaseRepo.ts';
import { interpretRunStart } from './runStart.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

const DEFAULT_AI_MODEL = 'gemini-flash-lite-latest';
const MAX_PARSE_ATTEMPTS = 3;

type RunStatus = 'succeeded' | 'already_running' | 'failed';

async function organizeUser(admin: SupabaseClient, userId: string, trigger: 'cron' | 'manual') {
  const start = interpretRunStart(await admin.rpc('start_organize_run', { p_user: userId, p_trigger: trigger }));
  if (start.kind === 'already_running') return { status: 'already_running' as RunStatus, processed: 0 };
  if (start.kind === 'failed') {
    console.error('organize start failed', userId, start.message);
    return { status: 'failed' as RunStatus, processed: 0 };
  }
  const { runId } = start;

  try {
    const [{ data: settings }, { data: callsThisMonth }] = await Promise.all([
      admin.from('user_settings').select('ai_monthly_call_cap').eq('user_id', userId).maybeSingle(),
      admin.rpc('ai_calls_this_month', { p_user: userId }),
    ]);
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const ai = apiKey ? createGeminiClient({ apiKey, model: Deno.env.get('AI_MODEL') ?? DEFAULT_AI_MODEL }) : null;
    const aiAllowed = (callsThisMonth ?? 0) < (settings?.ai_monthly_call_cap ?? 0);

    const result = await runOrganize(createSupabaseRepo(admin, userId), { now: new Date().toISOString(), ai, aiAllowed });
    if (result.aiError) console.error('organize ai failed', userId, result.aiError);
    await admin.rpc('finish_organize_run', {
      p_run: runId, p_status: 'succeeded', p_processed: result.processed, p_failed: result.failed, p_ai_calls: result.aiCalls,
      p_ai_input: result.aiUsage.inputTokens, p_ai_output: result.aiUsage.outputTokens, p_error: null, p_ai_error: result.aiError,
    });
    return { status: 'succeeded' as RunStatus, processed: result.processed };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error('organize failed', userId, message);
    await admin.rpc('finish_organize_run', {
      p_run: runId, p_status: 'failed', p_processed: 0, p_failed: 0, p_ai_calls: 0, p_ai_input: 0, p_ai_output: 0, p_error: message,
    });
    return { status: 'failed' as RunStatus, processed: 0 };
  }
}

async function usersWithPendingNotifications(admin: SupabaseClient): Promise<string[]> {
  const { data } = await admin.from('raw_notifications').select('user_id').is('processed_at', null).lt('attempts', MAX_PARSE_ATTEMPTS);
  return [...new Set((data ?? []).map((r) => r.user_id as string))];
}

Deno.serve(async (req) => {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const admin = createAdminClient();

  if (await isCronCall(admin, token)) {
    const users = await usersWithPendingNotifications(admin);
    const results = [];
    for (const userId of users) results.push(await organizeUser(admin, userId, 'cron'));
    return json({ users: users.length, results });
  }

  const { data } = await admin.auth.getUser(token);
  if (!data.user) return json({ error: 'unauthorized' }, 401);
  return json(await organizeUser(admin, data.user.id, 'manual'));
});
