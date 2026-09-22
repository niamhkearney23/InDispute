-- =============================================================================
-- Placement dates and an assigned essay topic
-- =============================================================================
-- The first piece of the placement program described in "Lawgistics
-- Academy: the brief": a learner on a fixed-length placement (Kuala Lumpur,
-- to start) has a start date and an end date, sits the diagnostic on day
-- one and again near the end, and the two skill maps sit side by side. Most
-- of that already existed: the diagnostic already supports being retaken,
-- and every sitting is already an immutable, timestamped snapshot in
-- diagnostic_results. What was missing is an end date to go with starts_on,
-- and somewhere to remember the one comparison essay topic assigned on day
-- one.
--
-- ends_on follows starts_on exactly: admin-only write, enforced by the same
-- trigger. That trigger has been redefined three times before this
-- migration (0001, 0008, 0011, restored by 0013 after 0011 silently dropped
-- 0008's clause). The lesson from that mistake is carried forward here: this
-- redefinition keeps every earlier clause and adds one.
-- =============================================================================

alter table public.profiles add column if not exists ends_on date;

comment on column public.profiles.ends_on is
  'The last day of a placement or program. Set by an administrator, not by '
  'them, for the same reason starts_on is: a person who could move their own '
  'end date could give themselves a longer, or shorter, placement than the '
  'one they were actually offered.';

alter table public.diagnostic_results
  add column if not exists essay_topic_slug text;

comment on column public.diagnostic_results.essay_topic_slug is
  'Set only on a learner''s first diagnostic, from their weakest priority '
  'domain. A later retake never reassigns it: the essay is set once, on day '
  'one, the same way the placement itself is.';

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

  if new.ends_on is distinct from old.ends_on
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'ends_on may only be changed by an administrator';
  end if;

  new.id := old.id;
  return new;
end;
$$;
