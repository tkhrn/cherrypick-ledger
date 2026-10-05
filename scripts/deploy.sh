#!/usr/bin/env bash
# 스키마·Edge Function·AI 모델 설정·Vault project_url을 dev 또는 prod Supabase에 배포한다.
#   ./scripts/deploy.sh dev
#   ./scripts/deploy.sh prod
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh "${1:-}"
AI_MODEL="${AI_MODEL:-gemini-flash-latest}"

./scripts/sync-core.sh --check
pnpm exec supabase link --project-ref "$PROJECT_REF" < /dev/null > /dev/null
pnpm exec supabase db push --linked --yes < /dev/null
pnpm exec supabase db query --linked \
  "select vault.create_secret('${SUPABASE_URL}', 'project_url') where not exists (select 1 from vault.secrets where name = 'project_url')" < /dev/null > /dev/null
pnpm exec supabase secrets set "AI_MODEL=${AI_MODEL}" --project-ref "$PROJECT_REF" < /dev/null > /dev/null
pnpm exec supabase functions deploy --use-api --project-ref "$PROJECT_REF" < /dev/null | grep -v "Uploading asset" || true
echo "배포 완료: $1 ($PROJECT_REF)"
