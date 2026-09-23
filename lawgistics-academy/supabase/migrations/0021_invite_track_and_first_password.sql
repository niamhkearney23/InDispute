-- =============================================================================
-- Inviting a litigation trainee, and an account made by the administrator
-- =============================================================================
-- Two small things the joining path was missing.
--
-- An invitation now says which programme the person is on, so a litigation
-- trainee arrives as one rather than having to pick it on their first
-- screen. The same rule as profiles: a trainee is Malaysian.
--
-- And an administrator can now make the account outright, with a temporary
-- password they hand over, for a firm that would rather do that than send
-- a link. The account is marked as needing its password changed, and the
-- app puts the choice of a new one in front of that person before anything
-- else, so the password the administrator saw stops working the first time
-- the person signs in. That flag is the person's own to clear, once they
-- have chosen: it is a convenience for them, not a right, and nothing else
-- turns on it.
-- =============================================================================

alter table public.joiner_invitations
  add column if not exists track learner_track not null default 'general';

alter table public.joiner_invitations
  drop constraint if exists joiner_invitations_trainee_is_malaysian;
alter table public.joiner_invitations
  add constraint joiner_invitations_trainee_is_malaysian check (
    track <> 'litigation_trainee' or country = 'MY'
  );

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;
