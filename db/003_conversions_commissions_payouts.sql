-- LMCT Phase 3: Conversions, Commission Ledger, Payouts
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Safe to re-run: every statement is idempotent.
--
-- Lesson learned from Phase 1/2: any brand-new table needs its
-- grants set explicitly — RLS policies alone are not enough,
-- PostgREST checks the base GRANT first. These three tables are
-- admin-only (no public/anon access at all), so only `authenticated`
-- needs a grant here.

-- ============================================================
-- 1. conversions
--    A reported qualifying action (lead or sale) tied to a click.
--    Recorded manually (Method C) or, in future, via network/webhook
--    import (Methods A/B) — see spec section 10.
-- ============================================================
create table if not exists public.conversions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id),
  vehicle_id uuid references public.vehicles(id),
  affiliate_click_id uuid references public.affiliate_clicks(id),
  conversion_type text not null, -- 'lead' | 'sale' | 'other'
  external_reference text,
  conversion_value numeric,
  commission_amount numeric,
  currency text not null default 'USD',
  status text not null default 'pending', -- pending | approved | rejected
  created_at timestamptz not null default now()
);

alter table public.conversions drop constraint if exists conversions_status_check;
update public.conversions
set status = 'pending'
where status is null or status not in ('pending', 'approved', 'rejected');
alter table public.conversions add constraint conversions_status_check
  check (status in ('pending', 'approved', 'rejected'))
  not valid;

alter table public.conversions drop constraint if exists conversions_type_check;
update public.conversions
set conversion_type = 'other'
where conversion_type is null or conversion_type not in ('lead', 'sale', 'other');
alter table public.conversions add constraint conversions_type_check
  check (conversion_type in ('lead', 'sale', 'other'))
  not valid;

alter table public.conversions enable row level security;
grant select, insert, update, delete on public.conversions to authenticated;

drop policy if exists "Admins manage conversions" on public.conversions;
create policy "Admins manage conversions"
  on public.conversions
  for all
  to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

-- ============================================================
-- 2. commissions
--    The commission ledger. One row per conversion once approved.
-- ============================================================
create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid references public.conversions(id),
  partner_id uuid references public.partners(id),
  amount numeric not null default 0,
  currency text not null default 'USD',
  status text not null default 'pending', -- pending | approved | rejected | paid
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.commissions drop constraint if exists commissions_status_check;
update public.commissions
set status = 'pending'
where status is null or status not in ('pending', 'approved', 'rejected', 'paid');
alter table public.commissions add constraint commissions_status_check
  check (status in ('pending', 'approved', 'rejected', 'paid'))
  not valid;

alter table public.commissions enable row level security;
grant select, insert, update, delete on public.commissions to authenticated;

drop policy if exists "Admins manage commissions" on public.commissions;
create policy "Admins manage commissions"
  on public.commissions
  for all
  to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

-- ============================================================
-- 3. payouts
--    Actual payments LMCT has received against approved commissions.
-- ============================================================
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid references public.commissions(id),
  amount numeric not null default 0,
  currency text not null default 'USD',
  payment_method text,
  reference text,
  status text not null default 'pending', -- pending | processing | paid | failed
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payouts drop constraint if exists payouts_status_check;
update public.payouts
set status = 'pending'
where status is null or status not in ('pending', 'processing', 'paid', 'failed');
alter table public.payouts add constraint payouts_status_check
  check (status in ('pending', 'processing', 'paid', 'failed'))
  not valid;

alter table public.payouts enable row level security;
grant select, insert, update, delete on public.payouts to authenticated;

drop policy if exists "Admins manage payouts" on public.payouts;
create policy "Admins manage payouts"
  on public.payouts
  for all
  to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

-- ============================================================
-- Done. Next: Phase 4 (earnings dashboard with date filters and
-- charts) reads from these three tables plus affiliate_clicks.
-- ============================================================
