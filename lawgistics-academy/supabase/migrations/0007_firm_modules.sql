-- =============================================================================
-- Firm modules: the firm's own induction, in the firm's own words
-- =============================================================================
-- Everything in this database so far is content we wrote and we verify. A
-- firm's welcome and a firm's AI policy are neither. They are the firm's words,
-- about the firm's rules, and a firm will not accept somebody else writing them
-- or signing them off. So they live in their own tables, with their own
-- lifecycle, and they touch nothing that the training loop reads.
--
-- Three things follow from that, and they are the whole design:
--
--   * Firm content never enters the review queue. /admin/review exists to sign
--     off statements of law we are answerable for. A firm's policy is not a
--     statement of law and we are not answerable for it. There is deliberately
--     no verification_status column here.
--
--   * Firm content never enters the training pool. No spaced repetition, no
--     diagnostic, no mastery. An induction is a record that something was
--     covered on a date, not a skill to be strengthened.
--
--   * An acknowledgement is pinned to the version that was read. This is the
--     part a firm is actually buying. "Everyone has read the AI policy" is
--     worth nothing if the policy changed in March; what a firm needs to be
--     able to say is who has read the policy as it stands today. Publish a new
--     version and it is outstanding again for everyone, which is correct and
--     is the reason it is versioned rather than edited in place.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'firm_module_kind') then
    create type firm_module_kind as enum ('welcome', 'policy');
  end if;
end
$$;

create table if not exists public.firm_modules (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  summary     text not null default '',
  -- A welcome is read. A policy is read and acknowledged. The difference is
  -- whether finishing it produces a record with somebody's name on it.
  kind        firm_module_kind not null default 'policy',
  -- Null means everyone, and null is the default on purpose. A firm's own
  -- rules apply to whoever walks through the door, and this app already
  -- supports an Australian-trained intern sitting in a Malaysian firm. Scoping
  -- firm content by the country on a learner's account would hide the firm's
  -- AI policy from exactly the people most likely to need telling.
  country     country,
  required    boolean not null default true,
  position    integer not null default 0,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger firm_modules_touch
  before update on public.firm_modules
  for each row execute function public.touch_updated_at();

create table if not exists public.firm_module_versions (
  id             uuid primary key default gen_random_uuid(),
  firm_module_id uuid not null references public.firm_modules (id) on delete cascade,
  version        integer not null,
  body           text not null,
  is_current     boolean not null default true,
  created_at     timestamptz not null default now(),
  created_by     uuid references auth.users (id) on delete set null,
  unique (firm_module_id, version)
);

-- One current version per module, enforced here rather than remembered in the
-- application. Two current versions means two different answers to "what does
-- the policy say", and the acknowledgements stop meaning anything.
create unique index if not exists firm_module_versions_current_idx
  on public.firm_module_versions (firm_module_id)
  where is_current;

create table if not exists public.firm_module_acknowledgements (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  -- restrict, not cascade. A version somebody has acknowledged cannot be
  -- deleted, and because deleting a module cascades to its versions, an
  -- acknowledged module cannot be deleted either. Unpublish it instead. A
  -- compliance record that disappears when somebody tidies up is not a record.
  firm_module_version_id uuid not null
    references public.firm_module_versions (id) on delete restrict,
  acknowledged_at        timestamptz not null default now(),
  unique (user_id, firm_module_version_id)
);

create index if not exists firm_ack_version_idx
  on public.firm_module_acknowledgements (firm_module_version_id);

-- The timestamp is the database's, not the client's. Without this a request
-- could name its own acknowledgement date, and the one column the whole record
-- rests on would be a value somebody chose.
create or replace function public.stamp_acknowledgement()
returns trigger language plpgsql as $$
begin
  new.acknowledged_at := now();
  return new;
end;
$$;

create trigger firm_module_ack_stamp
  before insert on public.firm_module_acknowledgements
  for each row execute function public.stamp_acknowledgement();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.firm_modules                enable row level security;
alter table public.firm_module_versions        enable row level security;
alter table public.firm_module_acknowledgements enable row level security;

create policy firm_modules_read on public.firm_modules
  for select to authenticated using (published or public.is_admin());
create policy firm_modules_admin on public.firm_modules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- A learner reads the current version of a published module and nothing else.
-- Drafts and superseded versions are not theirs to see: a superseded policy is
-- the thing they must not be following.
create policy firm_module_versions_read on public.firm_module_versions
  for select to authenticated using (
    public.is_admin()
    or (
      is_current
      and exists (
        select 1 from public.firm_modules m
        where m.id = firm_module_id and m.published
      )
    )
  );
create policy firm_module_versions_admin on public.firm_module_versions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Insert and select only, and no admin write policy at all. There is
-- deliberately no way through this API for a learner to withdraw an
-- acknowledgement or for an administrator to add one on someone's behalf. The
-- record says a named person pressed the button on a date, and it is worth
-- having only for as long as that stays true.
create policy firm_ack_insert_own on public.firm_module_acknowledgements
  for insert to authenticated with check (user_id = auth.uid());
create policy firm_ack_select_own on public.firm_module_acknowledgements
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
