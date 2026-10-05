#!/usr/bin/env bash
# Gemini API 키를 Supabase Edge Function 비밀값으로 넣는다. 키는 화면에 보이지 않게 입력받는다.
#   ./scripts/set-gemini-key.sh dev   또는   ./scripts/set-gemini-key.sh prod
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh "${1:-}"
read -r -s -p "Gemini API 키를 붙여넣고 Enter: " GEMINI_KEY
echo
[ -n "$GEMINI_KEY" ] || { echo "키가 비어 있어요" >&2; exit 1; }
pnpm exec supabase secrets set "GEMINI_API_KEY=$GEMINI_KEY" --project-ref "$PROJECT_REF" > /dev/null
echo "GEMINI_API_KEY 저장 완료 ($1)"
