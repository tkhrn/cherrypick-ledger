import type { ParsedEvent } from '../../src/parse/parseNotification.ts';
import type { OrganizeRepository, PendingRaw, TxCreate, TxPatch } from '../../src/organize/runOrganize.ts';
import type { TxSnapshot } from '../../src/organize/group.ts';

export interface StoredTx extends TxCreate {
  id: string;
  cancelledAt: string | null;
}

export class MemoryRepo implements OrganizeRepository {
  raws: PendingRaw[] = [];
  txs: StoredTx[] = [];
  events: { event: ParsedEvent; transactionId: string | null }[] = [];
  processed: string[] = [];
  myLast4s: string[] = [];
  categories = [{ id: 'c-food', name: '식비' }, { id: 'c-cafe', name: '카페·간식' }];
  memory = new Map<string, string>();
  failSaveFor = new Set<string>();
  log: string[] = [];
  /** true면 failSaveFor의 저장 실패는 한 번만 일어난다 */
  failSaveOnce = false;
  private seq = 0;

  async fetchUnprocessed() {
    return this.raws.filter((r) => !this.processed.includes(r.id));
  }
  async fetchRecentTransactions(): Promise<TxSnapshot[]> {
    return this.txs.map((t) => ({
      id: t.id, kind: t.kind, amount: t.amount, merchant: t.merchant, occurredAt: t.occurredAt, status: t.status,
      cancelledAt: t.cancelledAt, categoryId: t.categoryId, reviewReason: t.reviewReason,
      sourcePackages: this.events.filter((e) => e.transactionId === t.id).map((e) => e.event.sourcePackage),
    }));
  }
  async fetchMyAccountLast4s() {
    return this.myLast4s;
  }
  async fetchCategories() {
    return this.categories;
  }
  async fetchMerchantMemory(keys: string[]) {
    return new Map([...this.memory].filter(([k]) => keys.includes(k)));
  }
  async createTransaction(t: TxCreate) {
    const id = `t${++this.seq}`;
    this.log.push(`create:${id}`);
    this.txs.push({ ...t, id, cancelledAt: null });
    return id;
  }
  async updateTransaction(id: string, patch: TxPatch) {
    const tx = this.txs.find((t) => t.id === id);
    if (tx) Object.assign(tx, patch);
  }
  async saveParsedEvent(event: ParsedEvent, transactionId: string | null) {
    if (this.failSaveFor.has(event.rawId)) {
      if (this.failSaveOnce) this.failSaveFor.delete(event.rawId);
      throw new Error('boom');
    }
    this.events.push({ event, transactionId });
  }
  async markProcessed(ids: string[]) {
    this.log.push(`processed:${ids.join(',')}`);
    this.processed.push(...ids);
  }
  async incrementAttempts(ids: string[]) {
    for (const r of this.raws) if (ids.includes(r.id)) r.attempts += 1;
  }
}
