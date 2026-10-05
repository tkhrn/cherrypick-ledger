#!/usr/bin/env bash
# 앱 빌드용 Supabase 주소와 공개(anon/publishable) 키를 EAS 환경변수로 등록한다.
#   development 빌드 → dev 프로젝트, preview 빌드 → prod 프로젝트
set -euo pipefail
cd "$(dirname "$0")/.."

anon_key() {
  pnpm exec supabase projects api-keys --project-ref "$1" -o json | node -e '
    const keys = JSON.parse(require("fs").readFileSync(0, "utf8"));
    const k = keys.find((x) => x.name === "anon") ?? keys.find((x) => x.type === "publishable");
    if (!k) process.exit(1);
    process.stdout.write(k.api_key);'
}
cd apps/mobile
for PAIR in "development:dev" "preview:prod"; do
  EAS_ENV=${PAIR%%:*}
  source ../../scripts/env.sh "${PAIR##*:}"
  ANON=$(cd ../.. && anon_key "$PROJECT_REF")
  npx eas-cli@latest env:create "$EAS_ENV" --name EXPO_PUBLIC_SUPABASE_URL --value "$SUPABASE_URL" --visibility plaintext --force --non-interactive > /dev/null
  npx eas-cli@latest env:create "$EAS_ENV" --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "$ANON" --visibility plaintext --force --non-interactive > /dev/null
done
echo "EAS 환경변수 등록 완료 (development → dev, preview → prod)"
