# Cherrypick

여러 금융앱의 결제·이체 알림을 모아, **내가 승인한 소비만** 기록하는 개인 가계부 (안드로이드).

- 설계: [`docs/superpowers/specs/2026-10-05-cherrypick-ledger-design.md`](docs/superpowers/specs/2026-10-05-cherrypick-ledger-design.md)
- 구현 계획: [`docs/superpowers/plans/2026-10-05-cherrypick-ledger-phase1.md`](docs/superpowers/plans/2026-10-05-cherrypick-ledger-phase1.md)
- 룩앤필: [`designs/`](designs/)

## 구조

```
apps/mobile/            Expo(React Native) 앱
  modules/notification-capture/   알림·문자 수집 Kotlin 모듈 (안드로이드 전용)
packages/core/          해석·묶기·취소·AI 클라이언트·정리 오케스트레이터 (순수 TS)
supabase/
  migrations/           스키마·RLS·RPC·cron
  functions/            ingest · organize · daily-digest (Deno)
  functions/_shared/core/   packages/core 복사본 (scripts/sync-core.sh로 생성)
  tests/database/       pgTAP
scripts/                sync-core.sh, test-functions.sh
```

## 로컬 개발

필요한 것: Node 24, pnpm 10, Docker, Android Studio(SDK·에뮬레이터·JDK).

```bash
pnpm install
```

```bash
pnpm exec supabase start
```

```bash
pnpm exec supabase functions serve --env-file supabase/functions/.env
```

`supabase/functions/.env`는 `supabase/functions/.env.example`을 복사해 만든다.

앱 실행 (에뮬레이터 기준, `.env.local`에 로컬 값):

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
```

`EXPO_PUBLIC_SUPABASE_ANON_KEY`에는 `pnpm exec supabase status`의 `ANON_KEY`를 넣는다. 로그인 코드는 로컬 메일함(http://127.0.0.1:54324)에서 확인한다.

```bash
cd apps/mobile && npx expo run:android
```

## 테스트

```bash
pnpm -C packages/core test
```

```bash
pnpm test:db
```

```bash
pnpm test:functions
```

```bash
cd apps/mobile && npx tsc --noEmit && npx expo lint && npx jest
```

Kotlin 단위 테스트 (prebuild 후):

```bash
cd apps/mobile/android && ./gradlew :notification-capture:testDebugUnitTest
```

`packages/core`를 고치면 Edge Function용 복사본도 갱신한다:

```bash
pnpm sync:core
```

## 원격 배포 (직접 해야 하는 단계)

키·비밀번호가 들어가는 단계라 직접 실행한다. Supabase 프로젝트 ref는 `kabcpknnqmbowueoklrz`.

1. Supabase CLI 로그인과 프로젝트 연결

   ```bash
   pnpm exec supabase login
   ```

   ```bash
   pnpm exec supabase link --project-ref kabcpknnqmbowueoklrz
   ```

2. 스키마 반영

   ```bash
   pnpm exec supabase db push
   ```

3. Edge Function 비밀값. `CRON_SECRET`은 아무 긴 랜덤 문자열(예: `openssl rand -hex 32`)

   ```bash
   pnpm exec supabase secrets set GEMINI_API_KEY=발급받은키 AI_MODEL=gemini-flash-latest CRON_SECRET=랜덤문자열
   ```

4. cron이 함수를 부를 수 있도록 Vault에 두 값 저장 (대시보드 SQL Editor에서 실행, 3번과 같은 `CRON_SECRET`)

   ```sql
   select vault.create_secret('https://kabcpknnqmbowueoklrz.supabase.co', 'project_url');
   select vault.create_secret('랜덤문자열', 'cron_secret');
   ```

5. 함수 배포

   ```bash
   pnpm sync:core && pnpm exec supabase functions deploy
   ```

6. 로그인 메일에 6자리 코드가 나오게 하기: 대시보드 → Authentication → Emails → Magic Link 템플릿 본문에 `{{ .Token }}`을 넣는다.

7. **가입 막기 (중요)**: 앱(APK)에는 anon 키가 들어 있어서 누구나 계정을 만들 수 있고, 그러면 내 Gemini 키를 같이 쓰게 돼요. 내 계정으로 처음 로그인한 뒤 대시보드 → Authentication → Sign In / Providers에서 **Allow new users to sign up**을 끈다.

8. 앱 빌드 (EAS 프로젝트 `@tkhrn/cherrypick-ledger`)

   - EAS 환경변수에 `EXPO_PUBLIC_SUPABASE_URL`(`https://kabcpknnqmbowueoklrz.supabase.co`)과 `EXPO_PUBLIC_SUPABASE_ANON_KEY`(대시보드 → Settings → API Keys의 publishable/anon 키)를 `preview`·`development` 환경으로 등록한다.
   - 정리 알림 푸시를 받으려면 Firebase 프로젝트를 만들고 FCM V1 서비스 계정 키를 EAS Credentials에 올린다 (`npx eas-cli@latest credentials`). 없어도 앱은 동작하고 푸시만 오지 않는다.

   ```bash
   cd apps/mobile && npx eas-cli@latest build -p android --profile preview
   ```

   만들어진 APK를 폰에 설치한다. 첫 설정에서 알림 접근 권한을 켜고, 설정 → 배터리 최적화 예외를 켜 두면 수집이 멈추지 않는다. 실기기 확인 항목은 [`apps/mobile/modules/notification-capture/CHECKLIST.md`](apps/mobile/modules/notification-capture/CHECKLIST.md).

## 운영 첫 1주

실제 알림 원문이 쌓이면 `packages/core/test/fixtures/notifications.ts`를 실제 문구로 보강하고, 자주 쓰는 앱의 규칙을 `packages/core/src/parse/rules.ts`에 추가한다. 잘못 묶인 사례(나누기·합치기한 건)를 보고 묶기 기준을 조정한다.
