-- UPSCviaPYQs — paywall schema (run in Supabase → SQL Editor → New query → Run)
-- Model: FREE content (latest 2 years + sample framework) is served statically and is NOT in this DB.
--        PAID content lives here and is readable ONLY by a logged-in user with an active entitlement.
--        Entitlements are written ONLY by the Razorpay webhook (service_role), never by the client.

-- ---------- 1. entitlements: who has paid ----------
create table if not exists public.entitlements (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  active               boolean not null default false,
  plan                 text    not null default 'all_access',
  expires_at           timestamptz,
  razorpay_payment_id  text,
  razorpay_order_id    text,
  updated_at           timestamptz not null default now()
);

alter table public.entitlements enable row level security;

-- a user may read ONLY their own entitlement row; nobody can write via the API (only service_role/webhook)
drop policy if exists "own entitlement read" on public.entitlements;
create policy "own entitlement read" on public.entitlements
  for select using (auth.uid() = user_id);

-- ---------- 2. helper: is the current user entitled right now? ----------
create or replace function public.is_entitled()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.entitlements e
    where e.user_id = auth.uid()
      and e.active = true
      and (e.expires_at is null or e.expires_at > now())
  );
$$;

-- ---------- 3. paid content tables (each row mirrors the original JSON object in `data`) ----------
create table if not exists public.paid_prelims    (id text primary key, year int, data jsonb not null);
create table if not exists public.paid_mains      (id text primary key, year int, data jsonb not null);
create table if not exists public.paid_optional   (id text primary key, year int, data jsonb not null);
create table if not exists public.paid_frameworks (id text primary key,            data jsonb not null);

create index if not exists idx_paid_prelims_year  on public.paid_prelims(year);
create index if not exists idx_paid_mains_year    on public.paid_mains(year);
create index if not exists idx_paid_optional_year on public.paid_optional(year);

alter table public.paid_prelims    enable row level security;
alter table public.paid_mains      enable row level security;
alter table public.paid_optional   enable row level security;
alter table public.paid_frameworks enable row level security;

-- only entitled users can SELECT paid content; no client writes at all
drop policy if exists "entitled read prelims"    on public.paid_prelims;
drop policy if exists "entitled read mains"       on public.paid_mains;
drop policy if exists "entitled read optional"    on public.paid_optional;
drop policy if exists "entitled read frameworks"  on public.paid_frameworks;
create policy "entitled read prelims"    on public.paid_prelims    for select using (public.is_entitled());
create policy "entitled read mains"       on public.paid_mains      for select using (public.is_entitled());
create policy "entitled read optional"    on public.paid_optional   for select using (public.is_entitled());
create policy "entitled read frameworks"  on public.paid_frameworks for select using (public.is_entitled());

-- ---------- 4. orders: audit trail of payment attempts (written by Edge Functions) ----------
create table if not exists public.orders (
  id                  bigint generated always as identity primary key,
  user_id             uuid references auth.users(id) on delete set null,
  razorpay_order_id   text,
  razorpay_payment_id text,
  amount              int,         -- in paise
  status              text,        -- created | paid | failed
  created_at          timestamptz not null default now()
);
alter table public.orders enable row level security;
drop policy if exists "own orders read" on public.orders;
create policy "own orders read" on public.orders for select using (auth.uid() = user_id);
