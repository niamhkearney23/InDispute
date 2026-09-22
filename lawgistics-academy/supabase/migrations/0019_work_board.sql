-- =============================================================================
-- The work board: a coach posts work, an intern puts their name on it, hands
-- it in, and the coach marks it
-- =============================================================================
-- Until now a coach could put a video in front of their juniors and nothing
-- else. This is the rest of what supervising actually looks like: here is a
-- piece of work, who is doing it, show me what you did, here is what I think.
--
-- Three tables and a bucket.
--
--   * work_posts is what the coach puts up. Two kinds: a task, which somebody
--     claims and hands in, and a material, which is a reading attached to a
--     session or a homework day and claimed by nobody. A post carries either
--     an uploaded file or a link to a document somewhere the firm already
--     keeps things (Google Drive, Docs), host-checked here and in the app.
--   * work_claims is a name on a piece of work. A post is either for one
--     person, and the first name wins, or for everyone, and each intern does
--     their own. Insert and select only: a name stays put.
--   * work_submissions is what was handed in, append-only for the intern.
--     Handing it in again is a new row. The coach marks a row in place, and a
--     trigger makes sure marking is the only thing that can change on it.
--
-- Every upload carries a declaration that it holds no client-identifying
-- information, checked true at the database and not merely by a tick box.
-- That declaration is how live-matter work is allowed on here at all: the
-- platform is not a document store, and nothing confidential is meant to
-- reach it.
--
-- Who sees what. A post is for litigation trainees unless the coach widens
-- it, and for one country unless the coach says both. The rule lives in one
-- SQL function, work_visible, used by every policy that needs it, so the app
-- never re-decides it in TypeScript.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'work_kind') then
    create type work_kind as enum ('task', 'material');
  end if;
  if not exists (select 1 from pg_type where typname = 'work_scope') then
    create type work_scope as enum ('one', 'everyone');
  end if;
  if not exists (select 1 from pg_type where typname = 'work_verdict') then
    create type work_verdict as enum ('good', 'again');
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- What the coach puts up
-- -----------------------------------------------------------------------------
create table if not exists public.work_posts (
  id            uuid primary key default gen_random_uuid(),
  kind          work_kind not null default 'task',
  title         text not null,
  instructions  text not null default '',

  -- One or the other, or neither if the instructions are the whole task. The
  -- file is an object in the 'work' bucket; file_name is what the coach
  -- called it, so nobody is shown a storage path.
  file_path     text,
  file_name     text,
  link_url      text,

  scope         work_scope not null default 'one',
  trainees_only boolean not null default true,
  -- Null means both countries, as coach_sessions.
  country       country,
  -- Information for the intern, not a rule for the database: a late
  -- submission is still a record, and is shown as late.
  due_on        date,

  -- Where it hangs, if anywhere: under a session, or under one of the twenty
  -- homework days. A post can stand on its own on the board as well.
  session_id    uuid references public.coach_sessions (id) on delete set null,
  homework_day  smallint check (homework_day between 1 and 20),

  published     boolean not null default false,
  published_at  timestamptz,
  posted_by     uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Named hosts, as the video allowlist is, checked here and again in the app:
-- a link on a training page is somewhere we are sending a junior, so the
-- question is whether we chose the destination.
alter table public.work_posts
  drop constraint if exists work_posts_link_host;
alter table public.work_posts
  add constraint work_posts_link_host check (
    link_url is null or link_url ~ '^https://(drive|docs)\.google\.com/'
  );

create or replace function public.stamp_work_post()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.published and not coalesce(old.published, false) then
    new.published_at := now();
  elsif not new.published then
    new.published_at := null;
  end if;
  return new;
end;
$$;

create or replace trigger work_posts_stamp
  before insert or update on public.work_posts
  for each row execute function public.stamp_work_post();

create or replace trigger work_posts_touch
  before update on public.work_posts
  for each row execute function public.touch_updated_at();

create index if not exists work_posts_board_idx
  on public.work_posts (published, country, trainees_only);

create index if not exists work_posts_session_idx
  on public.work_posts (session_id)
  where session_id is not null;

create index if not exists work_posts_homework_idx
  on public.work_posts (homework_day)
  where homework_day is not null;

-- Whether the person asking can see a post. Security definer so the read of
-- profiles inside a policy does not go back through profiles' own policies,
-- the same reason is_coach() is. Coalesced, so somebody with no profile row
-- sees nothing rather than a null that some caller mistakes for true.
create or replace function public.work_visible(post public.work_posts)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select post.published
        and (post.country is null or post.country = p.country)
        and (not post.trainees_only or p.track = 'litigation_trainee')
       from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- -----------------------------------------------------------------------------
-- A name on a piece of work
-- -----------------------------------------------------------------------------
create table if not exists public.work_claims (
  id         uuid primary key default gen_random_uuid(),
  -- restrict, not cascade: a coach withdraws a post by unpublishing it, and
  -- no script gets to make an intern's record vanish by deleting the post.
  post_id    uuid not null references public.work_posts (id) on delete restrict,
  user_id    uuid not null references auth.users (id) on delete cascade,
  claimed_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists work_claims_post_idx
  on public.work_claims (post_id);

-- First name wins on a post that is for one person. Security definer, and it
-- has to be: run as the intern, the lock would need an update policy on
-- work_posts they do not have, and the count of other people's claims would
-- be hidden by the select policy, so both checks would come back empty
-- exactly when they matter. As the owner, both reads are honest, and the
-- rule holds for the service role too. The lock on the post row is what
-- stops two interns clicking at the same moment from both getting it.
create or replace function public.guard_work_claim()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  post public.work_posts%rowtype;
begin
  select * into post from public.work_posts where id = new.post_id for update;
  if not found then
    raise exception 'That piece of work does not exist';
  end if;
  if post.kind <> 'task' then
    raise exception 'A material is for reading, not for claiming';
  end if;
  if post.scope = 'one'
     and exists (select 1 from public.work_claims where post_id = new.post_id) then
    raise exception 'This piece of work already has somebody''s name on it';
  end if;
  -- The date is the record, so it is the database's and never the request's.
  new.claimed_at := now();
  return new;
end;
$$;

create or replace trigger work_claims_guard
  before insert on public.work_claims
  for each row execute function public.guard_work_claim();

-- How many names are on each post, and nothing else. An intern deciding
-- whether a piece of work is still open needs the number and must not see
-- the names, which the select policy on work_claims keeps to their own. A
-- view runs as its owner rather than as the person reading it, so this is
-- the one deliberate window through that policy, and it is a count.
drop view if exists public.work_claim_counts;
create view public.work_claim_counts as
select post_id, count(*)::integer as claims
from public.work_claims
group by post_id;

grant select on public.work_claim_counts to authenticated;

-- -----------------------------------------------------------------------------
-- What was handed in
-- -----------------------------------------------------------------------------
create table if not exists public.work_submissions (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references public.work_posts (id) on delete restrict,
  user_id        uuid not null references auth.users (id) on delete cascade,
  file_path      text not null,
  file_name      text not null default '',
  note           text not null default '',
  -- Checked true here, not only by the tick box on the form. A row that
  -- says the work was not de-identified cannot exist.
  declared_clean boolean not null check (declared_clean),
  submitted_at   timestamptz not null default now(),

  -- The marking. Nullable until the coach has looked.
  verdict        work_verdict,
  feedback       text not null default '',
  marked_by      uuid references auth.users (id) on delete set null,
  marked_at      timestamptz
);

create index if not exists work_submissions_post_idx
  on public.work_submissions (post_id, user_id, submitted_at desc);

create or replace function public.stamp_work_submission()
returns trigger language plpgsql set search_path = public as $$
begin
  new.submitted_at := now();
  return new;
end;
$$;

create or replace trigger work_submissions_stamp
  before insert on public.work_submissions
  for each row execute function public.stamp_work_submission();

-- A submission is what was handed in. Marking it is the only thing that may
-- change afterwards, and the mark carries its own date, stamped here rather
-- than trusted from the request, as every other date in the firm half is.
create or replace function public.guard_work_mark()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.id is distinct from old.id
     or new.post_id is distinct from old.post_id
     or new.user_id is distinct from old.user_id
     or new.file_path is distinct from old.file_path
     or new.file_name is distinct from old.file_name
     or new.note is distinct from old.note
     or new.declared_clean is distinct from old.declared_clean
     or new.submitted_at is distinct from old.submitted_at then
    raise exception 'A submission is what was handed in; only the marking may change';
  end if;
  if new.verdict is distinct from old.verdict
     or new.feedback is distinct from old.feedback then
    new.marked_at := now();
  end if;
  return new;
end;
$$;

create or replace trigger work_submissions_guard
  before update on public.work_submissions
  for each row execute function public.guard_work_mark();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.work_posts       enable row level security;
alter table public.work_claims      enable row level security;
alter table public.work_submissions enable row level security;

-- A post is seen by the people it is for, by every coach, and by anybody who
-- already put their name on it. The last clause is what lets a coach
-- unpublish a post to stop new claims without hiding it from somebody who
-- has already handed work in against it.
drop policy if exists work_posts_read on public.work_posts;
create policy work_posts_read on public.work_posts
  for select to authenticated using (
    public.work_visible(work_posts)
    or public.is_coach()
    or exists (
      select 1 from public.work_claims c
      where c.post_id = work_posts.id and c.user_id = auth.uid()
    )
  );

-- And a coach may write them, as with sessions.
drop policy if exists work_posts_write on public.work_posts;
create policy work_posts_write on public.work_posts
  for all to authenticated using (public.is_coach()) with check (public.is_coach());

-- Your own name, on a task you can actually see. Insert and select only, for
-- everybody: nobody, including an administrator, takes a name off.
drop policy if exists work_claims_read on public.work_claims;
create policy work_claims_read on public.work_claims
  for select to authenticated using (user_id = auth.uid() or public.is_coach());

drop policy if exists work_claims_insert_own on public.work_claims;
create policy work_claims_insert_own on public.work_claims
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.work_posts p
      where p.id = work_claims.post_id and p.kind = 'task' and public.work_visible(p)
    )
  );

-- Your own work, on something you put your name on. The intern never edits
-- or removes a submission; a coach may mark it, and the trigger above keeps
-- that to the marking columns.
drop policy if exists work_submissions_read on public.work_submissions;
create policy work_submissions_read on public.work_submissions
  for select to authenticated using (user_id = auth.uid() or public.is_coach());

drop policy if exists work_submissions_insert_own on public.work_submissions;
create policy work_submissions_insert_own on public.work_submissions
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.work_claims c
      where c.post_id = work_submissions.post_id and c.user_id = auth.uid()
    )
  );

drop policy if exists work_submissions_mark on public.work_submissions;
create policy work_submissions_mark on public.work_submissions
  for update to authenticated using (public.is_coach()) with check (public.is_coach());

-- -----------------------------------------------------------------------------
-- The bucket
-- -----------------------------------------------------------------------------
-- Private, unlike avatars. Nobody reads it with a bare URL: the server checks
-- the row through the policies above and hands out a short-lived signed
-- link. Coaches write under posts/, an intern writes under their own folder
-- of submissions/, and only a coach may list or read objects directly.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('work', 'work', false, 20971520, array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists work_read_coach on storage.objects;
create policy work_read_coach on storage.objects
  for select to authenticated using (bucket_id = 'work' and public.is_coach());

drop policy if exists work_posts_insert_coach on storage.objects;
create policy work_posts_insert_coach on storage.objects
  for insert to authenticated with check (
    bucket_id = 'work' and (storage.foldername(name))[1] = 'posts' and public.is_coach()
  );

drop policy if exists work_posts_update_coach on storage.objects;
create policy work_posts_update_coach on storage.objects
  for update to authenticated
  using (bucket_id = 'work' and (storage.foldername(name))[1] = 'posts' and public.is_coach())
  with check (bucket_id = 'work' and (storage.foldername(name))[1] = 'posts' and public.is_coach());

drop policy if exists work_posts_delete_coach on storage.objects;
create policy work_posts_delete_coach on storage.objects
  for delete to authenticated using (
    bucket_id = 'work' and (storage.foldername(name))[1] = 'posts' and public.is_coach()
  );

drop policy if exists work_submissions_insert_own on storage.objects;
create policy work_submissions_insert_own on storage.objects
  for insert to authenticated with check (
    bucket_id = 'work'
    and (storage.foldername(name))[1] = 'submissions'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
