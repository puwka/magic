-- Магия — initial schema for Supabase (Postgres).
-- Run in the Supabase SQL editor or via `supabase db push` with the Supabase CLI.
--
-- Security model:
--   * All tables have RLS enabled and no policies at all — the anon and authenticated
--     roles cannot read or write anything (deny by default).
--   * The application talks to the database only with the service role key from the
--     server, never from the browser.
--   * Illustrations and PDFs live in the private storage bucket `magia-private`
--     (created below). Objects are never public; the server streams them after
--     verifying the personal access token of the order.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  access_token_hash text not null,
  access_token_ciphertext text not null,
  status text not null check (status in ('pending_payment', 'paid', 'generating', 'completed', 'failed', 'refunded')),
  payment_status text not null check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  input jsonb not null,
  email text not null,
  price_rub integer not null check (price_rub > 0),
  currency text not null default 'RUB',
  is_demo boolean not null default false,
  checkout_url text,
  payment_provider text,
  payment_id text,
  generation jsonb not null,
  result jsonb,
  pdf_storage_key text,
  email_sent_at timestamptz,
  email_error text,
  data_deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  completed_at timestamptz,
  refunded_at timestamptz
);

create index if not exists orders_status_updated_at_idx on public.orders (status, updated_at);
create index if not exists orders_created_at_idx on public.orders (created_at);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null check (provider in ('test', 'yookassa')),
  provider_payment_id text not null,
  amount integer not null check (amount > 0),
  currency text not null default 'RUB',
  status text not null check (status in ('pending', 'paid', 'failed', 'refunded')),
  confirmation_url text,
  idempotence_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists payments_provider_payment_id_idx
  on public.payments (provider, provider_payment_id);
create index if not exists payments_order_id_idx on public.payments (order_id);

-- ---------------------------------------------------------------------------
-- Row level security: deny by default, service role only
-- ---------------------------------------------------------------------------
alter table public.orders enable row level security;
alter table public.payments enable row level security;

-- No policies are created on purpose. Everyone except the service role is denied.
-- If you later expose tables through the anon key, add narrow policies instead of
-- disabling RLS.

-- ---------------------------------------------------------------------------
-- Private storage bucket for illustrations and PDFs
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('magia-private', 'magia-private', false)
on conflict (id) do nothing;

-- Storage.objects already has RLS enabled by Supabase. No policies are added,
-- so only the service role can read or write objects in this bucket.
