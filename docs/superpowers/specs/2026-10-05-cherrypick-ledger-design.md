# cherrypick-ledger 설계 스펙 (1단계)

- 작성일: 2026-10-05
- 상태: 사용자 검토 대기
- 관련 문서: [`designs/look-and-feel.md`](../../../designs/look-and-feel.md), [`designs/screens.md`](../../../designs/screens.md), [`designs/components.md`](../../../designs/components.md)

## 1. 목적

여러 금융앱이 보내는 결제·이체 알림 가운데 **진짜 내 소비만 골라 기록**하는 개인용 가계부.

기존 금융앱의 문제:

1. 내 계좌 간 이동이 소비로 잡힌다.
2. 모임 총무로서 쓴 돈이 내 소비로 잡힌다.
3. 같은 결제에 대해 여러 앱(카드사 앱, 문자, 토스 등)에서 알림이 중복으로 온다.
4. 분류가 지나치게 세세하고 부정확하다.

해결 방식: 코드 리뷰에서 PR을 승인하듯, 수집된 결제 건을 사용자가 직접 **내 소비 / 모임장부 / 무시** 중 하나로 처리한 것만 기록에 남긴다.

### 성공 기준

- 하루 한 번 앱을 열어 그날 결제를 1~2분 안에 정리할 수 있다.
- 같은 결제의 중복 알림은 대부분 한 건으로 묶여 보인다.
- 내 계좌 간 이체는 목록에 뜨지 않는다.
- 내 소비 합계에는 내가 승인한 건만 들어간다.

## 2. 범위

### 1단계 (이 스펙)

- 안드로이드 알림·문자 수집
- 서버 정리 배치(규칙 해석 → 실패분만 AI → 중복 묶기 → 자동 숨김 → 카테고리 추천)
- 정리 목록, 내 소비(목록·달력), 모임장부, 설정
- 하루 한 번 정리 알림 푸시
- Supabase 서버 저장, 로그인

### 제외 (이후 별도 스펙)

- 엑셀 내보내기, AI 리포트 (2단계)
- 결제 직후 즉시 승인 표시(오버레이)
- AI가 해석한 형식을 규칙으로 자동 저장하는 기능
- iOS 지원 (iOS는 다른 앱 알림·문자 접근이 불가하므로 수집 방식 자체를 새로 설계해야 함)

## 3. 결정 사항 요약

| 항목 | 결정 |
|---|---|
| 플랫폼 | 안드로이드, 사이드로드 설치(스토어 배포 안 함) |
| 앱 | Expo(React Native) + Kotlin 네이티브 모듈(알림·문자 수집) |
| 서버 | Supabase (Postgres, Auth, Edge Functions, pg_cron) |
| AI | Claude Haiku 4.5 (`claude-haiku-4-5`), 규칙 실패 건만, 배치당 1회 묶음 호출, 월 한도 |
| 수집 대상 | 첫 설정·설정 화면에서 사용자가 고른 앱 + 문자(켜고 끌 수 있음) |
| 정리 주기 | 3시간마다 자동 + 앱에서 "지금 정리하기" |
| 정리 알림 | 하루 한 번(기본 21:00), 정리할 건이 있을 때만 |
| 처리 종류 | 내 소비 / 모임장부 / 무시 (+ 시스템의 자동숨김) |
| 내 계좌 간 이체 | 내 계좌(은행 + 끝 4자리) 등록 → 자동숨김 |
| 모임장부 | 별도 리스트, 기록 항목은 모임·금액·날짜·가게 정도 |
| 카테고리 | 기본 9개, 사용자가 추가·삭제·이름 변경 가능 |
| 시간 기준 | 한국 시간(Asia/Seoul), 하루 = 0시~24시 |

## 4. 전체 구조

```
┌──────────── 안드로이드 폰 ─────────────┐
│ [수집 모듈 · Kotlin]                    │
│  NotificationListenerService            │
│  SMS BroadcastReceiver                  │
│  → 선택한 앱만 통과                      │
│  → 로컬 대기열(Room)                     │
│  → WorkManager로 업로드 + 재시도          │
│                                         │
│ [앱 화면 · Expo/RN]                      │
│  첫 설정 / 정리 / 내 소비 / 모임장부 / 설정 │
└──────────────┬──────────────────────────┘
               │ 원문 업로드 / 결과 조회·결정
┌──────────────▼─────── Supabase ─────────┐
│ DB: raw_notifications → parsed_events   │
│     → transactions                      │
│ Edge Function `organize`                │
│   pg_cron 3시간마다 + 앱 수동 호출        │
│ Edge Function `daily-digest`             │
│   pg_cron 매일 21:00 → Expo Push         │
│ Auth + RLS (본인 데이터만)               │
└─────────────────────────────────────────┘
```

### 역할 원칙

- **수집 모듈은 해석하지 않는다.** 원문을 그대로 올린다. 해석 로직을 바꿀 때 앱 재설치가 필요 없다.
- **해석·묶기 로직은 `packages/core`(순수 TS)에 둔다.** Edge Function이 이를 import한다. 서버 없이 단위 테스트할 수 있다.
- **원문은 수정하지 않는다.** 모든 결과는 원문 위에 쌓이며, 묶기·결정은 되돌릴 수 있다.

### 저장소 구조

```
cherrypick-ledger/
├── apps/mobile/                 # Expo 앱
│   └── modules/notification-capture/   # Kotlin Expo 모듈
├── packages/core/               # 해석·묶기·취소·카테고리 키 로직 (순수 TS)
├── supabase/
│   ├── migrations/
│   └── functions/{organize,daily-digest}/
├── designs/                     # 룩앤필·화면·컴포넌트 문서 (플랫폼 무관)
└── docs/superpowers/specs/
```

## 5. 수집 (안드로이드)

- **알림:** `NotificationListenerService`로 알림을 받는다. 패키지명이 `source_apps`에서 켜진 앱일 때만 통과시킨다. 선택 목록은 앱이 네이티브 모듈에 동기화한다.
- **문자:** `RECEIVE_SMS` BroadcastReceiver로 받는다. 설정에서 문자가 켜져 있을 때만 통과시킨다. 이때 `source_package`는 `sms`로 저장한다.
- **저장 필드:** `source_package`, `title`, `body`, `posted_at`(알림 시각), `dedupe_key`.
- **`dedupe_key`:** `sha256(source_package + posted_at(ms) + title + body)`. 같은 알림이 갱신되거나 재업로드돼도 한 번만 저장된다.
- **업로드:** 로컬 Room DB의 대기열에 넣은 뒤 WorkManager가 업로드한다. 네트워크 연결을 조건으로 걸고, 실패하면 지수 백오프로 재시도한다. 서버에는 `dedupe_key` 기준으로 중복 무시(upsert ignore)하며 저장한다.
- **인증:** 앱 로그인 세션의 토큰을 네이티브 쪽 안전 저장소에 공유한다. 앱 JS가 살아 있지 않아도 업로드가 가능해야 한다.
- **상태 기록:** 마지막 수집 시각과 업로드 대기 건수를 네이티브 저장소에 기록하고, 앱이 이를 읽어 표시한다.

## 6. 데이터 모델

모든 테이블은 `user_id`(auth.users 참조)를 갖고, RLS로 `user_id = auth.uid()`만 허용한다.

### 흐름 테이블

**`raw_notifications`** — 알림 원문. 서버 함수 외에는 수정하지 않는다.

| 컬럼 | 설명 |
|---|---|
| `id` | uuid |
| `source_package` | 앱 패키지명 또는 `sms` |
| `title`, `body` | 원문 |
| `posted_at` | 알림 시각 |
| `dedupe_key` | unique (user_id, dedupe_key) |
| `received_at` | 서버 수신 시각 |
| `processed_at` | 정리 완료 시각, null이면 미처리 |
| `attempts` | 해석 시도 횟수 |

**`parsed_events`** — 해석 결과. 원문과 1:1로 대응한다.

| 컬럼 | 설명 |
|---|---|
| `raw_id` | → raw_notifications, unique |
| `kind` | `payment` / `transfer_out` / `cancel` / `deposit` / `unknown` |
| `amount` | 정수(원) |
| `merchant` | 가게 또는 받는 사람, nullable |
| `account_last4` | 상대 계좌 끝 4자리, nullable |
| `occurred_at` | 결제 시각(본문에 없으면 posted_at) |
| `parser` | `rule:<규칙ID>` / `rule:generic` / `ai` |
| `transaction_id` | → transactions (묶음) |

**`transactions`** — 실제 결제 1건. 정리 목록의 한 줄이다.

| 컬럼 | 설명 |
|---|---|
| `kind` | `payment` / `transfer_out` / `deposit` / `cancel`(매칭 실패한 취소) / `unknown`(해석 실패) |
| `amount`, `merchant`, `occurred_at` | 대표값(가장 정보가 많은 해석 결과 기준). `unknown`이면 `amount`가 null일 수 있음 |
| `status` | `pending` / `mine` / `group` / `ignored` / `auto_hidden` |
| `auto_hidden_reason` | `own_transfer` / `deposit` / null |
| `category_id` | → categories, nullable |
| `group_id` | → groups, `status = group`일 때 필수 |
| `cancelled_at` | 승인취소가 매칭되면 기록, 합계에서 제외 |
| `needs_review` | 확인 필요 플래그 |
| `review_reason` | `ambiguous_group` / `missing_merchant` / `unmatched_cancel` / `parse_failed` |
| `memo` | 사용자 메모 |
| `decided_at` | 사용자 결정 시각 |

입금(`deposit`)과 해석 불가 건은 화면 표시와 추적을 위해 `transactions`로 만든다. 입금은 `auto_hidden`, 해석 불가 건은 `pending` + `needs_review`이다. 결제 알림이 아니라고 판단한 건(금액·키워드 없음)은 `parsed_events.kind = unknown`으로만 남기고 `transactions`는 만들지 않는다.

### 설정·참조 테이블

| 테이블 | 주요 컬럼 |
|---|---|
| `source_apps` | `package_name`, `label`, `enabled`; unique (user_id, package_name) |
| `my_accounts` | `bank_name`, `last4`, `alias` |
| `categories` | `name`, `icon`, `color_token`, `sort_order`, `archived` |
| `groups` | `name`, `archived` |
| `merchant_memory` | `merchant_key`(정규화된 가게명), `category_id`; unique (user_id, merchant_key) |
| `organize_runs` | `trigger`(`cron`/`manual`), `status`(`running`/`succeeded`/`failed`), `started_at`, `finished_at`, `processed_count`, `ai_calls`, `ai_input_tokens`, `ai_output_tokens`, `ai_cost_usd`, `error` |
| `user_settings` | `digest_time`(기본 21:00), `ai_monthly_cap_usd`(기본 1.00), `expo_push_token`, `sms_enabled` |

### 기본 카테고리

| 이름 | 아이콘 | 색 토큰 |
|---|---|---|
| 식비 | tools-kitchen-2 | `cat-coral` |
| 카페·간식 | coffee | `cat-amber` |
| 교통 | bus | `cat-teal` |
| 쇼핑 | shopping-bag | `cat-pink` |
| 주거·고정비 | home | `cat-purple` |
| 의료·건강 | heartbeat | `cat-red` |
| 여가·문화 | movie | `cat-blue` |
| 경조사·선물 | gift | `cat-green` |
| 기타 | dots | `cat-gray` |

첫 로그인 시 이 9개를 시드한다. 색 토큰 값은 `designs/look-and-feel.md`에 정의한다.

## 7. 정리 배치 (`organize`)

**실행 경로:**
- pg_cron이 3시간마다(00·03·06·…·21시 KST) 호출한다.
- 앱의 "지금 정리하기"로도 호출할 수 있다. 사용자 JWT로 인증한다.
- cron 실행은 모든 사용자를 순회한다. 1단계는 사실상 한 명이다.

### 단계

0. **잠금:** 해당 사용자의 `running` 실행이 있고 시작한 지 10분이 안 지났으면 즉시 반환한다(`already_running`). 아니면 `organize_runs`에 `running` 행을 삽입하고 진행한다.
1. **대상 조회:** `processed_at is null and attempts < 3`인 원문을 `posted_at` 순으로 가져온다.
2. **규칙 해석:** 각 원문을 해석한다.
   - 앱별 규칙(`packages/core/rules/<package>.ts`)이 있으면 먼저 적용한다.
   - 없거나 실패하면 공통 규칙을 적용한다.
     - 금액: `([0-9]{1,3}(,[0-9]{3})+|[0-9]+)\s*원`
     - 종류 키워드: 취소 > 입금 > 출금/이체/송금 > 승인/결제/사용 순으로 판정
     - 계좌: `\d{2,6}[-*]+\**\d{0,4}[-*]*(\d{4})` 또는 `(\d{4})` 형태의 마스킹 계좌
     - 시각: 본문의 `HH:mm`, `MM/DD HH:mm`
   - 금액과 종류 키워드가 모두 없으면 `unknown`(결제 알림 아님)으로 처리한다.
   - 금액과 종류는 있는데 `payment`/`transfer_out`의 가게·받는 사람을 못 뽑으면 **AI 대상**으로 모은다.
3. **AI 보완:** AI 대상과 처음 보는 가게의 카테고리 추천 요청을 **한 번의 호출**로 묶는다.
   - 모델: `claude-haiku-4-5`
   - 입력: 알림 제목·본문만 보낸다(사용자 식별 정보 제외). 출력은 JSON 스키마로 강제한다.
   - 이번 달 `organize_runs.ai_cost_usd` 합계가 `ai_monthly_cap_usd` 이상이면 AI 호출을 건너뛴다.
   - 실패, 타임아웃, 스키마 불일치 시 AI 결과 없이 진행한다. 이 경우 `needs_review = true`, `review_reason = missing_merchant`이다.
4. **묶기:** `payment`/`transfer_out`/`deposit` 해석 결과마다 기존 묶음 후보를 찾는다.
   - 같은 것으로 보는 조건(모두 만족):
     - `amount`가 같다
     - `kind`가 같다
     - `|occurred_at 차이| ≤ 10분`
     - 후보 묶음에 **같은 `source_package`의 해석 결과가 아직 없다**
   - 후보가 0개면 새 `transactions`를 만든다.
   - 후보가 1개면 그 묶음에 붙인다.
   - 후보가 2개 이상이면 시간이 가장 가까운 묶음에 붙이고 `needs_review`(`ambiguous_group`)를 표시한다.
   - 이미 사용자가 결정한 묶음에 붙는 경우 상태는 그대로 둔다(조용히 붙임).
   - 대표값은 묶음 내에서 `merchant`가 있는 해석 결과 가운데 앱별 규칙 > AI > 공통 규칙 순으로 고른다.
5. **자동 숨김:**
   - `transfer_out`이고 `account_last4`가 `my_accounts.last4`에 있으면 `auto_hidden`(`own_transfer`)으로 처리한다.
   - `deposit`이면 `auto_hidden`(`deposit`)으로 처리한다.
   - 자동 숨김은 `pending` 상태에만 적용한다.
6. **승인취소:**
   - `cancel` 해석 결과는 다음 조건으로 원래 결제를 찾는다: 같은 금액, `kind = payment`, `cancelled_at is null`, 최근 7일. `merchant`가 있으면 일치하는 것을 우선한다.
   - 찾으면 `cancelled_at`을 기록하고, 해석 결과를 그 묶음에 연결한다.
   - 못 찾으면 `pending` + `needs_review`(`unmatched_cancel`)인 별도 건을 만든다.
7. **카테고리 추천:**
   - `category_id`가 비어 있는 `payment` 묶음만 대상이다.
   - 먼저 `merchant_key`(공백·괄호·`(주)`·`코리아`·지점명 접미사 제거, 소문자화)로 `merchant_memory`를 조회한다.
   - 없으면 3단계 AI 결과의 추천 카테고리를 쓴다.
   - `transfer_out`은 비워 둔다.
8. **마무리:**
   - 성공한 원문은 `processed_at`을 기록한다.
   - 예외가 난 원문은 `attempts += 1`을 하고, 3회에 도달하면 `pending` + `needs_review`(`parse_failed`) 건으로 만든 뒤 `processed_at`을 기록한다.
   - 실행 행을 `succeeded`(또는 `failed` + `error`)로 갱신하고 집계 값을 기록한다.

### 사용자 결정 시 서버 동작

| 동작 | 변경 |
|---|---|
| 내 소비 | `status = mine`, `category_id` 확정. 가게명이 있으면 `merchant_memory` upsert |
| 모임장부 | `status = group`, `group_id` 필수 |
| 무시 | `status = ignored` |
| 되돌리기 | `status = pending` |
| 나누기 | 선택한 해석 결과들을 새 `transactions`로 옮기고, 두 묶음의 대표값을 재계산 |
| 합치기 | 한쪽 묶음의 해석 결과를 다른 쪽으로 옮기고 빈 묶음을 삭제 |

나누기·합치기는 원자성을 위해 Postgres 함수(RPC)로 구현한다.

## 8. 정리 알림 (`daily-digest`)

- pg_cron이 매시 정각에 호출한다. 현재 KST 시각이 `digest_time`과 같은 사용자만 대상으로 한다.
- 오늘(KST) `pending`인 건이 1건 이상이면 Expo Push를 보낸다. 문구 예시: "오늘 정리할 소비 7건이 있어요".
- 실패하면 기록만 남긴다. 재시도는 없고, 다음 날 다시 보낸다.

## 9. 화면

자세한 와이어프레임과 동작은 `designs/screens.md`를 따른다. 요약:

- **첫 설정:** 로그인 → 알림 접근 권한 → 문자 권한(선택) → 분석할 앱 선택 → 내 계좌 등록. 모임은 나중에 등록해도 된다.
- **정리 탭:**
  - 날짜별로 `pending` 건을 보여준다. `needs_review` 건은 배지로 표시한다.
  - 오른쪽으로 밀면 내 소비, 왼쪽으로 밀면 무시, 길게 누르면 여러 건 선택이다.
  - 하단에는 "아직 정리 안 된 알림 N건 · 다음 자동 정리 HH:00 · [지금 정리하기]"를 둔다. 실행 중이면 "정리 중…"을 보여준다.
- **상세 시트:**
  - 내 소비 / 모임장부 / 무시 선택, 카테고리 또는 모임 선택, 메모를 입력한다.
  - 원본 알림 목록을 보여주고, 여기서 나누기를 한다.
- **내 소비 탭:**
  - 월 합계와 카테고리 비율 막대를 보여준다.
  - 목록과 달력을 전환할 수 있다. 달력은 날짜별 금액을 보여주고, 정리할 건이 남은 날에 점을 찍는다.
  - 취소된 건은 합계에서 빼고 취소선으로 표시한다.
- **모임장부 탭:** 모임 칩으로 거르고, 월 합계와 목록·달력을 보여준다.
- **설정:** 분석할 앱, 문자 수집, 내 계좌, 카테고리, 모임, 정리 알림 시각, AI 월 한도와 이번 달 사용량, 숨김 처리된 건 보기, 수집 상태(마지막 수집 시각, 업로드 대기 건수)를 둔다.
- **수집 이상 배너:** 알림 접근 권한이 꺼졌거나, 24시간 넘게 수집이 없으면 상단에 배너를 띄운다.

## 10. 앱 구현 원칙

- **구조:** `frontend-structure` 스킬의 페이지 단위 응집 + Atomic Design 기준을 따른다.
- **서버 상태:** 모두 TanStack Query로 다룬다(`frontend-data-fetching`). 결정 동작은 낙관적 업데이트로 즉시 반영하고, 실패하면 되돌린다.
- **상태 위치:** `frontend-state-management` 기준으로 정한다. 서버 데이터는 Query에, 선택 모드나 시트 열림 같은 화면 상태는 지역 상태에 둔다. 전역 스토어는 꼭 필요한 경우에만 쓴다.
- **리뷰:** 기능 단위마다 `frontend-review`로 리뷰한다.
- **라우팅:** Expo Router를 쓴다.
- **스타일:** `designs/look-and-feel.md`의 토큰을 TS 상수로 옮겨 쓰고, 다크 모드를 지원한다.

## 11. 오류 처리

| 상황 | 처리 |
|---|---|
| 알림 접근 권한 꺼짐 | 앱 진입 시 확인해서 배너와 설정 이동 버튼을 보여준다 |
| 수집이 조용히 멈춤 | 마지막 수집 후 24시간이 지나면 배너를 띄우고, 배터리 최적화 예외를 안내한다 |
| 업로드 실패 | 로컬 대기열에 두고 WorkManager 백오프로 재시도한다. 설정에 대기 건수를 표시한다 |
| 중복 업로드 | `dedupe_key` unique 제약으로 무시한다 |
| 해석 예외 | 알림 단위로 격리하고 3회 재시도한 뒤 `parse_failed`로 처리한다 |
| AI 실패·한도 초과·스키마 불일치 | AI 없이 진행하고 `needs_review`를 표시한다 |
| 배치 중단 | 10분이 지난 `running`은 무시하고 새로 시작한다. 처리 완료는 알림 단위로 기록되므로 이어서 처리된다 |
| 푸시 실패 | 기록만 남긴다 |
| 세션 만료 | Supabase 클라이언트가 자동으로 갱신한다. 네이티브 업로드에 401이 나면 대기열을 유지한 채 앱 재로그인을 기다린다 |

**민감 정보:**
- 원문은 RLS로 본인만 접근할 수 있다.
- Edge Function 로그에 원문을 출력하지 않는다.
- AI에는 알림 문구만 보낸다.
- API 키는 Supabase secrets에만 둔다.

## 12. 테스트

| 대상 | 방법 |
|---|---|
| `packages/core` 해석 규칙 | 실제 알림 문구 샘플(`fixtures/`)과 기대 결과를 비교하는 테이블 테스트. TDD로 진행 |
| 묶기·취소·자동숨김 | 시나리오 테스트: 3개 알림이 같은 결제 / 같은 금액 연속 결제(같은 앱) / 늦게 도착한 알림 / 승인취소 매칭·미매칭 / 내 계좌 이체 / 입금 / 같은 금액 후보가 2개 |
| 카테고리 키 정규화 | 단위 테스트 |
| DB·RLS | 로컬 Supabase에서 마이그레이션을 적용하고, 다른 사용자 접근이 차단되는지 확인. 나누기·합치기 RPC 테스트 |
| `organize` 통합 | 로컬 Supabase + AI 클라이언트 목으로 배치 전체 흐름과 잠금을 검증 |
| 앱 | Jest + React Native Testing Library로 핵심 흐름 검증: 밀어서 처리, 여러 건 처리, 상세 시트 결정 변경, 정리하기 버튼 상태 |
| Kotlin 모듈 | `dedupe_key`, 앱 필터 단위 테스트. 실제 폰 확인 체크리스트(`apps/mobile/modules/notification-capture/CHECKLIST.md`) |

**운영 첫 1주:** 실제 알림 원문을 모아 앱별 규칙과 fixture를 보강한다. 잘못 묶인 사례(사용자가 나누기·합치기를 한 건)를 수집해 묶기 기준을 조정한다.
