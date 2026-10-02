-- =============================================================================
-- Who pays, and who does not
-- =============================================================================
-- Somebody training on their own pays. Somebody at a firm or university the
-- academy works with does not: their firm gives them a code, they enter it,
-- and a coach or administrator confirms they really are with that firm. A
-- code on its own opens nothing, because codes get passed around.
--
-- Staff, confirmed trainees and people who joined by a firm's invitation are
-- free without a code, and that is decided in the app, from what the
-- database already records about them.
--
-- Nothing in these three tables is written by a learner. Asking to use a
-- code, recording a payment and confirming a person all go through the
-- server, after it has checked who is asking, so a learner cannot mark
-- themselves as paid or confirmed by writing to a table.
-- =============================================================================

create table if not exists public.access_codes (
  id          uuid primary key default gen_random_uuid(),
  -- What people type: capitals, digits and hyphens, so that "thomas philip"
  -- and "THOMAS-PHILIP" are not two codes that look the same to a person.
  code        text not null unique,
  -- Who it is for, as a person would say it: "Thomas Philip".
  label       text not null,
  active      boolean not null default true,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.access_codes drop constraint if exists access_codes_code_shape;
alter table public.access_codes
  add constraint access_codes_code_shape check (code ~ '^[A-Z0-9-]{4,32}$');
alter table public.access_codes drop constraint if exists access_codes_label_present;
alter table public.access_codes
  add constraint access_codes_label_present check (length(trim(label)) between 1 and 120);

alter table public.access_codes enable row level security;

-- Administrators see the list. Learners never read it: a code is checked by
-- the server, one at a time, so nobody can list what codes exist.
drop policy if exists access_codes_admin_read on public.access_codes;
create policy access_codes_admin_read on public.access_codes
  for select to authenticated using (public.is_admin());

create table if not exists public.access_grants (
  -- One request per person. Entering another code replaces it.
  user_id      uuid primary key references auth.users (id) on delete cascade,
  code_id      uuid not null references public.access_codes (id) on delete restrict,
  requested_at timestamptz not null default now(),
  decision     text,
  decided_by   uuid references auth.users (id) on delete set null,
  decided_at   timestamptz
);

alter table public.access_grants drop constraint if exists access_grants_decision_known;
alter table public.access_grants
  add constraint access_grants_decision_known check (decision in ('confirmed', 'declined'));
-- Nobody confirms themselves, the same rule as signing off your own work.
alter table public.access_grants drop constraint if exists access_grants_not_self;
alter table public.access_grants
  add constraint access_grants_not_self check (decided_by is null or decided_by <> user_id);

create or replace function public.stamp_access_grant()
returns trigger language plpgsql set search_path = public as $$
begin
  -- A new code is a new request: whatever was decided about the old one
  -- does not carry over to a different firm.
  if tg_op = 'UPDATE' and new.code_id is distinct from old.code_id then
    new.requested_at := now();
    new.decision := null;
    new.decided_by := null;
    new.decided_at := null;
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.requested_at := now();
  end if;
  -- The date of a decision is the database's, never the caller's.
  if new.decision is null then
    new.decided_at := null;
    new.decided_by := null;
  elsif tg_op = 'INSERT' or new.decision is distinct from old.decision then
    new.decided_at := now();
  end if;
  return new;
end;
$$;

create or replace trigger access_grants_stamp
  before insert or update on public.access_grants
  for each row execute function public.stamp_access_grant();

create index if not exists access_grants_waiting
  on public.access_grants (requested_at) where decision is null;

alter table public.access_grants enable row level security;

drop policy if exists access_grants_read on public.access_grants;
create policy access_grants_read on public.access_grants
  for select to authenticated using (user_id = auth.uid() or public.is_coach());

create table if not exists public.subscriptions (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  -- Stripe's own word for it: active, trialing, past_due, canceled and so on.
  status                 text,
  current_period_end     timestamptz,
  updated_at             timestamptz not null default now()
);

create or replace function public.touch_subscription()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger subscriptions_touch
  before insert or update on public.subscriptions
  for each row execute function public.touch_subscription();

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_read on public.subscriptions;
create policy subscriptions_read on public.subscriptions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
