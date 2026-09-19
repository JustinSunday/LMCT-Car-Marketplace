-- LMCT Phase 1: Partner Program
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Safe to re-run: every statement is idempotent.

-- ============================================================
-- 1. partner_applications
--    Public "Partner With LMCT" form submissions live here.
--    Admin reviews them and approves/rejects.
-- ============================================================
create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  country text,
  website text,
  company_type text,          -- e.g. Dealership, Marketplace, Service Provider
  category text,              -- free-text niche (luxury, exotic, EV, etc.)
  listings_count text,        -- how many vehicles/listings they have
  partnership_type text not null,
  affiliate_program_url text,
  message text,
  status text not null default 'pending', -- pending | approved | rejected
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.partner_applications enable row level security;

-- New tables created via SQL don't inherit Supabase's default
-- anon/authenticated grants the way tables made in the Table
-- Editor UI do — without this, RLS policies never even get
-- evaluated and every query fails with "permission denied".
-- Anonymous visitors only ever need to insert (submit the form);
-- reading/updating applications is left to authenticated admins,
-- enforced further by the RLS policies below.
grant insert on public.partner_applications to anon;
grant select, insert, update on public.partner_applications to authenticated;

-- Anyone (including anonymous visitors) can submit an application.
drop policy if exists "Anyone can submit a partner application" on public.partner_applications;
create policy "Anyone can submit a partner application"
  on public.partner_applications
  for insert
  to anon, authenticated
  with check (true);

-- Only registered admins can read or update applications.
drop policy if exists "Admins can read partner applications" on public.partner_applications;
create policy "Admins can read partner applications"
  on public.partner_applications
  for select
  to authenticated
  using (exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  ));

drop policy if exists "Admins can update partner applications" on public.partner_applications;
create policy "Admins can update partner applications"
  on public.partner_applications
  for update
  to authenticated
  using (exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  ));

-- ============================================================
-- 2. partners
--    Expand the existing table with the fields the spec calls for.
-- ============================================================
alter table public.partners add column if not exists contact_name text;
alter table public.partners add column if not exists contact_email text;
alter table public.partners add column if not exists phone text;
alter table public.partners add column if not exists country text;
alter table public.partners add column if not exists partnership_type text;
alter table public.partners add column if not exists status text;
alter table public.partners add column if not exists application_id uuid references public.partner_applications(id);
alter table public.partners add column if not exists created_at timestamptz not null default now();

-- Drop the constraint (and any stale/prior version of it) before
-- touching data, so a leftover constraint from an earlier attempt
-- can never block this backfill.
alter table public.partners drop constraint if exists partners_status_check;

-- Normalize every row unconditionally. This table only holds
-- development/test partners at this stage, so a blanket reset is
-- safe and sidesteps any casing/whitespace mismatch in old data.
update public.partners
set status = case
  when lower(trim(coalesce(status, ''))) in ('pending', 'approved', 'rejected', 'suspended')
    then lower(trim(status))
  else 'approved'
end;

alter table public.partners alter column status set not null;
alter table public.partners alter column status set default 'approved';

-- status should only ever be one of these.
-- Added NOT VALID so it applies to all future writes without
-- re-validating legacy rows (some existing partner rows may have
-- inconsistent status values from before this migration existed).
alter table public.partners drop constraint if exists partners_status_check;
alter table public.partners add constraint partners_status_check
  check (status in ('pending', 'approved', 'rejected', 'suspended'))
  not valid;

alter table public.partners enable row level security;

drop policy if exists "Admins manage partners" on public.partners;
create policy "Admins manage partners"
  on public.partners
  for all
  to authenticated
  using (exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  ));

-- The public website needs to read partner names for vehicle cards
-- (this likely already exists implicitly via the vehicles/offers join,
-- but an explicit read policy keeps it working under RLS).
drop policy if exists "Public can read approved partners" on public.partners;
create policy "Public can read approved partners"
  on public.partners
  for select
  to anon, authenticated
  using (status = 'approved');

-- ============================================================
-- Done. Next: run 002_affiliate_offers.sql (Phase 2) once you're
-- ready to add commission modeling to affiliate offers.
-- ============================================================
