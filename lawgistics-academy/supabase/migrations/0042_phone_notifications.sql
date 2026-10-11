-- =============================================================================
-- Phone notifications: round reminders, marked work, new work
-- =============================================================================
-- The academy can be added to a phone's home screen and send notifications
-- (web push). Three things send one:
--
--   * a round about to open, a few minutes before, on the trainee's cohort
--     clock and only on a rounds day of their placement;
--   * a coach marking something the person handed in on the work board;
--   * a coach putting up a new piece of work the person can see.
--
-- A phone that agreed to notifications is a row in `push_devices`. The
-- browser hands over an address at a push service (Apple's, Google's,
-- Mozilla's or Microsoft's) and two keys that encrypt what is sent, and
-- nothing else: no phone number, no device name unless the app gives one.
--
-- A person reads only their own devices. Nobody writes the table directly:
-- the server saves and forgets a device after checking who is signed in,
-- which is the same pattern as the training record (see 0022). A device goes
-- when its owner's account goes, by cascade.
--
-- `push_round_reminders` is the server's own note of which reminders it has
-- sent, one per person per round, so a scheduler that calls twice in the same
-- minute does not buzz anybody twice. Nobody but the server reads it.
--
-- `work_posts.announced_at` is the same idea for new work: a post is
-- announced once, the first time it is saved as put up, and never again when
-- a coach edits it afterwards.
-- =============================================================================

create table if not exists public.push_devices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  endpoint     text not null unique check (
    char_length(endpoint) between 20 and 1000 and endpoint like 'https://%'
  ),
  p256dh       text not null check (char_length(p256dh) between 40 and 200),
  auth_secret  text not null check (char_length(auth_secret) between 16 and 100),
  label        text check (label is null or char_length(label) <= 80),
  created_at   timestamptz not null default now(),
  last_sent_at timestamptz
);

comment on table public.push_devices is
  'A phone or browser that agreed to notifications: the push service address '
  'and the keys that encrypt what is sent. Read by its owner, written by the server.';

create index if not exists push_devices_user_idx on public.push_devices (user_id);

alter table public.push_devices enable row level security;

drop policy if exists push_devices_read_own on public.push_devices;
create policy push_devices_read_own on public.push_devices
  for select to authenticated using (user_id = auth.uid());

revoke insert, update, delete, truncate on public.push_devices from anon, authenticated;

create table if not exists public.push_round_reminders (
  user_id  uuid not null references auth.users (id) on delete cascade,
  opens_at timestamptz not null,
  sent_at  timestamptz not null default now(),
  primary key (user_id, opens_at)
);

comment on table public.push_round_reminders is
  'Which round reminders the server has sent, so none goes twice. Server only.';

alter table public.push_round_reminders enable row level security;

revoke all on public.push_round_reminders from anon, authenticated;

alter table public.work_posts
  add column if not exists announced_at timestamptz;

comment on column public.work_posts.announced_at is
  'When the server told the people it is for that this post was put up. Set '
  'once, by the server, so editing a post later does not announce it again.';

-- Posts already up when this arrived count as announced: nobody should get a
-- notification about last month''s work because a coach fixed a typo in it.
update public.work_posts
   set announced_at = coalesce(published_at, created_at)
 where published and announced_at is null;

-- Who may see a post, for any person rather than only the caller. The rule
-- is 0023's `work_visible`, word for word, and `work_visible` now asks this
-- with the caller's id, so the board and the notifications read one rule and
-- cannot drift apart.
create or replace function public.work_visible_to(post public.work_posts, person uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select post.published
        and (post.country is null or post.country = p.country)
        and (not post.trainees_only
             or (p.track = 'litigation_trainee' and p.trainee_approved_at is not null))
       from public.profiles p where p.id = person),
    false
  );
$$;

revoke all on function public.work_visible_to(public.work_posts, uuid) from public;
revoke all on function public.work_visible_to(public.work_posts, uuid) from anon, authenticated;
grant execute on function public.work_visible_to(public.work_posts, uuid) to service_role;

create or replace function public.work_visible(post public.work_posts)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.work_visible_to(post, auth.uid());
$$;

-- The devices to tell about a post: everybody the post is for, by the rule
-- above, who has a device, leaving out staff (they put work up rather than
-- take it) and whoever posted it. The server only.
create or replace function public.push_devices_for_work_post(post_id uuid)
returns table (user_id uuid, endpoint text, p256dh text, auth_secret text)
language sql
stable
security definer
set search_path = public
as $$
  select d.user_id, d.endpoint, d.p256dh, d.auth_secret
    from public.work_posts w
    join public.push_devices d on true
    join public.profiles p on p.id = d.user_id
   where w.id = post_id
     and public.work_visible_to(w, d.user_id)
     and not (p.is_coach or p.is_admin or p.is_firm_admin)
     and d.user_id is distinct from w.posted_by;
$$;

revoke all on function public.push_devices_for_work_post(uuid) from public;
revoke all on function public.push_devices_for_work_post(uuid) from anon, authenticated;
grant execute on function public.push_devices_for_work_post(uuid) to service_role;
