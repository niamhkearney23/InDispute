-- =============================================================================
-- Rollback: only if the WEBSITE has been rolled back to the version before
-- this release (b0161d8) and staff pages come up empty
-- =============================================================================
-- Read docs/RELEASE.md, "Rolling back", before using this. It is not needed
-- for a normal rollback, and it is not a way to undo the release's data
-- changes: that is a backup restore.
--
-- Why only this: the older website has no two-step sign-in, so its staff
-- sign in with a password alone. 0047 makes a staff role count in the
-- database only after the six-digit code, so behind the older website staff
-- would read only what a learner reads. This puts back the three staff
-- checks exactly as the older version had them (0001, 0037). Everything
-- else in this release works behind the older website as it is: the
-- publication gate, the content gate, account deletion and its protections
-- only refuse things, and leaving them in place keeps learners safe.
--
-- Safe to run more than once. Running UPDATE.sql again puts 0047 back.
-- =============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_coach or p.is_admin or p.is_firm_admin
       from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_firm_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_firm_admin or p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- The older website reads no version; this says what the database now is.
create or replace function public.schema_version()
returns text language sql immutable set search_path = public as $$ select '0046-rolled-back'::text $$;
revoke all on function public.schema_version() from public, anon, authenticated;
grant execute on function public.schema_version() to service_role;
