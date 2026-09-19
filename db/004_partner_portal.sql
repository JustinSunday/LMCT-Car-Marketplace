-- LMCT Phase 5: Partner Self-Service Portal
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Safe to re-run: every statement is idempotent.
--
-- Design: a partner signs up for a regular Supabase Auth account via
-- the Partner Portal login page. That account is USELESS on its own —
-- it can see nothing — until an admin links it to a partner company
-- by inserting a row into partner_users (done from the admin Partners
-- screen). Every other policy below scopes a partner's visibility to
-- rows matching their own partner_id, found via that link table.

-- ============================================================
-- 1. partner_users — links an auth user to a partner company
-- ============================================================
create table if not exists public.partner_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id),
  partner_id uuid not null references public.partners(id),
  created_at timestamptz not null default now()
);

alter table public.partner_users enable row level security;
grant select on public.partner_users to authenticated;
grant insert, update, delete on public.partner_users to authenticated;

-- A partner user can see their own link row (to find their partner_id).
drop policy if exists "Partner can read own link" on public.partner_users;
create policy "Partner can read own link"
  on public.partner_users
  for select
  to authenticated
  using (user_id = auth.uid());

-- Only admins can create/edit/remove links.
drop policy if exists "Admins manage partner links" on public.partner_users;
create policy "Admins manage partner links"
  on public.partner_users
  for all
  to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

-- ============================================================
-- 2. Scoped read access for partners on their own data
--    (all additive to existing admin/public policies — RLS
--    policies are OR'd together, so this only ever grants MORE
--    visibility to a partner user, never less to anyone else)
-- ============================================================

-- Partners can read their own company profile.
drop policy if exists "Partner can read own profile" on public.partners;
create policy "Partner can read own profile"
  on public.partners
  for select
  to authenticated
  using (
    id in (select partner_id from public.partner_users where user_id = auth.uid())
  );

-- Partners can read their own affiliate offers (any status, not just
-- active/test — they should see drafts and expired offers too).
drop policy if exists "Partner can read own offers" on public.affiliate_offers;
create policy "Partner can read own offers"
  on public.affiliate_offers
  for select
  to authenticated
  using (
    partner_id in (select partner_id from public.partner_users where user_id = auth.uid())
  );

-- Partners can read the vehicles tied to their own offers.
drop policy if exists "Partner can read own vehicles" on public.vehicles;
create policy "Partner can read own vehicles"
  on public.vehicles
  for select
  to authenticated
  using (
    id in (
      select vehicle_id from public.affiliate_offers
      where partner_id in (select partner_id from public.partner_users where user_id = auth.uid())
    )
  );

-- Partners can read clicks on their own offers.
drop policy if exists "Partner can read own clicks" on public.affiliate_clicks;
create policy "Partner can read own clicks"
  on public.affiliate_clicks
  for select
  to authenticated
  using (
    offer_id in (
      select id from public.affiliate_offers
      where partner_id in (select partner_id from public.partner_users where user_id = auth.uid())
    )
  );

-- Partners can read their own conversions.
drop policy if exists "Partner can read own conversions" on public.conversions;
create policy "Partner can read own conversions"
  on public.conversions
  for select
  to authenticated
  using (
    partner_id in (select partner_id from public.partner_users where user_id = auth.uid())
  );

-- Partners can read their own commissions.
drop policy if exists "Partner can read own commissions" on public.commissions;
create policy "Partner can read own commissions"
  on public.commissions
  for select
  to authenticated
  using (
    partner_id in (select partner_id from public.partner_users where user_id = auth.uid())
  );

-- Partners can read payouts against their own commissions.
drop policy if exists "Partner can read own payouts" on public.payouts;
create policy "Partner can read own payouts"
  on public.payouts
  for select
  to authenticated
  using (
    commission_id in (
      select id from public.commissions
      where partner_id in (select partner_id from public.partner_users where user_id = auth.uid())
    )
  );

-- ============================================================
-- Done. The Partner Portal (src/PartnerLogin.jsx, src/PartnerPortal.jsx)
-- reads through these policies using the logged-in partner's own
-- session — no service-role key or backend function required.
-- ============================================================
