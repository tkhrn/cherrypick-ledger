import { toTransaction } from './toTransaction';

const dto = {
  id: 't1', kind: 'payment', amount: 20000, merchant: '고기굽는집', occurred_at: '2026-10-05T10:42:00+00:00', status: 'pending',
  auto_hidden_reason: null, group_id: null, memo: null, needs_review: true, review_reason: 'ambiguous_group', cancelled_at: null,
  category: { id: 'c1', name: '식비', icon: 'tools-kitchen-2', color_token: 'cat-coral' },
  parsed_events: [
    { id: 'e2', source_package: 'sms', raw: { title: '', body: 'B', posted_at: '2026-10-05T10:43:00+00:00' } },
    { id: 'e1', source_package: 'com.card', raw: { title: 'T', body: 'A', posted_at: '2026-10-05T10:42:00+00:00' } },
  ],
};

describe('toTransaction', () => {
  it('maps the DTO to the domain shape with notices in time order', () => {
    expect(toTransaction(dto)).toEqual({
      id: 't1', kind: 'payment', amount: 20000, merchant: '고기굽는집', occurredAt: '2026-10-05T10:42:00+00:00', status: 'pending',
      autoHiddenReason: null, groupId: null, memo: null, needsReview: true, reviewReason: 'ambiguous_group', cancelledAt: null,
      category: { id: 'c1', name: '식비', icon: 'tools-kitchen-2', colorToken: 'cat-coral' },
      notices: [
        { eventId: 'e1', sourcePackage: 'com.card', title: 'T', body: 'A', postedAt: '2026-10-05T10:42:00+00:00' },
        { eventId: 'e2', sourcePackage: 'sms', title: '', body: 'B', postedAt: '2026-10-05T10:43:00+00:00' },
      ],
    });
  });

  it('handles a missing category and events without a raw row', () => {
    const t = toTransaction({ ...dto, category: null, parsed_events: [{ id: 'e1', source_package: 'sms', raw: null }] });
    expect(t.category).toBeNull();
    expect(t.notices).toEqual([]);
  });
});
