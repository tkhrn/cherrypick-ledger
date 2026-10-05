import type { TransactionDTO } from '@/apis/transactions';
import type { CategoryColorToken } from '@/constants/theme';
import type { ReviewReason, Transaction, TransactionKind, TransactionStatus } from '@/types/transaction';

export function toTransaction(dto: TransactionDTO): Transaction {
  return {
    id: dto.id,
    kind: dto.kind as TransactionKind,
    amount: dto.amount,
    merchant: dto.merchant,
    occurredAt: dto.occurred_at,
    status: dto.status as TransactionStatus,
    autoHiddenReason: dto.auto_hidden_reason as Transaction['autoHiddenReason'],
    groupId: dto.group_id,
    memo: dto.memo,
    needsReview: dto.needs_review,
    reviewReason: dto.review_reason as ReviewReason | null,
    cancelledAt: dto.cancelled_at,
    category: dto.category
      ? { id: dto.category.id, name: dto.category.name, icon: dto.category.icon, colorToken: dto.category.color_token as CategoryColorToken }
      : null,
    notices: dto.parsed_events
      .flatMap((e) => (e.raw ? [{ eventId: e.id, sourcePackage: e.source_package, title: e.raw.title, body: e.raw.body, postedAt: e.raw.posted_at }] : []))
      .sort((a, b) => Date.parse(a.postedAt) - Date.parse(b.postedAt)),
  };
}
