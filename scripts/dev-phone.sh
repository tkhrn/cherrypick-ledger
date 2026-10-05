#!/usr/bin/env bash
# 개발용 앱(Cherrypick (dev))을 USB로 연결된 폰에 띄운다. EAS 빌드 쿼터를 쓰지 않는다.
#   첫 실행 또는 네이티브 변경 후: ./scripts/dev-phone.sh build
#   JS만 바꿀 때: ./scripts/dev-phone.sh   (Metro만 띄우면 폰이 바로 새 코드를 받는다)
# 서버는 dev Supabase 프로젝트를 쓴다 (배포용 앱의 데이터와 섞이지 않음).
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh dev
export APP_VARIANT=development
export EXPO_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
export EXPO_PUBLIC_SUPABASE_ANON_KEY=$(pnpm exec supabase projects api-keys --project-ref "$PROJECT_REF" -o json 2>/dev/null | node -e '
  const keys = JSON.parse(require("fs").readFileSync(0, "utf8"));
  process.stdout.write((keys.find((k) => k.name === "anon") ?? keys.find((k) => k.type === "publishable")).api_key);')
export JAVA_HOME="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
ADB="$ANDROID_HOME/platform-tools/adb"
DEVICE=$("$ADB" devices | awk 'NR>1 && $2=="device" && $1 !~ /^emulator/ {print $1; exit}')
[ -n "$DEVICE" ] || { echo "USB로 연결된 폰이 없어요 (USB 디버깅 확인)" >&2; exit 1; }
"$ADB" -s "$DEVICE" reverse tcp:8081 tcp:8081
cd apps/mobile
# 개발 모드 번들은 .env.local 값을 셸 환경변수보다 우선하므로, dev 프로젝트 값으로 다시 쓴다
printf 'EXPO_PUBLIC_SUPABASE_URL=%s\nEXPO_PUBLIC_SUPABASE_ANON_KEY=%s\n' \
  "$EXPO_PUBLIC_SUPABASE_URL" "$EXPO_PUBLIC_SUPABASE_ANON_KEY" > .env.local
if [ "${1:-}" = "build" ]; then
  npx expo prebuild -p android --clean --no-install
  (cd android && ANDROID_SERIAL="$DEVICE" ./gradlew :app:installDebug -x lint)
fi
# 앱을 Metro(USB reverse)에 붙여서 연다
"$ADB" -s "$DEVICE" shell am start -a android.intent.action.VIEW \
  -d "cherrypick-dev://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081" > /dev/null || true
npx expo start --dev-client --port 8081 --clear
