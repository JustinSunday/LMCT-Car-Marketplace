-- LMCT Phase 2: Affiliate Offers / Commission Modeling
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Safe to re-run: every statement is idempotent.

-- ============================================================
-- 1. affiliate_offers — add the fields spec section 5 calls for
-- ============================================================
alter table public.affiliate_offers add column if not exists tracking_id text;
alter table public.affiliate_offers add column if not exists commission_type text; -- percentage | fixed_lead | fixed_sale | custom
alter table public.affiliate_offers add column if not exists commission_rate numeric;
alter table public.affiliate_offers add column if not exists cookie_duration_days integer;
alter table public.affiliate_offers add column if not exists start_date date;
alter table public.affiliate_offers add column if not exists end_date date;
alter table public.affiliate_offers add column if not exists created_at timestamptz not null default now();

-- Drop any stale constraint first so normalizing data below can
-- never be blocked by a leftover constraint from an earlier attempt.
alter table public.affiliate_offers drop constraint if exists affiliate_offers_commission_type_check;

-- Normalize unconditionally (a commission type may legitimately be
-- unset until a partner supplies real terms — spec section 12 says
-- never invent a rate — so null is a valid, expected state here).
update public.affiliate_offers
set commission_type = case
  when lower(trim(coalesce(commission_type, ''))) in ('percentage', 'fixed_lead', 'fixed_sale', 'custom')
    then lower(trim(commission_type))
  else null
end;

alter table public.affiliate_offers add constraint affiliate_offers_commission_type_check
  check (commission_type is null or commission_type in ('percentage', 'fixed_lead', 'fixed_sale', 'custom'))
  not valid;

-- ============================================================
-- 2. Permissions
--    The public site already reads this table successfully, so a
--    read grant for anon must already exist. Admins have never
--    written to it before though (there was no UI for it), so make
--    sure authenticated has write access and an RLS policy to use it —
--    same class of bug as Phase 1's "permission denied" surprise.
-- ============================================================
alter table public.affiliate_offers enable row level security;

grant select, insert, update, delete on public.affiliate_offers to authenticated;

-- Re-affirm public read access explicitly, in case RLS was not
-- previously enabled on this table (enabling it here must not
-- silently break the live vehicle listings on the homepage).
drop policy if exists "Public can read active offers" on public.affiliate_offers;
create policy "Public can read active offers"
  on public.affiliate_offers
  for select
  to anon, authenticated
  using (status in ('active', 'test'));

drop policy if exists "Admins manage affiliate offers" on public.affiliate_offers;
create policy "Admins manage affiliate offers"
  on public.affiliate_offers
  for all
  to authenticated
  using (exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  ));

-- ============================================================
-- Done. Next: run 003_conversions_commissions.sql (Phase 3) for
-- conversion tracking, the commission ledger and payouts.
-- ============================================================
