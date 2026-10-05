# cherrypick-ledger 1단계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 안드로이드 금융 알림을 수집·정리해 사용자가 승인한 소비만 기록하는 가계부 1단계를 만든다.

**Architecture:** pnpm 모노레포. `packages/core`(순수 TS)가 해석·묶기·취소·자동숨김·AI 클라이언트·정리 오케스트레이터를 담고, `supabase/functions`(Deno)가 이를 import해 `ingest`/`organize`/`daily-digest`를 제공한다. `apps/mobile`(Expo)은 Supabase에 직접 읽고 쓰며, 로컬 Expo 모듈(Kotlin)이 알림·문자를 수집해 기기 키로 `ingest`에 올린다.

**Tech Stack:** pnpm workspaces, TypeScript 5, Vitest, Supabase CLI(로컬 Docker 스택, Postgres 17, pgTAP, pg_cron, pg_net), Deno(Edge Functions), Expo SDK(최신) + expo-router + TanStack Query + supabase-js + react-native-gesture-handler/reanimated + @gorhom/bottom-sheet + @tabler/icons-react-native, Kotlin(Expo Modules API, WorkManager), Gemini API.

**Spec:** `docs/superpowers/specs/2026-10-05-cherrypick-ledger-design.md`, 디자인: `designs/*.md`

## Global Constraints

- 시간 기준 Asia/Seoul. DB는 `timestamptz`, 하루 경계는 KST 0시.
- 금액은 정수(원). 표시: 천 단위 쉼표 + `원`.
- 묶기 조건: 같은 `kind`, 같은 `amount`, `|Δt| ≤ 10분`, 후보 묶음에 같은 `source_package` 없음.
- 승인취소 매칭 창: 7일. 배치 잠금 만료: 10분. 해석 재시도: 3회.
- AI: Gemini, 모델명 `AI_MODEL` env, 키 `GEMINI_API_KEY` secret, 월 호출 한도 기본 300, 배치당 최대 1회 호출.
- 정리 배치 cron: 매 3시간 정각(KST 0,3,…,21시). 정리 알림: 기본 21:00, `pending` ≥1일 때만.
- 기본 카테고리 9개와 색 토큰은 스펙 §6 표 그대로.
- 모든 사용자 테이블 RLS `user_id = auth.uid()`. service role 사용 코드는 항상 `user_id`로 필터.
- 원문(`raw_notifications.title/body`)을 로그에 출력하지 않는다.
- 앱 UI 문구는 designs/screens.md 문구를 그대로 쓴다. 색·간격은 designs/look-and-feel.md 토큰만 쓴다.
- 앱 코드는 tkhrn-fe 스킬(structure, data-fetching, state-management, component, convention)을 따르고 기능 단위로 frontend-review를 돌린다.
- 모든 작업은 커밋 후 `main`에 바로 push.

## Review Focus

1. **같은 앱에서 같은 금액 알림이 10분 안에 두 번** → 결제 2건으로 분리돼야 한다 (Task 4 테스트).
2. **알림 앱이 같은 알림을 갱신해 다시 게시**(같은 posted_at·본문) → 원문 1건만 저장돼야 한다 (Task 7 `ingest` 테스트, dedupe_key).
3. **금액 표기 변형**(`1,234,567원`, `12000원`, `KRW 12,000`, `12,000 원`, 누적금액·잔액이 같이 있는 본문) → 결제 금액만 뽑아야 하고 누적/잔액을 금액으로 착각하면 안 된다 (Task 2 테스트).
4. **AI 응답이 잘린 JSON·스키마 위반·429** → 배치는 계속되고 해당 건은 `needs_review` (Task 5·6 테스트).
5. **이미 사용자가 결정한 건에 늦은 알림이 붙음** → 상태가 바뀌지 않아야 한다 (Task 4 테스트).

---

## File Structure

```
package.json, pnpm-workspace.yaml, .npmrc, .gitignore, tsconfig.base.json, README.md
packages/core/
  package.json, tsconfig.json, vitest.config.ts
  src/index.ts                      # 공개 export
  src/types.ts                      # 도메인 타입
  src/parse/amount.ts               # 금액 추출
  src/parse/kind.ts                 # 종류 판정
  src/parse/account.ts              # 계좌 끝4자리
  src/parse/occurredAt.ts           # 본문 시각 → ISO
  src/parse/merchant.ts             # 공통 가게명 휴리스틱
  src/parse/rules.ts                # 앱별 규칙 레지스트리
  src/parse/parseNotification.ts    # 해석 진입점
  src/merchantKey.ts                # 가게명 정규화
  src/organize/group.ts             # 묶기
  src/organize/autoHide.ts          # 자동숨김 판정
  src/organize/cancel.ts            # 취소 매칭
  src/organize/runOrganize.ts       # 오케스트레이터 (Repository 포트)
  src/ai/types.ts, src/ai/prompt.ts, src/ai/validate.ts, src/ai/gemini.ts
  test/**/*.test.ts, test/fixtures/notifications.ts
supabase/
  config.toml
  migrations/0001_schema.sql        # 테이블·인덱스·RLS
  migrations/0002_functions.sql     # RPC: seed, register_device, decide, split, merge, run lock
  migrations/0003_cron.sql          # pg_cron 스케줄
  tests/database/*.test.sql         # pgTAP
  functions/deno.json               # import map (@core → packages/core/src)
  functions/_shared/supabaseRepo.ts # OrganizeRepository 구현
  functions/_shared/http.ts
  functions/ingest/index.ts
  functions/organize/index.ts
  functions/daily-digest/index.ts
  functions/tests/*.test.ts         # deno test (로컬 스택 대상)
apps/mobile/
  app.json, eas.json, package.json, tsconfig.json
  app/_layout.tsx, app/(auth)/..., app/onboarding/..., app/(tabs)/{index,spending,groups,settings}.tsx
  src/shared/{theme,supabase,query,format}/...
  src/pages/<page>/{components,hooks}/...
  src/shared/components/{atoms,molecules,organisms}/...
  modules/notification-capture/     # Kotlin Expo 모듈
```

---

### Task 1: 모노레포 골격

**Files:** Create root `package.json`, `pnpm-workspace.yaml`, `.npmrc`(`node-linker=hoisted`), `.gitignore`, `tsconfig.base.json`, `packages/core/{package.json,tsconfig.json,vitest.config.ts,src/index.ts}`, `packages/core/test/smoke.test.ts`

- [ ] Step 1: 루트 파일 작성. `pnpm-workspace.yaml`: `packages: [apps/*, packages/*]`. 루트 scripts: `test: pnpm -r test`, `typecheck: pnpm -r typecheck`.
- [ ] Step 2: core `tsconfig.json`: `moduleResolution: bundler`, `allowImportingTsExtensions: true`, `noEmit: true`, `strict: true`. 모든 내부 import는 `.ts` 확장자 포함(Deno 호환).
- [ ] Step 3: `smoke.test.ts`에서 `import { VERSION } from '../src/index.ts'` → `expect(VERSION).toBe('0.1.0')`. 실패 확인 후 export 추가, 통과 확인.
- [ ] Step 4: `pnpm install && pnpm -C packages/core test` 통과. 커밋·push `chore: 모노레포와 core 패키지 골격`.

### Task 2: 공통 해석 규칙 (금액·종류·계좌·시각·가게명)

**Files:** `packages/core/src/types.ts`, `src/parse/{amount,kind,account,occurredAt,merchant}.ts`, tests `test/parse/*.test.ts`

**Interfaces (Produces):**
```ts
export type EventKind = 'payment' | 'transfer_out' | 'cancel' | 'deposit' | 'unknown';
export function extractAmount(text: string): number | null;
export function detectKind(text: string): EventKind | null;
export function extractAccountLast4(text: string): string | null;
export function extractOccurredAt(text: string, postedAt: string): string; // ISO with +09:00
export function guessMerchant(text: string, kind: EventKind): string | null;
```

- [ ] Step 1: `amount.test.ts` 테이블 테스트:
  - `'12,000원 승인'` → 12000; `'12000원'` → 12000; `'1,234,567원'` → 1234567; `'12,000 원'` → 12000; `'KRW 12,000'` → 12000
  - `'승인 5,600원 누적 1,230,000원'` → 5600 (누적·잔액·한도 앞뒤 금액 제외)
  - `'출금 30,000원 잔액 120,500원'` → 30000
  - `'이벤트 참여하세요'` → null
- [ ] Step 2: 실패 확인 → 구현: 모든 `금액+원`/`KRW 금액` 후보를 위치와 함께 찾고, 바로 앞 6자 이내에 `누적|잔액|한도|가능|포인트`가 있는 후보 제외, 첫 후보 반환.
- [ ] Step 3: `kind.test.ts`: `'승인취소'`→cancel, `'결제 취소'`→cancel, `'입금'`→deposit, `'출금'`/`'이체'`/`'송금'`/`'보냈어요'`→transfer_out, `'승인'`/`'결제'`/`'사용'`/`'결제했어요'`→payment, 무관 문구→null. 우선순위 cancel > deposit > transfer_out > payment. 구현·통과.
- [ ] Step 4: `account.test.ts`: `'신한 110-***-123456 출금'`→`'3456'`, `'국민(1234)'`→`'1234'`, `'계좌 ****5678로'`→`'5678'`, 카드 `'신한카드(1234)승인'`→`'1234'`, 없음→null. 구현·통과.
- [ ] Step 5: `occurredAt.test.ts`: postedAt `2026-10-05T10:45:00Z`(KST 19:45). 본문 `'10/05 19:42'`→`2026-10-05T19:42:00+09:00`; `'19:42'`→같은 날 19:42; 본문 시각이 postedAt보다 6시간 이상 미래면 전날로; 시각 없음→postedAt의 KST 표기. 구현·통과.
- [ ] Step 6: `merchant.test.ts`: 대표 형식 6종(카드 SMS 줄바꿈 마지막 줄 가게명, `'OOO에서 N원 결제'`, `'N원 OOO 승인'`, 이체 `'OOO님에게 N원 보냈어요'`, `'받는분 OOO'`)에서 가게/받는사람 추출, 못 찾으면 null. 구현·통과.
- [ ] Step 7: 커밋·push `feat(core): 공통 해석 규칙`.

### Task 3: 앱별 규칙 레지스트리 + parseNotification + merchantKey

**Files:** `src/parse/rules.ts`, `src/parse/parseNotification.ts`, `src/merchantKey.ts`, `test/fixtures/notifications.ts`, `test/parse/parseNotification.test.ts`, `test/merchantKey.test.ts`

**Interfaces:**
```ts
export interface RawNotification { id: string; sourcePackage: string; title: string; body: string; postedAt: string }
export interface ParsedEvent { rawId: string; sourcePackage: string; kind: EventKind; amount: number | null;
  merchant: string | null; accountLast4: string | null; occurredAt: string; parser: string }
export interface ParseResult { event: ParsedEvent; isFinancial: boolean; needsAi: boolean }
export interface AppRule { id: string; packages: string[]; parse(n: RawNotification): Partial<Pick<ParsedEvent,'kind'|'amount'|'merchant'|'accountLast4'|'occurredAt'>> | null }
export const APP_RULES: AppRule[];
export function parseNotification(n: RawNotification, rules?: AppRule[]): ParseResult;
export function merchantKey(name: string): string;
```

- [ ] Step 1: fixture 10건 이상(카드 SMS, 은행 출금 SMS, 토스 결제·송금 푸시, 카카오페이, 승인취소, 입금, 광고 푸시)과 기대 ParseResult 작성. 이 fixture는 운영 1주차에 실제 문구로 교체·보강한다.
- [ ] Step 2: `parseNotification.test.ts`: fixture 전수 테이블 테스트 + 규칙 우선 적용(앱 규칙이 merchant를 주면 `parser = 'rule:<id>'`), 규칙 실패 시 generic, `isFinancial=false`(금액·종류 둘 다 없음), `needsAi = isFinancial && kind∈{payment,transfer_out} && merchant==null`, 금액은 있는데 kind가 없으면 `kind='unknown'`, `needsAi=true`.
- [ ] Step 3: 구현(제목+본문 결합 텍스트 `title + '\n' + body` 사용) → 통과.
- [ ] Step 4: `merchantKey.test.ts`: `'스타벅스코리아 강남점'`→`'스타벅스'`, `'(주)우아한형제들'`→`'우아한형제들'`, `'GS25 역삼 2호점'`→`'gs25'`, 공백·대소문자 정규화. 구현·통과.
- [ ] Step 5: 커밋·push `feat(core): 알림 해석 진입점과 가게명 정규화`.

### Task 4: 묶기·자동숨김·취소 매칭 (순수 함수)

**Files:** `src/organize/{group,autoHide,cancel}.ts`, tests `test/organize/*.test.ts`

**Interfaces:**
```ts
export type TxStatus = 'pending' | 'mine' | 'group' | 'ignored' | 'auto_hidden';
export interface TxSnapshot { id: string; kind: EventKind; amount: number | null; merchant: string | null;
  occurredAt: string; status: TxStatus; sourcePackages: string[]; cancelledAt: string | null }
export type GroupDecision = { type: 'attach'; txId: string; ambiguous: boolean } | { type: 'create' };
export function findGroup(e: ParsedEvent, txs: TxSnapshot[]): GroupDecision;
export function autoHideReason(kind: EventKind, accountLast4: string | null, myLast4s: string[]): 'own_transfer' | 'deposit' | null;
export function matchCancel(e: ParsedEvent, txs: TxSnapshot[]): TxSnapshot | null;
```

- [ ] Step 1: `group.test.ts` 시나리오:
  - 카드앱·sms·토스 3건(같은 금액, 1분 간격) 순차 처리 → 첫 건 create, 나머지 attach 같은 tx
  - 같은 앱 같은 금액 2분 간격 2건 → 둘 다 create (Review Focus 1)
  - 11분 차이 → create
  - kind 다름(payment vs transfer_out) → create
  - 후보 2개 → 가까운 쪽 attach, `ambiguous=true`
  - 이미 `status='mine'`인 tx에도 attach 가능(상태 변경은 호출자 책임 없음 — 결정 결과에 status 변경 정보 없음) (Review Focus 5)
  - `amount=null` 이벤트 → 항상 create
- [ ] Step 2: 구현·통과.
- [ ] Step 3: `autoHide.test.ts`: transfer_out + 내 계좌 → own_transfer; transfer_out + 남 계좌/null → null; deposit → deposit; payment → null. 구현·통과.
- [ ] Step 4: `cancel.test.ts`: 같은 금액 payment 7일 내 → 매칭(merchant 일치 우선, 그다음 최신); 8일 전 → null; 이미 cancelledAt 있는 것 제외; kind≠payment 제외. 구현·통과.
- [ ] Step 5: 커밋·push `feat(core): 묶기, 자동숨김, 취소 매칭`.

### Task 5: AI 클라이언트 (Gemini) + 프롬프트 + 응답 검증

**Files:** `src/ai/{types,prompt,validate,gemini}.ts`, tests `test/ai/*.test.ts`

**Interfaces:**
```ts
export interface AiParseItem { id: string; text: string; needsParse: boolean; needsCategory: boolean }
export interface AiParseOutput { id: string; kind?: EventKind; merchant?: string | null; accountLast4?: string | null; category?: string | null }
export interface AiUsage { inputTokens: number; outputTokens: number }
export interface AiClient { analyze(items: AiParseItem[], categoryNames: string[]): Promise<{ outputs: AiParseOutput[]; usage: AiUsage }> }
export class AiRateLimitError extends Error {}
export function buildPrompt(items: AiParseItem[], categoryNames: string[]): string;
export const AI_RESPONSE_SCHEMA: object; // Gemini responseSchema
export function validateAiOutputs(raw: unknown, ids: string[], categoryNames: string[]): AiParseOutput[]; // 모르는 id·잘못된 kind·목록 밖 카테고리 제거
export function createGeminiClient(opts: { apiKey: string; model: string; fetchFn?: typeof fetch }): AiClient;
```

- [ ] Step 1: `validate.test.ts`: 정상 배열 통과; 모르는 id 제거; kind 오타 제거(필드만); 카테고리 목록 밖이면 null; 배열 아님 → `[]`; merchant 50자 초과 잘라냄.
- [ ] Step 2: `gemini.test.ts`(fetch 목): 요청 URL `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, 헤더 `x-goog-api-key`, body에 `generationConfig.responseMimeType='application/json'`·`responseSchema`; 응답 `candidates[0].content.parts[0].text` JSON 파싱 → validate; `usageMetadata.promptTokenCount/candidatesTokenCount` → usage; HTTP 429 → `AiRateLimitError`; 깨진 JSON → `outputs: []` (Review Focus 4); 10초 타임아웃(AbortController).
- [ ] Step 3: 구현·통과. 프롬프트는 한국어, "알림 문구에서 결제 정보를 추출, 주어진 카테고리 중 하나만" 지시, 사용자 식별 정보 없음.
- [ ] Step 4: 커밋·push `feat(core): Gemini AI 클라이언트`.

### Task 6: 정리 오케스트레이터 runOrganize

**Files:** `src/organize/runOrganize.ts`, `test/organize/runOrganize.test.ts`, `test/organize/memoryRepo.ts`

**Interfaces:**
```ts
export interface PendingRaw extends RawNotification { attempts: number }
export interface TxCreate { kind: EventKind; amount: number | null; merchant: string | null; occurredAt: string;
  status: TxStatus; autoHiddenReason: 'own_transfer'|'deposit'|null; categoryId: string | null;
  needsReview: boolean; reviewReason: ReviewReason | null }
export type ReviewReason = 'ambiguous_group' | 'missing_merchant' | 'unmatched_cancel' | 'parse_failed';
export interface OrganizeRepository {
  fetchUnprocessed(limit: number): Promise<PendingRaw[]>;
  fetchRecentTransactions(sinceIso: string): Promise<TxSnapshot[]>;
  fetchMyAccountLast4s(): Promise<string[]>;
  fetchCategories(): Promise<{ id: string; name: string }[]>;
  fetchMerchantMemory(keys: string[]): Promise<Map<string, string>>; // key → categoryId
  createTransaction(t: TxCreate): Promise<string>;
  updateTransaction(id: string, patch: Partial<TxCreate> & { cancelledAt?: string }): Promise<void>;
  saveParsedEvent(e: ParsedEvent, transactionId: string | null): Promise<void>;
  markProcessed(rawIds: string[]): Promise<void>;
  incrementAttempts(rawIds: string[]): Promise<void>;
}
export interface OrganizeOptions { now: string; ai: AiClient | null; aiAllowed: boolean; batchLimit?: number }
export interface OrganizeResult { processed: number; failed: number; aiCalls: number; aiUsage: AiUsage }
export function runOrganize(repo: OrganizeRepository, opts: OrganizeOptions): Promise<OrganizeResult>;
```

동작은 스펙 §7 단계 1~8 그대로. 대표값 갱신: attach 시 tx.merchant가 null이고 이벤트에 merchant가 있으면 채움(우선순위 rule:<id> > ai > rule:generic).

- [ ] Step 1: in-memory repo 작성(배열 기반, 테스트 전용).
- [ ] Step 2: 테스트:
  - 3개 알림 같은 결제 → tx 1개, parsed_events 3개 모두 같은 txId, 3개 processed
  - 광고 알림 → tx 없음, parsed_event(kind unknown, txId null) 저장, processed
  - 내 계좌 이체 → tx status auto_hidden/own_transfer
  - 입금 → auto_hidden/deposit
  - 취소 매칭 → 기존 tx cancelledAt 설정, 취소 이벤트는 그 tx에 연결, 새 tx 없음; 미매칭 → pending+unmatched_cancel tx
  - merchant 없음 + ai null → needs_review missing_merchant, aiCalls 0
  - ai 목 → merchant 채워지고 parser 'ai', aiCalls 1; 카테고리 추천 반영
  - merchant_memory 히트 → AI 카테고리 요청에서 제외
  - ai가 AiRateLimitError → 계속 진행, needs_review
  - repo.saveParsedEvent가 특정 raw에서 throw → 그 raw만 incrementAttempts, 나머지 processed; attempts=2였던 raw가 또 실패 → parse_failed tx 생성 + processed
  - 이미 mine인 tx에 늦은 알림 attach → status 그대로 (Review Focus 5)
- [ ] Step 3: 구현·통과. 커밋·push `feat(core): 정리 오케스트레이터`.

### Task 7: Supabase 스키마·RLS·RPC + ingest

**Files:** `supabase/config.toml`(`supabase init`), `migrations/0001_schema.sql`, `0002_functions.sql`, `tests/database/{rls,rpc}.test.sql`, `functions/deno.json`, `functions/_shared/http.ts`, `functions/ingest/index.ts`, `functions/tests/ingest.test.ts`

스키마는 스펙 §6 그대로(+`devices`). RPC(security definer, `auth.uid()` 기반):
- `seed_defaults()` — 9 카테고리 + user_settings 행 (auth.users insert 트리거 `on_auth_user_created`에서 호출)
- `register_device(p_label text) returns text` — 랜덤 32바이트 hex 키 생성, sha256 해시 저장, 평문 반환
- `decide_transaction(p_id uuid, p_status text, p_category_id uuid, p_group_id uuid, p_memo text)` — status 검증(group이면 group_id 필수), mine이면 merchant_memory upsert, decided_at 설정
- `split_transaction(p_tx uuid, p_event_ids uuid[]) returns uuid`, `merge_transactions(p_target uuid, p_source uuid)` — 대표값 재계산
- `start_organize_run(p_user uuid, p_trigger text) returns uuid` (service role 전용, 10분 잠금), `finish_organize_run(...)`
- `ai_calls_this_month(p_user uuid) returns int`

- [ ] Step 1: `npx supabase init`, `npx supabase start`(Docker). 
- [ ] Step 2: pgTAP 테스트 작성: 두 사용자 생성 → A의 transactions를 B가 select 0건; 가입 시 카테고리 9개; register_device 반환 키 길이 64, 해시만 저장; decide group without group_id → 예외; split/merge 후 parsed_events.transaction_id 이동·빈 tx 삭제; start_organize_run 두 번째 호출 null, 11분 지난 running이면 새 run.
- [ ] Step 3: `npx supabase test db` 실패 확인 → 마이그레이션 작성 → 통과.
- [ ] Step 4: `ingest` 함수: POST JSON `{ items: [{ sourcePackage, title, body, postedAt, dedupeKey }] }`(최대 100), 헤더 `x-device-key` → sha256 → devices 조회(revoked 아님) → user_id로 upsert `onConflict: 'user_id,dedupe_key', ignoreDuplicates: true` → `{ accepted, duplicates }`. 키 틀리면 401. last_seen_at 갱신. `verify_jwt = false`(config.toml).
- [ ] Step 5: deno 통합 테스트(로컬 스택): 등록 키로 2건 업로드 → accepted 2; 같은 dedupeKey 재업로드 → duplicates 1 (Review Focus 2); 잘못된 키 → 401.
- [ ] Step 6: 커밋·push `feat(supabase): 스키마, RLS, RPC, ingest`.

### Task 8: organize · daily-digest 함수 + cron

**Files:** `functions/_shared/supabaseRepo.ts`, `functions/organize/index.ts`, `functions/daily-digest/index.ts`, `migrations/0003_cron.sql`, `functions/tests/{organize,digest}.test.ts`

- [ ] Step 1: `supabaseRepo.ts`: `createSupabaseRepo(client, userId): OrganizeRepository` — 모든 쿼리 `.eq('user_id', userId)`. TxSnapshot.sourcePackages는 parsed_events join raw_notifications로 계산.
- [ ] Step 2: `organize`: 인증 두 경로 — (a) 사용자 JWT(앱 버튼) → 해당 사용자 1명, (b) `Authorization: Bearer <CRON_SECRET>`(cron) → 미처리 원문이 있는 모든 사용자. 사용자별: `start_organize_run` null이면 `already_running` → runOrganize(ai: GEMINI_API_KEY 있으면 client, aiAllowed: 이번 달 호출 < cap) → finish_organize_run. 응답 `{ status: 'succeeded'|'already_running'|'failed', processed }`.
- [ ] Step 3: `daily-digest`: CRON_SECRET 인증 → 현재 KST HH:00 == digest_time인 사용자 중 오늘(KST) pending ≥1, expo_push_token 있음 → `https://exp.host/--/api/v2/push/send` POST `{ to, title: 'cherrypick', body: '오늘 정리할 소비 N건이 있어요', data: { url: '/' } }`. 실패는 console.error(원문 없이).
- [ ] Step 4: `0003_cron.sql`: `pg_cron`·`pg_net` 확장, `vault`에 `project_url`·`cron_secret` 저장 가정, `cron.schedule('organize', '0 */3 * * *', net.http_post(...))` — DB 서버 시간은 UTC이므로 KST 0,3,…시와 UTC 정각 3시간 간격이 일치(9시간 차이는 3의 배수). digest는 `'0 * * * *'`.
- [ ] Step 5: deno 통합 테스트: ingest로 3건 넣고 organize(JWT) → transactions 1건; 동시 두 번 호출 → 하나는 already_running; digest는 Expo fetch를 `EXPO_PUSH_URL` env로 로컬 목 서버 지정해 호출 확인.
- [ ] Step 6: 커밋·push `feat(supabase): organize, daily-digest, cron`.

### Task 9: Expo 앱 골격 + 테마 + 인증

**Files:** `apps/mobile/*` (create-expo-app), `src/shared/theme/{tokens.ts,useTheme.ts}`, `src/shared/supabase/client.ts`, `src/shared/query/queryClient.ts`, `src/shared/format/{won.ts,kstDate.ts}`, `app/_layout.tsx`, `app/(auth)/sign-in.tsx`, tests `src/shared/format/*.test.ts`

- [ ] Step 1: `npx create-expo-app@latest apps/mobile -t default` → 불필요 예제 제거, expo-router 유지. 의존성: `@supabase/supabase-js @react-native-async-storage/async-storage @tanstack/react-query react-native-svg @tabler/icons-react-native @gorhom/bottom-sheet expo-notifications expo-font expo-haptics`.
- [ ] Step 2: `tokens.ts`에 look-and-feel.md 토큰 전부(light/dark), `useTheme()`는 `useColorScheme`로 선택.
- [ ] Step 3: format 테스트(jest-expo): `formatWon(1234567)`→`'1,234,567원'`; `kstDayKey('2026-10-05T16:00:00Z')`→`'2026-10-06'`; `dayLabel` 오늘/어제/`10월 3일 (금)`. 구현·통과.
- [ ] Step 4: supabase client(AsyncStorage 세션), env `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. 로그인: 이메일 OTP(매직 코드 6자리) 화면.
- [ ] Step 5: 루트 레이아웃: QueryClientProvider, GestureHandlerRootView, BottomSheetModalProvider, 세션 없으면 sign-in, 온보딩 미완료면 onboarding, 아니면 (tabs).
- [ ] Step 6: `pnpm -C apps/mobile typecheck && test` 통과. 커밋·push `feat(mobile): 앱 골격, 테마, 로그인`.

### Task 10: 네이티브 수집 모듈 (Kotlin)

**Files:** `apps/mobile/modules/notification-capture/{expo-module.config.json,index.ts,src/NotificationCaptureModule.ts}`, `android/src/main/{AndroidManifest.xml,java/.../{NotificationCaptureModule.kt,CaptureListenerService.kt,SmsReceiver.kt,CaptureStore.kt,CaptureFilter.kt,DedupeKey.kt,UploadWorker.kt}}`, `android/src/test/.../{DedupeKeyTest.kt,CaptureFilterTest.kt}`, `CHECKLIST.md`

**JS API (Produces):**
```ts
isNotificationAccessGranted(): boolean
openNotificationAccessSettings(): void
getInstalledApps(): Promise<{ packageName: string; label: string }[]>
configure(c: { ingestUrl: string; deviceKey: string; packages: string[]; smsEnabled: boolean }): void
getStatus(): { lastCapturedAt: number | null; pendingCount: number; lastUploadError: string | null }
flushNow(): void
```

- [ ] Step 1: `npx create-expo-module@latest --local notification-capture`.
- [ ] Step 2: Kotlin 단위 테스트: `DedupeKey.of(pkg, postedAtMs, title, body)` = sha256 hex(`pkg|ms|title|body`) 고정값 비교; `CaptureFilter.accept(pkg, enabled=setOf(...), smsEnabled)`; 자기 앱 패키지 거부; 빈 본문 거부.
- [ ] Step 3: 구현: ListenerService `onNotificationPosted` → extras title/text/bigText → filter → `CaptureStore`(SQLiteOpenHelper, 테이블 queue + unique dedupe_key) insert → lastCapturedAt 저장 → `UploadWorker` enqueueUniqueWork(KEEP, 네트워크 제약, 지수 백오프). SmsReceiver: `Telephony.Sms.Intents.getMessagesFromIntent` 결합 → sourcePackage `sms`. Worker: 최대 100건 POST, 2xx면 삭제, 401이면 lastUploadError=`device_revoked` 후 retry 중단, 그 외 retry. 설정은 SharedPreferences(MODE_PRIVATE).
- [ ] Step 4: Manifest: `BIND_NOTIFICATION_LISTENER_SERVICE` 서비스, `RECEIVE_SMS`, `QUERY_ALL_PACKAGES`, `INTERNET`.
- [ ] Step 5: `npx expo prebuild -p android` 후 `./gradlew :notification-capture:testDebugUnitTest`(JAVA_HOME=Android Studio jbr) 통과, `./gradlew assembleDebug` 성공.
- [ ] Step 6: CHECKLIST.md(실기기 확인 항목) 작성. 커밋·push `feat(mobile): 알림·문자 수집 네이티브 모듈`.

### Task 11: 온보딩

**Files:** `app/onboarding/{permission,sms,apps,accounts}.tsx`, `src/pages/onboarding/{components,hooks}/...`, `src/shared/api/{sourceApps,myAccounts,devices}.ts`

- [ ] Step 1: hooks(TanStack Query): `useSourceApps`, `useSaveSourceApps`, `useMyAccounts`, `useAddMyAccount`, `useRemoveMyAccount`, `useRegisterDevice`.
- [ ] Step 2: 화면 흐름 screens.md §1. 앱 선택: getInstalledApps + 금융앱 휴리스틱(`/bank|card|pay|toss|kakao|shinhan|kb|woori|hana|nh|ibk|samsung|hyundai|lotte|bc/i` 패키지명 또는 라벨 `은행|카드|페이|뱅크|증권`) 상단 정렬, 검색, 최소 1개.
- [ ] Step 3: 완료 시 register_device → `configure({ ingestUrl: SUPABASE_URL + '/functions/v1/ingest', deviceKey, packages, smsEnabled })`, user_settings.onboarded_at 저장.
- [ ] Step 4: 휴리스틱 단위 테스트. frontend-review. 커밋·push `feat(mobile): 온보딩`.

### Task 12: 정리 탭 + 상세 시트

**Files:** `app/(tabs)/index.tsx`, `src/pages/review/...`, `src/shared/components/{atoms/StatusBadge,atoms/Chip,molecules/TransactionRow,molecules/RawNotificationBox,organisms/TransactionSheet,organisms/Snackbar}.tsx`, `src/shared/api/{transactions,organize,categories,groups}.ts`

- [ ] Step 1: API 훅: `usePendingTransactions`(pending, 최신순, parsed_events·raw 포함), `useDecideTransaction`(낙관적 업데이트 + 되돌리기), `useSplitTransaction`, `useMergeTransactions`, `useOrganizeStatus`(미처리 원문 수, 최근 run, 다음 정각), `useRunOrganize`.
- [ ] Step 2: 컴포넌트 components.md 규칙대로. 스와이프(ReanimatedSwipeable, 35%, haptics), 길게 눌러 선택 모드, 날짜 묶음 헤더, OrganizeStatus 4상태, Snackbar 4초 되돌리기.
- [ ] Step 3: RNTL 테스트: 행 렌더(금액 포맷, 확인 필요 배지), OrganizeStatus 상태별 문구, DecisionPicker에서 모임장부 선택 시 모임 칩 표시.
- [ ] Step 4: frontend-review → 반영. 커밋·push `feat(mobile): 정리 탭과 상세 시트`.

### Task 13: 내 소비 탭 · 모임장부 탭 (목록·달력)

**Files:** `app/(tabs)/{spending,groups}.tsx`, `src/pages/spending/...`, `src/pages/groups/...`, `src/shared/components/organisms/{MonthCalendar,CategoryBar,MonthHeader}.tsx`, `src/shared/api/monthly.ts`, `src/shared/format/calendar.ts`

- [ ] Step 1: `calendar.ts` 테스트: `buildMonthGrid(2026, 10)` 첫 주 앞 빈칸 4개(10/1 목), 31일; `sumByDay(txs)` 취소 제외; `categoryShares` 3% 미만 기타 합침, 큰 순.
- [ ] Step 2: 구현·통과. `useMonthlyTransactions(status, month, groupId?)`.
- [ ] Step 3: 화면 screens.md §4·§5. 목록/달력 전환 기억(AsyncStorage). 달력 pending 점은 `usePendingDays(month)`.
- [ ] Step 4: frontend-review. 커밋·push `feat(mobile): 내 소비, 모임장부 탭`.

### Task 14: 설정 탭 · 푸시 등록 · 수집 이상 배너

**Files:** `app/(tabs)/settings.tsx`, `app/settings/{apps,accounts,categories,groups,hidden}.tsx`, `src/pages/settings/...`, `src/shared/hooks/{usePushRegistration,useCaptureHealth}.ts`, `src/shared/components/molecules/CaptureBanner.tsx`

- [ ] Step 1: `useCaptureHealth` 테스트: 권한 꺼짐 → `'permission_off'`; lastCapturedAt 25시간 전 → `'stale'`; 닫은 지 24시간 이내 → null.
- [ ] Step 2: 구현. 푸시: expo-notifications 권한 → `getExpoPushTokenAsync({ projectId })` → user_settings.expo_push_token. 알림 탭 시 정리 탭.
- [ ] Step 3: 설정 섹션 screens.md §6 전부(카테고리 추가 시 색 토큰 9개 중 선택, 보관; 모임 CRUD; 숨김 건 되돌리기; AI 호출 수 막대; 정리 알림 시각).
- [ ] Step 4: frontend-review. 커밋·push `feat(mobile): 설정, 푸시, 수집 배너`.

### Task 15: 배포 구성 · README · 최종 검증

**Files:** `apps/mobile/eas.json`, `apps/mobile/app.json`(extra.eas.projectId, android.package `com.tkhrn.cherrypick`), `README.md`, `.env.example` 들

- [ ] Step 1: eas.json `development`(developmentClient, apk), `preview`(apk, internal).
- [ ] Step 2: README: 로컬 개발(supabase start, functions serve, pnpm test), 원격 배포 순서(사용자 작업: `supabase login`, `supabase link --project-ref kabcpknnqmbowueoklrz`, `supabase db push`, `supabase secrets set GEMINI_API_KEY=… AI_MODEL=… CRON_SECRET=…`, vault 값 설정 SQL, `supabase functions deploy`, `eas login`, `eas build -p android --profile preview`).
- [ ] Step 3: 전체 `pnpm test`, `supabase test db`, deno 통합 테스트, `assembleDebug` 통과 확인. 최종 코드 리뷰(requesting-code-review) → 반영.
- [ ] Step 4: 커밋·push `docs: 배포 가이드`.
