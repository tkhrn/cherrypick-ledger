import type { CategoryColorToken } from '@/constants/theme';

export type TransactionKind = 'payment' | 'transfer_out' | 'deposit' | 'cancel' | 'unknown';
export type TransactionStatus = 'pending' | 'mine' | 'group' | 'ignored' | 'auto_hidden';
export type ReviewReason = 'ambiguous_group' | 'missing_merchant' | 'unmatched_cancel' | 'parse_failed';
export type DecisionStatus = Exclude<TransactionStatus, 'auto_hidden'>;

export interface Category {
  id: string;
  name: string;
  icon: string;
  colorToken: CategoryColorToken;
}

export interface SourceNotice {
  eventId: string;
  sourcePackage: string;
  title: string;
  body: string;
  postedAt: string;
}

export interface Transaction {
  id: string;
  kind: TransactionKind;
  amount: number | null;
  merchant: string | null;
  occurredAt: string;
  status: TransactionStatus;
  autoHiddenReason: 'own_transfer' | 'deposit' | null;
  category: Category | null;
  groupId: string | null;
  memo: string | null;
  needsReview: boolean;
  reviewReason: ReviewReason | null;
  cancelledAt: string | null;
  notices: SourceNotice[];
}
