import type { AiClient, AiParseItem, AiParseOutput, AiUsage } from '../ai/types.ts';
import { merchantKey } from '../merchantKey.ts';
import { parseNotification, type ParsedEvent, type ParseResult, type RawNotification } from '../parse/parseNotification.ts';
import type { EventKind } from '../types.ts';
import { autoHideReason, type AutoHiddenReason } from './autoHide.ts';
import { matchCancel } from './cancel.ts';
import { findGroup, type ReviewReason, type TxSnapshot, type TxStatus } from './group.ts';

export interface PendingRaw extends RawNotification {
  attempts: number;
}

export interface TxCreate {
  kind: EventKind;
  amount: number | null;
  merchant: string | null;
  occurredAt: string;
  status: TxStatus;
  autoHiddenReason: AutoHiddenReason | null;
  categoryId: string | null;
  needsReview: boolean;
  reviewReason: ReviewReason | null;
}

export type TxPatch = Partial<Pick<TxCreate, 'merchant' | 'categoryId' | 'needsReview' | 'reviewReason'>> & { cancelledAt?: string };

export interface OrganizeRepository {
  fetchUnprocessed(limit: number): Promise<PendingRaw[]>;
  fetchRecentTransactions(sinceIso: string): Promise<TxSnapshot[]>;
  fetchMyAccountLast4s(): Promise<string[]>;
  fetchCategories(): Promise<{ id: string; name: string }[]>;
  fetchMerchantMemory(keys: string[]): Promise<Map<string, string>>;
  createTransaction(t: TxCreate): Promise<string>;
  updateTransaction(id: string, patch: TxPatch): Promise<void>;
  saveParsedEvent(e: ParsedEvent, transactionId: string | null): Promise<void>;
  markProcessed(rawIds: string[]): Promise<void>;
  incrementAttempts(rawIds: string[]): Promise<void>;
}

export interface OrganizeOptions {
  now: string;
  ai: AiClient | null;
  aiAllowed: boolean;
  batchLimit?: number;
}

export interface OrganizeResult {
  processed: number;
  failed: number;
  aiCalls: number;
  aiUsage: AiUsage;
  /** AI 호출이 실패한 이유 ("이름: 메시지"). 프롬프트·알림 문구는 담지 않는다 */
  aiError: string | null;
}

export const MAX_PARSE_ATTEMPTS = 3;
const DEFAULT_BATCH_LIMIT = 500;
const LOOKBACK_MS = 8 * 24 * 60 * 60 * 1000;

interface Item {
  raw: PendingRaw;
  result: ParseResult;
}

interface Context {
  repo: OrganizeRepository;
  txs: TxSnapshot[];
  myLast4s: string[];
  memory: Map<string, string>;
  aiCategoryByRaw: Map<string, string>;
}

const needsCategory = (e: ParsedEvent) => e.kind === 'payment' && e.merchant !== null;

function applyAiOutput(item: Item, output: AiParseOutput) {
  const { event } = item.result;
  if (!item.result.needsAi) return;
  if (output.kind === 'unknown') {
    // AI가 결제 알림이 아니라고 판단 (광고 문구 속 금액 등): 결제 건을 만들지 않는다
    item.result.isFinancial = false;
    event.kind = 'unknown';
    return;
  }
  if (event.kind === 'unknown' && output.kind) event.kind = output.kind;
  if (event.merchant === null && output.merchant) {
    event.merchant = output.merchant;
    event.parser = 'ai';
  }
  if (event.accountLast4 === null && output.accountLast4) event.accountLast4 = output.accountLast4;
}

async function enrichWithAi(items: Item[], memory: Map<string, string>, categories: { id: string; name: string }[], ai: AiClient) {
  const requests: AiParseItem[] = items
    .map(({ raw, result }) => ({
      id: raw.id,
      text: raw.title ? `${raw.title}\n${raw.body}` : raw.body,
      needsParse: result.needsAi,
      needsCategory: result.needsAi || (needsCategory(result.event) && !memory.has(merchantKey(result.event.merchant!))),
    }))
    .filter((r) => r.needsParse || r.needsCategory);
  if (requests.length === 0) return null;

  const { outputs, usage } = await ai.analyze(requests, categories.map((c) => c.name));
  const categoryByRaw = new Map<string, string>();
  for (const output of outputs) {
    const item = items.find((i) => i.raw.id === output.id);
    if (item) applyAiOutput(item, output);
    const categoryId = categories.find((c) => c.name === output.category)?.id;
    if (categoryId) categoryByRaw.set(output.id, categoryId);
  }
  return { categoryByRaw, usage };
}

function reviewReasonFor(e: ParsedEvent): ReviewReason | null {
  if (e.kind === 'unknown') return 'missing_merchant';
  if ((e.kind === 'payment' || e.kind === 'transfer_out') && e.merchant === null) return 'missing_merchant';
  return null;
}

function categoryFor(e: ParsedEvent, ctx: Context): string | null {
  if (!needsCategory(e)) return null;
  return ctx.memory.get(merchantKey(e.merchant!)) ?? ctx.aiCategoryByRaw.get(e.rawId) ?? null;
}

async function createTx(ctx: Context, e: ParsedEvent, fields: Partial<TxCreate>): Promise<TxSnapshot> {
  const hidden = autoHideReason(e.kind, e.accountLast4, ctx.myLast4s);
  const reviewReason = fields.reviewReason ?? (hidden ? null : reviewReasonFor(e));
  const create: TxCreate = {
    kind: e.kind,
    amount: e.amount,
    merchant: e.merchant,
    occurredAt: e.occurredAt,
    status: hidden ? 'auto_hidden' : 'pending',
    autoHiddenReason: hidden,
    categoryId: categoryFor(e, ctx),
    needsReview: reviewReason !== null,
    reviewReason,
    ...fields,
  };
  const id = await ctx.repo.createTransaction(create);
  const snapshot: TxSnapshot = {
    id, kind: create.kind, amount: create.amount, merchant: create.merchant, occurredAt: create.occurredAt, status: create.status,
    sourcePackages: [e.sourcePackage], cancelledAt: null, categoryId: create.categoryId, reviewReason: create.reviewReason,
  };
  ctx.txs.push(snapshot);
  return snapshot;
}

async function attachTx(ctx: Context, tx: TxSnapshot, e: ParsedEvent, ambiguous: boolean) {
  const patch: TxPatch = {};
  if (tx.merchant === null && e.merchant !== null) {
    patch.merchant = tx.merchant = e.merchant;
    if (tx.reviewReason === 'missing_merchant') {
      patch.needsReview = false;
      patch.reviewReason = tx.reviewReason = null;
    }
  }
  if (tx.categoryId === null) {
    const categoryId = categoryFor(e, ctx);
    if (categoryId) patch.categoryId = tx.categoryId = categoryId;
  }
  if (ambiguous && tx.status === 'pending') {
    patch.needsReview = true;
    patch.reviewReason = tx.reviewReason = 'ambiguous_group';
  }
  tx.sourcePackages.push(e.sourcePackage);
  if (Object.keys(patch).length > 0) await ctx.repo.updateTransaction(tx.id, patch);
}

async function processItem(ctx: Context, { result }: Item) {
  const e = result.event;
  if (!result.isFinancial) {
    await ctx.repo.saveParsedEvent(e, null);
    return;
  }
  if (e.kind === 'cancel') {
    const target = matchCancel(e, ctx.txs);
    if (target) {
      if (target.cancelledAt === null) {
        target.cancelledAt = e.occurredAt;
        await ctx.repo.updateTransaction(target.id, { cancelledAt: e.occurredAt });
      }
      await ctx.repo.saveParsedEvent(e, target.id);
    } else {
      const tx = await createTx(ctx, e, { needsReview: true, reviewReason: 'unmatched_cancel' });
      await ctx.repo.saveParsedEvent(e, tx.id);
    }
    return;
  }
  const decision = findGroup(e, ctx.txs);
  const target = decision.type === 'attach' ? ctx.txs.find((t) => t.id === decision.txId) : undefined;
  if (decision.type === 'attach' && target) {
    await attachTx(ctx, target, e, decision.ambiguous);
    await ctx.repo.saveParsedEvent(e, target.id);
  } else {
    const tx = await createTx(ctx, e, {});
    await ctx.repo.saveParsedEvent(e, tx.id);
  }
}

async function giveUp(ctx: Context, item: Item) {
  const e: ParsedEvent = { ...item.result.event, kind: 'unknown' };
  const tx = await createTx(ctx, e, { kind: 'unknown', status: 'pending', autoHiddenReason: null, needsReview: true, reviewReason: 'parse_failed' });
  try {
    // 원본 알림을 확인할 수 있도록 연결해 둔다 (실패해도 결제 건은 남긴다)
    await ctx.repo.saveParsedEvent(e, tx.id);
  } catch {
    // 이미 여러 번 실패한 알림이다. 원본 연결 없이 확인 필요로 둔다.
  }
}

export async function runOrganize(repo: OrganizeRepository, opts: OrganizeOptions): Promise<OrganizeResult> {
  const raws = await repo.fetchUnprocessed(opts.batchLimit ?? DEFAULT_BATCH_LIMIT);
  const result: OrganizeResult = { processed: 0, failed: 0, aiCalls: 0, aiUsage: { inputTokens: 0, outputTokens: 0 }, aiError: null };
  if (raws.length === 0) return result;

  const since = new Date(Date.parse(opts.now) - LOOKBACK_MS).toISOString();
  const [txs, myLast4s, categories] = await Promise.all([repo.fetchRecentTransactions(since), repo.fetchMyAccountLast4s(), repo.fetchCategories()]);

  const items: Item[] = raws
    .map((raw) => ({ raw, result: parseNotification(raw) }))
    .sort((a, b) => Date.parse(a.result.event.occurredAt) - Date.parse(b.result.event.occurredAt));

  const keys = [...new Set(items.map((i) => i.result.event).filter(needsCategory).map((e) => merchantKey(e.merchant!)))];
  const memory = await repo.fetchMerchantMemory(keys);

  let aiCategoryByRaw = new Map<string, string>();
  if (opts.ai && opts.aiAllowed) {
    try {
      const enriched = await enrichWithAi(items, memory, categories, opts.ai);
      if (enriched) {
        aiCategoryByRaw = enriched.categoryByRaw;
        result.aiCalls = 1;
        result.aiUsage = enriched.usage;
      }
    } catch (error) {
      // AI 실패는 배치를 멈추지 않는다. AI가 필요한 건은 다음 실행에서 다시 시도하고, 이유는 실행 기록에 남긴다.
      result.aiError = error instanceof Error ? `${error.name}: ${error.message}` : 'unknown AI error';
    }
  }

  const ctx: Context = { repo, txs, myLast4s, memory, aiCategoryByRaw };
  const retryIds: string[] = [];

  // 알림 하나를 끝낼 때마다 처리 완료를 남긴다. 배치가 중간에 죽어도 다음 실행이 같은 알림을 다시 만들지 않는다.
  for (const item of items) {
    // AI가 필요한데 AI가 실패했으면 다음 실행까지 미룬다. 마지막 시도에서는 AI 없이 확인 필요로 남긴다.
    const waitForAi = result.aiError !== null && item.result.needsAi && item.raw.attempts + 1 < MAX_PARSE_ATTEMPTS;
    if (waitForAi) {
      retryIds.push(item.raw.id);
      continue;
    }
    try {
      await processItem(ctx, item);
      await repo.markProcessed([item.raw.id]);
      result.processed += 1;
    } catch {
      result.failed += 1;
      if (item.raw.attempts + 1 >= MAX_PARSE_ATTEMPTS) {
        try {
          await giveUp(ctx, item);
          await repo.markProcessed([item.raw.id]);
        } catch {
          retryIds.push(item.raw.id);
        }
      } else {
        retryIds.push(item.raw.id);
      }
    }
  }

  if (retryIds.length > 0) await repo.incrementAttempts(retryIds);
  return result;
}
