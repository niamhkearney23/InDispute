-- =============================================================================
-- Joining: the firm starts the process, not the joiner
-- =============================================================================
-- 0008 gave a joiner a checklist and gave the firm somebody to oversee it, but
-- it still assumed the joiner had found the sign-up page and made an account
-- by themselves, and that somebody at the firm had then found them in a list
-- and typed in a start date. That is not "everyone joins through the app",
-- it is "everyone joins, and then the app finds out".
--
-- So the firm invites them. An administrator enters a name, an email and a
-- start date, and gets a link. The person opens it, sets a password, and lands
-- on their own checklist with their start date already on it. There is one
-- path into the firm and it runs through here.
--
-- What that means for this table:
--
--   * The link is the credential, so the token is never stored. Only a SHA-256
--     hash of it is, exactly as a password would be. Somebody who gets read
--     access to this table gets a list of hashes and no way into anybody's
--     account.
--
--   * The invitation carries the email, the name, the country and the start
--     date. None of those are asked for on the joining form, because a form
--     that asked would let whoever held the link decide who they were joining
--     as, and the start date is the firm's fact about somebody rather than
--     theirs.
--
--   * There is deliberately no column here that could grant administrator
--     rights. An invitation is the least privileged thing in this database and
--     it is handed to people who do not work here yet.
-- =============================================================================

create table if not exists public.joiner_invitations (
  id            uuid primary key default gen_random_uuid(),
  -- SHA-256 of the token, hex. The token itself exists only in the link.
  token_hash    text not null unique,
  email         text not null,
  display_name  text not null default '',
  -- Nullable, because a firm does not always know the start date when it makes
  -- the offer, and an invitation that had to wait for one would be sent late.
  starts_on     date,
  country       country not null default 'AU',
  invited_by    uuid not null references auth.users (id) on delete restrict,
  invited_at    timestamptz not null default now(),
  -- A link that works forever is a credential nobody remembers issuing.
  expires_at    timestamptz not null default now() + interval '14 days',
  accepted_at   timestamptz,
  accepted_by   uuid references auth.users (id) on delete set null,
  revoked_at    timestamptz,

  -- An invitation cannot be both taken up and called back.
  constraint joiner_invitations_one_outcome
    check (accepted_at is null or revoked_at is null),
  -- If it was accepted, we know by whom.
  constraint joiner_invitations_accepted_by_known
    check ((accepted_at is null) = (accepted_by is null))
);

-- One live invitation per person. Without this, resending an invitation twice
-- leaves two working links, and revoking the one somebody remembers sending
-- does not close the door. Case-insensitive, because nobody types their own
-- email address the same way twice.
create unique index if not exists joiner_invitations_pending_email_idx
  on public.joiner_invitations (lower(email))
  where accepted_at is null and revoked_at is null;

create index if not exists joiner_invitations_pending_idx
  on public.joiner_invitations (invited_at desc)
  where accepted_at is null and revoked_at is null;

-- The dates are the database's, as everywhere else in this feature. An
-- invitation that could name its own expiry is not an expiry.
create or replace function public.stamp_invited_at()
returns trigger language plpgsql as $$
begin
  new.invited_at := now();
  -- Only on insert: an administrator extending an expiry later is a legitimate
  -- thing to do, and this trigger does not run on update anyway.
  if new.expires_at is null or new.expires_at > now() + interval '30 days' then
    new.expires_at := now() + interval '14 days';
  end if;
  new.accepted_at := null;
  new.accepted_by := null;
  new.revoked_at := null;
  return new;
end;
$$;

create or replace trigger joiner_invitations_stamp
  before insert on public.joiner_invitations
  for each row execute function public.stamp_invited_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.joiner_invitations enable row level security;

-- Administrators only, and nobody else at all. There is deliberately no policy
-- letting a signed-in learner read this table: the hashes are useless to them,
-- but the list of who is about to join a firm and when is not nothing, and
-- there is no reason for anybody but an administrator to have it.
--
-- The joining page itself is opened by somebody with no account, so it is read
-- through the service role rather than by a policy here. That is the same
-- pattern the rest of the app uses for work a signed-out visitor must do, and
-- it is why the token is hashed: the lookup is by hash, so the page cannot be
-- made to return a row by anybody who has not been given the link.
drop policy if exists joiner_invitations_admin on public.joiner_invitations;
create policy joiner_invitations_admin on public.joiner_invitations
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
