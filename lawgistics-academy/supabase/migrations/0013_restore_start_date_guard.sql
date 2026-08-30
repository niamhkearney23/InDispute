-- =============================================================================
-- Restoring a guard that 0011_coach.sql silently deleted
-- =============================================================================
-- guard_profile_privileges() is redefined three times across this history:
-- 0001_init.sql wrote it to protect is_admin. 0008_before_you_begin.sql
-- redefined the whole function to protect starts_on as well, because a joiner
-- who could move their own start date could move their own deadline, and the
-- comment on that column says exactly that: "Set by an administrator, not by
-- them." 0011_coach.sql redefined the whole function again to add is_coach,
-- but it was written against 0001's version rather than 0008's, so the
-- starts_on clause was not carried forward. `create or replace function`
-- replaces the entire body: from the moment 0011 ran, a joiner could set their
-- own starts_on to whatever they liked, and nothing objected.
--
-- This was not caught by anything that ran before this was written, because
-- proving it needs a real Postgres: RLS and a trigger are exactly the two
-- things a mocked backend cannot exercise, and this repository's own schema
-- guarantee suite, which does run against real Postgres and does have a test
-- for precisely this, had apparently not been run against a real database
-- since 0011 was added. It was run here, deliberately, and found this on the
-- first attempt.
--
-- The lesson generalises past this one column: a function redefined by more
-- than one migration is redefining the WHOLE function, not adding to it, and
-- every migration that touches one has to be checked against the CURRENT body,
-- not the one it happened to have open. There is now a structural test for
-- that shape of mistake (tests/coach.test.ts), and this migration is the
-- immediate fix: restore the clause, keep everything 0011 added.
-- =============================================================================

create or replace function public.guard_profile_privileges()
returns trigger language plpgsql set search_path = public as $$
begin
  if (new.is_admin is distinct from old.is_admin
      or new.is_coach is distinct from old.is_coach)
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'is_admin and is_coach may only be changed by an administrator';
  end if;

  if new.starts_on is distinct from old.starts_on
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'starts_on may only be changed by an administrator';
  end if;

  new.id := old.id;
  return new;
end;
$$;
