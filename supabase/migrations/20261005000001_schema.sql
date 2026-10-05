-- cherrypick-ledger 1단계 스키마

create table public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  onboarded_at timestamptz,
  digest_time time not null default '21:00',
  ai_monthly_call_cap int not null default 300 check (ai_monthly_call_cap >= 0),
  expo_push_token text,
  sms_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  key_hash text not null unique,
  label text,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.source_apps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  package_name text not null,
  label text not null,
  enabled boolean not null default true,
  unique (user_id, package_name)
);

create table public.my_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  bank_name text not null,
  last4 text not null check (last4 ~ '^\d{4}$'),
  alias text,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  icon text not null,
  color_token text not null check (color_token in ('cat-coral','cat-amber','cat-teal','cat-pink','cat-purple','cat-red','cat-blue','cat-green','cat-gray')),
  sort_order int not null default 0,
  archived boolean not null default false
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.merchant_memory (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  merchant_key text not null,
  category_id uuid not null references public.categories on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (user_id, merchant_key)
);

create table public.raw_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  source_package text not null,
  title text not null default '',
  body text not null,
  posted_at timestamptz not null,
  dedupe_key text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts int not null default 0,
  unique (user_id, dedupe_key)
);
create index raw_notifications_unprocessed on public.raw_notifications (user_id, posted_at) where processed_at is null;

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null check (kind in ('payment','transfer_out','deposit','cancel','unknown')),
  amount int,
  merchant text,
  occurred_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','mine','group','ignored','auto_hidden')),
  auto_hidden_reason text check (auto_hidden_reason in ('own_transfer','deposit')),
  category_id uuid references public.categories on delete set null,
  group_id uuid references public.groups on delete restrict,
  cancelled_at timestamptz,
  needs_review boolean not null default false,
  review_reason text check (review_reason in ('ambiguous_group','missing_merchant','unmatched_cancel','parse_failed')),
  memo text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'group' or group_id is not null)
);
create index transactions_by_status on public.transactions (user_id, status, occurred_at desc);

create table public.parsed_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  raw_id uuid not null unique references public.raw_notifications on delete cascade,
  source_package text not null,
  kind text not null check (kind in ('payment','transfer_out','deposit','cancel','unknown')),
  amount int,
  merchant text,
  account_last4 text,
  occurred_at timestamptz not null,
  parser text not null,
  transaction_id uuid references public.transactions on delete set null
);
create index parsed_events_by_transaction on public.parsed_events (transaction_id);

create table public.organize_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  trigger text not null check (trigger in ('cron','manual')),
  status text not null default 'running' check (status in ('running','succeeded','failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  processed_count int not null default 0,
  failed_count int not null default 0,
  ai_calls int not null default 0,
  ai_input_tokens int not null default 0,
  ai_output_tokens int not null default 0,
  error text
);
create unique index organize_runs_one_running on public.organize_runs (user_id) where status = 'running';
create index organize_runs_by_user on public.organize_runs (user_id, started_at desc);

-- RLS: 사용자는 자기 행만. 수집·정리 결과는 읽기만 (쓰기는 service role).
do $$
declare t text;
begin
  foreach t in array array['user_settings','source_apps','my_accounts','categories','groups','merchant_memory','transactions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
  foreach t in array array['devices','raw_notifications','parsed_events','organize_runs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows read" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end $$;
