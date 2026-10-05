import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { OrganizeRepository, ParsedEvent, PendingRaw, TxCreate, TxPatch, TxSnapshot } from './core/index.ts';
import { MAX_PARSE_ATTEMPTS } from './core/index.ts';

function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export function createSupabaseRepo(db: SupabaseClient, userId: string): OrganizeRepository {
  return {
    async fetchUnprocessed(limit) {
      const rows = check(await db.from('raw_notifications')
        .select('id, source_package, title, body, posted_at, attempts')
        .eq('user_id', userId).is('processed_at', null).lt('attempts', MAX_PARSE_ATTEMPTS)
        .order('posted_at').limit(limit));
      return (rows ?? []).map((r): PendingRaw => ({
        id: r.id, sourcePackage: r.source_package, title: r.title, body: r.body, postedAt: r.posted_at, attempts: r.attempts,
      }));
    },

    async fetchRecentTransactions(sinceIso) {
      const rows = check(await db.from('transactions')
        .select('id, kind, amount, merchant, occurred_at, status, cancelled_at, category_id, review_reason, parsed_events(source_package)')
        .eq('user_id', userId).gte('occurred_at', sinceIso));
      return (rows ?? []).map((r): TxSnapshot => ({
        id: r.id, kind: r.kind, amount: r.amount, merchant: r.merchant, occurredAt: r.occurred_at, status: r.status,
        cancelledAt: r.cancelled_at, categoryId: r.category_id, reviewReason: r.review_reason,
        sourcePackages: (r.parsed_events as { source_package: string }[]).map((e) => e.source_package),
      }));
    },

    async fetchMyAccountLast4s() {
      const rows = check(await db.from('my_accounts').select('last4').eq('user_id', userId));
      return (rows ?? []).map((r) => r.last4);
    },

    async fetchCategories() {
      const rows = check(await db.from('categories').select('id, name').eq('user_id', userId).eq('archived', false));
      return rows ?? [];
    },

    async fetchMerchantMemory(keys) {
      if (keys.length === 0) return new Map();
      const rows = check(await db.from('merchant_memory').select('merchant_key, category_id').eq('user_id', userId).in('merchant_key', keys));
      return new Map((rows ?? []).map((r) => [r.merchant_key, r.category_id]));
    },

    async createTransaction(t: TxCreate) {
      const row = check(await db.from('transactions').insert({
        user_id: userId, kind: t.kind, amount: t.amount, merchant: t.merchant, occurred_at: t.occurredAt, status: t.status,
        auto_hidden_reason: t.autoHiddenReason, category_id: t.categoryId, needs_review: t.needsReview, review_reason: t.reviewReason,
      }).select('id').single());
      if (!row) throw new Error("transaction insert returned no row");
      return row.id;
    },

    async updateTransaction(id: string, patch: TxPatch) {
      const row: Record<string, unknown> = {};
      if ('merchant' in patch) row.merchant = patch.merchant;
      if ('categoryId' in patch) row.category_id = patch.categoryId;
      if ('needsReview' in patch) row.needs_review = patch.needsReview;
      if ('reviewReason' in patch) row.review_reason = patch.reviewReason;
      if ('cancelledAt' in patch) row.cancelled_at = patch.cancelledAt;
      check(await db.from('transactions').update(row).eq('id', id).eq('user_id', userId));
    },

    async saveParsedEvent(e: ParsedEvent, transactionId: string | null) {
      check(await db.from('parsed_events').upsert({
        user_id: userId, raw_id: e.rawId, source_package: e.sourcePackage, kind: e.kind, amount: e.amount, merchant: e.merchant,
        account_last4: e.accountLast4, occurred_at: e.occurredAt, parser: e.parser, transaction_id: transactionId,
      }, { onConflict: 'raw_id' }));
    },

    async markProcessed(rawIds) {
      check(await db.from('raw_notifications').update({ processed_at: new Date().toISOString() }).eq('user_id', userId).in('id', rawIds));
    },

    async incrementAttempts(rawIds) {
      check(await db.rpc('increment_raw_attempts', { p_ids: rawIds }));
    },
  };
}
