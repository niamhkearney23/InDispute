-- =============================================================================
-- The coach: a lawyer who signs content off and watches their people, and who
-- is not handed the keys to the product to do it
-- =============================================================================
-- There was one permission flag, `is_admin`, and it meant everything: sign off
-- questions, rewrite questions, invite people, edit the firm's own documents,
-- run setup. Fine while the only administrator was the person who built it.
--
-- It stops being fine the moment a firm buys this. The lawyer who supervises
-- the paralegals is not a one-off reviewer who signs a batch and leaves. They
-- are the coach. They log in every week, they decide whether content is sound,
-- and they decide whether a person is ready to be put in front of a client.
-- Giving them `is_admin` to do that hands them the question bank as well, and
-- an account with rights nobody intended is how a record a firm relies on stops
-- being reliable.
--
-- So there are two flags now.
--
--   * A coach signs content off, and records the supervisor decisions about
--     their own people. Those are judgements only a practitioner can make, and
--     they are the whole reason the role exists.
--
--   * A coach does not write content. Editing a question mints a new version
--     and clears its sign-off, so somebody who could both edit and verify could
--     rewrite an item and sign their own rewrite in one sitting, with the audit
--     trail showing an ordinary review. The queue already lets them flag an
--     item with a note saying what is wrong, and a flag without a note is
--     refused. That is the route: the coach says it is wrong, somebody else
--     changes it, and the two acts stay separate and attributable.
--
-- An administrator is a coach as well. Every place that asks "may this person
-- coach" gets yes for an administrator, because the alternative is an
-- administrator locked out of the review queue by a flag they did not set.
--
-- Neither flag can be granted from the browser. `is_admin` was already guarded
-- by a trigger, and the guard is widened to cover `is_coach` here, because a
-- coach who could promote themselves to coach could promote anybody.
-- =============================================================================

alter table public.profiles
  add column if not exists is_coach boolean not null default false;

comment on column public.profiles.is_coach is
  'May sign content off in the review queue and record supervisor decisions. '
  'Does not imply any right to write content. Administrators are coaches too, '
  'so read this through public.is_coach() rather than directly.';

-- SECURITY DEFINER for the same reason is_admin() is: policies on `profiles`
-- call it, and it must not recurse through their own RLS.
--
-- An administrator answers true. Every caller asks "may this person coach",
-- never "is this person only a coach", so folding the two together here means
-- no call site has to remember to check both and none can forget.
create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_coach or p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- The privilege guard, widened. Same rule for both flags: only an existing
-- administrator may change them, and the service role and database owner are
-- trusted so the first administrator can be created at all.
--
-- Deliberately NOT security definer, unchanged from the original: this has to
-- see the *calling* role in `current_user`. Running it as its owner would make
-- every caller look like the database owner and the check would pass for
-- anyone.
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql set search_path = public as $$
begin
  if (new.is_admin is distinct from old.is_admin
      or new.is_coach is distinct from old.is_coach)
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'is_admin and is_coach may only be changed by an administrator';
  end if;
  new.id := old.id;
  return new;
end;
$$;

-- Row Level Security is deliberately NOT widened for coaches.
--
-- Every page a coach uses is a server component reading through the service
-- role client, which bypasses RLS entirely and is gated by requireCoach() in
-- application code. Granting the browser session direct select on other
-- people's profiles would buy nothing, because nothing asks for it that way,
-- and would widen what a stolen session token reaches. The floor stays where
-- it is.
