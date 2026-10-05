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
scripts/                deploy.sh, dev-phone.sh, sync-core.sh, test-functions.sh …
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

앱 실행 (에뮬레이터 + 로컬 Docker Supabase 기준, `.env.local`에 로컬 값). 개발 모드 번들은 `.env.local`을 셸 환경변수보다 우선하고, `scripts/dev-phone.sh`는 실행할 때마다 `.env.local`을 dev 프로젝트 값으로 다시 쓴다:

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

## 원격 배포

Supabase 프로젝트는 둘로 나뉜다 (ref는 `scripts/env.sh`).

| 환경 | 프로젝트 | 쓰는 앱 |
|---|---|---|
| `dev` | `cherrypick-ledger-dev` (`musbctrurxvtalwqpxlk`) | Cherrypick (dev) — `scripts/dev-phone.sh`, EAS `development` |
| `prod` | `cherrypick-ledger` (`kabcpknnqmbowueoklrz`) | Cherrypick — EAS `preview` APK |

1. 스키마·함수·AI 모델·cron용 Vault 값을 한 번에 반영 (cron 비밀값은 마이그레이션이 Vault에 자동 생성)

   ```bash
   ./scripts/deploy.sh dev
   ```

   ```bash
   ./scripts/deploy.sh prod
   ```

2. Gemini 키 (입력은 화면에 보이지 않음)

   ```bash
   ./scripts/set-gemini-key.sh dev
   ```

3. 대시보드 → Authentication → URL Configuration → Redirect URLs: prod에는 `cherrypick://**`, dev에는 `cherrypick-dev://**`

4. Google 로그인: Google Cloud Console에서 OAuth 동의 화면(외부, 테스트 사용자에 내 Gmail)과 웹 애플리케이션 클라이언트를 만들고, 승인된 리디렉션 URI에 `https://<ref>.supabase.co/auth/v1/callback`을 환경마다 넣는다. Client ID·Secret을 각 프로젝트의 대시보드 → Authentication → Sign In / Providers → Google에 넣고 켠다.

5. **가입 막기 (선택)**: 앱(APK)에는 anon 키가 들어 있어서 APK를 받은 누구나 계정을 만들 수 있고, 그러면 내 Gemini 키를 같이 쓰게 된다. APK를 남에게 줄 거라면 대시보드 → Authentication → Sign In / Providers에서 **Allow new users to sign up**을 끈다.

6. EAS 환경변수 (`development` → dev, `preview` → prod)

   ```bash
   ./scripts/setup-eas-env.sh
   ```

   정리 알림 푸시를 받으려면 Firebase 프로젝트를 만들고 FCM V1 서비스 계정 키를 EAS Credentials에 올린다 (`npx eas-cli@latest credentials`). 없어도 앱은 동작하고 푸시만 오지 않는다.

7. 개발용 앱을 USB로 연결한 폰에 띄우기 (EAS 쿼터를 쓰지 않음)

   ```bash
   ./scripts/dev-phone.sh build
   ```

   JS만 고쳤으면 `./scripts/dev-phone.sh`로 Metro만 띄운다.

8. 배포용 APK

   ```bash
   cd apps/mobile && npx eas-cli@latest build -p android --profile preview
   ```

   첫 설정에서 알림 접근 권한을 켜고, 설정 → 배터리 최적화 예외를 켜 두면 수집이 멈추지 않는다. 실기기 확인 항목은 [`apps/mobile/modules/notification-capture/CHECKLIST.md`](apps/mobile/modules/notification-capture/CHECKLIST.md).

## 운영 첫 1주

실제 알림 원문이 쌓이면 `packages/core/test/fixtures/notifications.ts`를 실제 문구로 보강하고, 자주 쓰는 앱의 규칙을 `packages/core/src/parse/rules.ts`에 추가한다. 잘못 묶인 사례(나누기·합치기한 건)를 보고 묶기 기준을 조정한다.
