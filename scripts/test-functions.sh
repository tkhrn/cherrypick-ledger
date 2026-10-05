#!/usr/bin/env bash
# 로컬 Supabase 스택(supabase start) 대상 Edge Function 통합 테스트
set -euo pipefail
cd "$(dirname "$0")/.."
eval "$(pnpm exec supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
export SUPABASE_URL="$API_URL" SUPABASE_ANON_KEY="$ANON_KEY" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
cd supabase/functions
exec ../../node_modules/.bin/deno test --allow-net --allow-env --allow-read "${@:-tests/}"
