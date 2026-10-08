import { describe, expect, it, vi } from 'vitest';
import { runOrganize } from '../../src/organize/runOrganize.ts';
import { AiRateLimitError, type AiClient } from '../../src/ai/types.ts';
import { MemoryRepo } from './memoryRepo.ts';

const NOW = '2026-10-05T12:00:00Z';
const raw = (id: string, sourcePackage: string, body: string, postedAt = '2026-10-05T10:45:00Z', attempts = 0) =>
  ({ id, sourcePackage, title: '', body, postedAt, attempts });

const run = (repo: MemoryRepo, ai: AiClient | null = null, aiAllowed = true) => runOrganize(repo, { now: NOW, ai, aiAllowed });

const aiReturning = (outputs: Awaited<ReturnType<AiClient['analyze']>>['outputs']): AiClient & { analyze: ReturnType<typeof vi.fn> } => ({
  analyze: vi.fn(async () => ({ outputs, usage: { inputTokens: 100, outputTokens: 20 } })),
});

describe('runOrganize', () => {
  it('groups three notifications of one payment into one transaction', async () => {
    const repo = new MemoryRepo();
    repo.raws = [
      raw('r1', 'com.card', '고기굽는집에서 20,000원 결제', '2026-10-05T10:42:00Z'),
      raw('r2', 'sms', '[Web발신]\n신한카드(1234)승인\n홍*동\n20,000원\n10/05 19:42\n고기굽는집', '2026-10-05T10:42:30Z'),
      raw('r3', 'viva.republica.toss', '고기굽는집에서 20,000원 결제했어요', '2026-10-05T10:43:00Z'),
    ];

    const result = await run(repo);

    expect(repo.txs).toHaveLength(1);
    expect(new Set(repo.events.map((e) => e.transactionId))).toEqual(new Set([repo.txs[0]?.id]));
    expect(repo.processed.sort()).toEqual(['r1', 'r2', 'r3']);
    expect(result).toMatchObject({ processed: 3, failed: 0, aiCalls: 0 });
  });

  it('stores non-financial notifications without a transaction', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('r1', 'viva.republica.toss', '이번 주 혜택을 확인하세요')];
    await run(repo);
    expect(repo.txs).toHaveLength(0);
    expect(repo.events).toEqual([expect.objectContaining({ transactionId: null })]);
    expect(repo.processed).toEqual(['r1']);
  });

  it('auto-hides transfers to my own account', async () => {
    const repo = new MemoryRepo();
    repo.myLast4s = ['3456'];
    repo.raws = [raw('r1', 'sms', '[Web발신]\n신한 10/05 19:30\n출금 30,000원\n입금계좌 국민 123-***-3456\n홍길동')];
    await run(repo);
    expect(repo.txs[0]).toMatchObject({ status: 'auto_hidden', autoHiddenReason: 'own_transfer' });
  });

  it('keeps a transfer that only shows my sending account', async () => {
    const repo = new MemoryRepo();
    repo.myLast4s = ['3456'];
    repo.raws = [raw('r1', 'sms', '[Web발신]\n신한 10/05 19:30\n110-***-123456\n출금 30,000원\n잔액 1,000원\n김철수')];
    await run(repo);
    expect(repo.txs[0]).toMatchObject({ status: 'pending', merchant: '김철수' });
  });

  it('auto-hides deposits', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('r1', 'com.bank', '김철수님이 50,000원을 보내 입금됐어요')];
    await run(repo);
    expect(repo.txs[0]).toMatchObject({ kind: 'deposit', status: 'auto_hidden', autoHiddenReason: 'deposit' });
  });

  it('marks a matched cancellation on the original payment', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('r1', 'sms', '[Web발신]\n신한카드(1234)승인\n홍*동\n12,000원\n10/05 19:42\n스타벅스 강남점')];
    await run(repo);
    repo.raws.push(raw('r2', 'sms', '[Web발신]\n신한카드(1234)승인취소\n홍*동\n12,000원\n10/05 20:10\n스타벅스 강남점', '2026-10-05T11:10:00Z'));
    await run(repo);

    expect(repo.txs).toHaveLength(1);
    expect(repo.txs[0]?.cancelledAt).toBe('2026-10-05T20:10:00+09:00');
    expect(repo.events.find((e) => e.event.rawId === 'r2')?.transactionId).toBe(repo.txs[0]?.id);
  });

  it('flags an unmatched cancellation for review', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('r1', 'sms', '[Web발신]\n신한카드(1234)승인취소\n홍*동\n12,000원\n10/05 20:10\n스타벅스')];
    await run(repo);
    expect(repo.txs[0]).toMatchObject({ kind: 'cancel', status: 'pending', needsReview: true, reviewReason: 'unmatched_cancel' });
  });

  it('flags a missing merchant for review when AI is unavailable', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('r1', 'com.card', 'KB국민카드 승인 7,800원')];
    const result = await run(repo, null);
    expect(repo.txs[0]).toMatchObject({ merchant: null, needsReview: true, reviewReason: 'missing_merchant' });
    expect(result.aiCalls).toBe(0);
  });

  it('fills merchant and category from one AI call', async () => {
    const repo = new MemoryRepo();
    repo.raws = [
      raw('r1', 'com.card', 'KB국민카드 승인 7,800원'),
      raw('r2', 'com.pay', '스타벅스에서 5,600원 결제', '2026-10-05T10:50:00Z'),
    ];
    const ai = aiReturning([
      { id: 'r1', kind: 'payment', merchant: '한솥도시락', category: '식비' },
      { id: 'r2', category: '카페·간식' },
    ]);

    const result = await run(repo, ai);

    expect(ai.analyze).toHaveBeenCalledTimes(1);
    expect(repo.txs.find((t) => t.amount === 7800)).toMatchObject({ merchant: '한솥도시락', categoryId: 'c-food', needsReview: false });
    expect(repo.txs.find((t) => t.amount === 5600)).toMatchObject({ categoryId: 'c-cafe' });
    expect(repo.events.find((e) => e.event.rawId === 'r1')?.event.parser).toBe('ai');
    expect(result).toMatchObject({ aiCalls: 1, aiUsage: { inputTokens: 100, outputTokens: 20 } });
  });

  it('uses merchant memory instead of asking AI for a category', async () => {
    const repo = new MemoryRepo();
    repo.memory.set('스타벅스', 'c-cafe');
    repo.raws = [raw('r1', 'com.pay', '스타벅스에서 5,600원 결제')];
    const ai = aiReturning([]);
    await run(repo, ai);
    expect(ai.analyze).not.toHaveBeenCalled();
    expect(repo.txs[0]?.categoryId).toBe('c-cafe');
  });

  it('skips AI when not allowed by the monthly cap', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('r1', 'com.card', 'KB국민카드 승인 7,800원')];
    const ai = aiReturning([]);
    await run(repo, ai, false);
    expect(ai.analyze).not.toHaveBeenCalled();
    expect(repo.txs[0]?.needsReview).toBe(true);
  });

  it('waits for the next run when AI fails on an item that needs it', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('r1', 'com.card', 'KB국민카드 승인 7,800원')];
    const ai: AiClient = { analyze: async () => { throw new AiRateLimitError(); } };
    const result = await run(repo, ai);
    expect(repo.txs).toEqual([]);
    expect(repo.processed).toEqual([]);
    expect(repo.raws[0]?.attempts).toBe(1);
    expect(result).toMatchObject({ processed: 0, aiCalls: 0 });
  });

  it('gives up waiting for AI on the last attempt and flags the item for review', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('r1', 'com.card', 'KB국민카드 승인 7,800원', '2026-10-05T10:45:00Z', 2)];
    const ai: AiClient = { analyze: async () => { throw new Error('Gemini request failed: 503'); } };
    const result = await run(repo, ai);
    expect(repo.txs[0]).toMatchObject({ merchant: null, needsReview: true, reviewReason: 'missing_merchant' });
    expect(result.processed).toBe(1);
  });

  it('does not hold back items that only wanted a category when AI fails', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('r1', 'com.pay', '스타벅스에서 5,600원 결제')];
    const ai: AiClient = { analyze: async () => { throw new Error('Gemini request failed: 503'); } };
    const result = await run(repo, ai);
    expect(repo.txs[0]).toMatchObject({ merchant: '스타벅스', categoryId: null });
    expect(result.processed).toBe(1);
  });

  it('retries a failing notification and gives up after three attempts', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('ok', 'com.pay', '스타벅스에서 5,600원 결제'), raw('bad', 'com.pay', '한솥도시락에서 7,800원 결제', '2026-10-05T10:46:00Z', 1)];
    repo.failSaveFor.add('bad');

    const first = await run(repo);
    expect(first).toMatchObject({ processed: 1, failed: 1 });
    expect(repo.raws.find((r) => r.id === 'bad')?.attempts).toBe(2);
    expect(repo.processed).toEqual(['ok']);

    await run(repo);
    expect(repo.processed).toContain('bad');
    expect(repo.txs.find((t) => t.reviewReason === 'parse_failed')).toMatchObject({ status: 'pending', needsReview: true });
  });

  it('attaches a late notification to a decided transaction without changing its status', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('r1', 'com.card', '고기굽는집에서 20,000원 결제', '2026-10-05T10:42:00Z')];
    await run(repo);
    const decided = repo.txs[0]!;
    decided.status = 'mine';
    repo.raws.push(raw('r2', 'viva.republica.toss', '고기굽는집에서 20,000원 결제했어요', '2026-10-05T10:45:00Z'));

    await run(repo);

    expect(repo.txs).toHaveLength(1);
    expect(repo.txs[0]?.status).toBe('mine');
    expect(repo.events.find((e) => e.event.rawId === 'r2')?.transactionId).toBe(decided.id);
  });

  it('fills a missing merchant when a later notification of the same payment has one', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('r1', 'com.card', 'KB국민카드 승인 20,000원', '2026-10-05T10:42:00Z')];
    await run(repo);
    repo.raws.push(raw('r2', 'viva.republica.toss', '고기굽는집에서 20,000원 결제했어요', '2026-10-05T10:43:00Z'));
    await run(repo);
    expect(repo.txs[0]).toMatchObject({ merchant: '고기굽는집', needsReview: false, reviewReason: null });
  });

  it('flags an ambiguous group on a pending transaction', async () => {
    const repo = new MemoryRepo();
    repo.raws = [
      raw('r1', 'com.card', '스타벅스에서 5,600원 결제', '2026-10-05T10:40:00Z'),
      raw('r2', 'com.card', '스타벅스에서 5,600원 결제', '2026-10-05T10:44:00Z'),
      raw('r3', 'sms', '스타벅스에서 5,600원 결제', '2026-10-05T10:45:00Z'),
    ];
    await run(repo);
    expect(repo.txs).toHaveLength(2);
    expect(repo.txs.find((t) => t.reviewReason === 'ambiguous_group')).toBeDefined();
  });

  it('attaches a second app\'s notice of the same cancellation instead of flagging it', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('r1', 'com.card', '스타벅스에서 12,000원 결제', '2026-10-05T10:42:00Z')];
    await run(repo);
    repo.raws.push(
      raw('r2', 'com.card', '스타벅스 12,000원 승인취소', '2026-10-05T11:10:00Z'),
      raw('r3', 'sms', '[Web발신] 스타벅스 12,000원 승인취소', '2026-10-05T11:10:30Z'),
    );
    await run(repo);

    expect(repo.txs).toHaveLength(1);
    expect(repo.events.filter((e) => e.event.kind === 'cancel').map((e) => e.transactionId)).toEqual([repo.txs[0]?.id, repo.txs[0]?.id]);
  });

  it('marks each notification processed as soon as it is handled', async () => {
    const repo = new MemoryRepo();
    repo.raws = [
      raw('r1', 'com.card', '스타벅스에서 5,600원 결제', '2026-10-05T10:40:00Z'),
      raw('r2', 'com.card', '한솥도시락에서 7,800원 결제', '2026-10-05T10:50:00Z'),
    ];
    await run(repo);
    expect(repo.log).toEqual(['create:t1', 'processed:r1', 'create:t2', 'processed:r2']);
  });

  it('reports why AI failed', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('r1', 'com.card', 'KB국민카드 승인 7,800원')];
    const ai: AiClient = { analyze: async () => { throw new Error('Gemini request failed: 400'); } };
    const result = await run(repo, ai);
    expect(result.aiError).toBe('Error: Gemini request failed: 400');
  });

  it('drops an item AI judges not to be a payment', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('r1', 'viva.republica.toss', '친구 초대하면 최대 10,000원 받기')];
    const ai = aiReturning([{ id: 'r1', kind: 'unknown', merchant: null }]);
    await run(repo, ai);
    expect(repo.txs).toHaveLength(0);
    expect(repo.events).toEqual([expect.objectContaining({ transactionId: null })]);
    expect(repo.processed).toEqual(['r1']);
  });

  it('keeps the source notice on a transaction it gave up parsing', async () => {
    const repo = new MemoryRepo();
    repo.raws = [raw('bad', 'com.pay', '한솥도시락에서 7,800원 결제', '2026-10-05T10:46:00Z', 2)];
    repo.failSaveFor.add('bad');
    repo.failSaveOnce = true;
    await run(repo);
    const failed = repo.txs.find((t) => t.reviewReason === 'parse_failed');
    expect(repo.events.find((e) => e.event.rawId === 'bad')?.transactionId).toBe(failed?.id);
  });
});
