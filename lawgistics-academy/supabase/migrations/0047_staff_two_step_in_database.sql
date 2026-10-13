-- =============================================================================
-- A staff role counts in the database only once the code has been typed
-- =============================================================================
-- The website asks staff for the six-digit code from their authenticator app
-- before any staff page opens. But the browser holds the public key and the
-- person's own sign-in token, so somebody with a staff member's password
-- alone could sign in through Supabase's own API and read the database
-- directly, never touching the website. The integration tests showed a coach
-- signed in with a password alone reading the certification register that
-- way.
--
-- Supabase writes how somebody signed in into every token it issues: `aal1`
-- for a password alone, `aal2` once the code has been typed. The three
-- functions every staff rule goes through (is_admin, is_coach,
-- is_firm_admin) now count the role only on an `aal2` token. On an `aal1`
-- token a member of staff is, to the database, a learner, which is also what
-- they are to the website until they type the code.
--
-- A token Supabase issued always carries the claim. When there is no claim
-- at all, nobody signed in through Supabase Auth (the SQL editor, the
-- service role, the schema tests), and nothing changes for them.
--
-- STAFF_TWO_STEP=off (local work only) does not reach the database: on a real
-- Supabase project a member of staff without the code reads only what a
-- learner reads, whatever the website is set to.
-- =============================================================================

create or replace function public.staff_session_checked()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal2') = 'aal2';
$$;

revoke all on function public.staff_session_checked() from public;
grant execute on function public.staff_session_checked() to anon, authenticated, service_role;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.staff_session_checked() and coalesce(
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
  select public.staff_session_checked() and coalesce(
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
  select public.staff_session_checked() and coalesce(
    (select p.is_firm_admin or p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;
