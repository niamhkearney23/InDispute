-- =============================================================================
-- Trainee-only videos, and comments on the work board
-- =============================================================================
-- Two things the owner asked for once the trainee programme had a start date.
--
-- TRAINEE-ONLY VIDEOS. The coach posts a short video every morning of the
-- programme about what the trainees are doing that day. It is for them:
-- an intern on the general academy, or a student who signed up from the
-- home page, should not see it. Until now a published session was shown to
-- everybody in its country. A session can now be marked for confirmed
-- trainees only, and that is decided here, in the read policy, not by a
-- page remembering to filter. Existing sessions keep the default, which is
-- everybody, so nothing already published disappears.
--
-- COMMENTS AND WHO IS ON IT. A lawyer posts a piece of work for the
-- trainees or for everybody. People put their names on it (that already
-- exists, 0019), and now everybody who can see the post sees who is on it
-- and can say something underneath. This is different from the message
-- thread (0020), which is private between one intern and the coaches.
-- Comments are public to the post's readers.
--
-- Names. Other people are shown by first name only, through two security
-- definer functions, because profiles are not readable across learners and
-- should not become so. The first-name rule is the leaderboard's (0025): a
-- display name that is empty, has an @ in it, or is really the email's
-- local part comes back as "Someone", so nobody's inbox lands on a page the
-- whole cohort reads.
--
-- Comments are on the record. Insert and select only, for everybody: a
-- comment is not edited into something else afterwards and is not deleted
-- to make a thread read differently. The date is the database's.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Trainee-only sessions
-- -----------------------------------------------------------------------------
alter table public.coach_sessions
  add column if not exists trainees_only boolean not null default false;

-- A learner sees what is published and meant for them. A trainee-only
-- session needs a confirmed trainee: saying you are a trainee at sign-up
-- opens nothing until a coach confirms it (0023). Coaches see everything,
-- drafts included, as before.
drop policy if exists coach_sessions_read on public.coach_sessions;
create policy coach_sessions_read on public.coach_sessions
  for select to authenticated using (
    (published and (not trainees_only or public.is_confirmed_trainee()))
    or public.is_coach()
  );

-- -----------------------------------------------------------------------------
-- 2. Who may see a post, as one function
-- -----------------------------------------------------------------------------
-- The same three ways in as the read policy on work_posts (0024): it is
-- meant for them, they are staff, or they already put their name on it and
-- still qualify. Security definer, so a comment policy can ask the question
-- without reading work_posts and work_claims through the caller's own RLS.
create or replace function public.can_see_work_post(post uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select public.work_visible(p)
         or public.is_coach()
         or (
           exists (
             select 1 from public.work_claims c
             where c.post_id = p.id and c.user_id = auth.uid()
           )
           and (not p.trainees_only or public.is_confirmed_trainee())
         )
       from public.work_posts p where p.id = post),
    false
  );
$$;

revoke all on function public.can_see_work_post(uuid) from public;
revoke all on function public.can_see_work_post(uuid) from anon;
grant execute on function public.can_see_work_post(uuid) to authenticated;

-- The first name a cohort sees, or "Someone". One definition, used by both
-- functions below.
create or replace function public.shown_first_name(display_name text, email text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when nullif(trim(display_name), '') is null then 'Someone'
    when display_name like '%@%' then 'Someone'
    when lower(trim(display_name)) = lower(split_part(coalesce(email, ''), '@', 1)) then 'Someone'
    else split_part(trim(display_name), ' ', 1)
  end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Comments
-- -----------------------------------------------------------------------------
create table if not exists public.work_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.work_posts (id) on delete restrict,
  author_id  uuid references auth.users (id) on delete set null,
  body       text not null check (length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists work_comments_post_idx
  on public.work_comments (post_id, created_at);

-- The date is the record, so it is the database's and never the request's.
create or replace function public.stamp_work_comment()
returns trigger language plpgsql set search_path = public as $$
begin
  new.created_at := now();
  return new;
end;
$$;

create or replace trigger work_comments_stamp
  before insert on public.work_comments
  for each row execute function public.stamp_work_comment();

alter table public.work_comments enable row level security;

drop policy if exists work_comments_read on public.work_comments;
create policy work_comments_read on public.work_comments
  for select to authenticated using (public.can_see_work_post(post_id));

-- Anybody who can see a published post may say something under it, as
-- themselves. Staff may comment on a draft too, to leave a note for each
-- other before it goes up. No update and no delete policy, for anybody.
drop policy if exists work_comments_insert on public.work_comments;
create policy work_comments_insert on public.work_comments
  for insert to authenticated with check (
    author_id = auth.uid()
    and (
      public.is_coach()
      or exists (
        select 1 from public.work_posts p
        where p.id = work_comments.post_id
          and p.published
          and public.can_see_work_post(p.id)
      )
    )
  );

-- -----------------------------------------------------------------------------
-- 4. Names, for people who can see the post
-- -----------------------------------------------------------------------------
-- Who has their name on each post the caller can see. First names only,
-- and no ids: what the page needs is "Aisyah, Wei and you", not a handle on
-- another person's account.
create or replace function public.work_board_people()
returns table (post_id uuid, first_name text, is_me boolean, claimed_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select c.post_id,
         public.shown_first_name(p.display_name, p.email),
         c.user_id = auth.uid(),
         c.claimed_at
  from public.work_claims c
  join public.profiles p on p.id = c.user_id
  where auth.uid() is not null
    and public.can_see_work_post(c.post_id)
  order by c.post_id, c.claimed_at;
$$;

revoke all on function public.work_board_people() from public;
revoke all on function public.work_board_people() from anon;
grant execute on function public.work_board_people() to authenticated;

-- The comments under one post, oldest first, with who wrote each. Staff
-- are marked so a lawyer's answer stands out from the cohort's.
create or replace function public.work_post_comments(post uuid)
returns table (
  id uuid,
  body text,
  created_at timestamptz,
  first_name text,
  is_me boolean,
  is_staff boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select w.id,
         w.body,
         w.created_at,
         coalesce(public.shown_first_name(p.display_name, p.email), 'Someone'),
         w.author_id is not null and w.author_id = auth.uid(),
         coalesce(p.is_admin or coalesce(p.is_coach, false), false)
  from public.work_comments w
  left join public.profiles p on p.id = w.author_id
  where w.post_id = post
    and auth.uid() is not null
    and public.can_see_work_post(post)
  order by w.created_at, w.id;
$$;

revoke all on function public.work_post_comments(uuid) from public;
revoke all on function public.work_post_comments(uuid) from anon;
grant execute on function public.work_post_comments(uuid) to authenticated;
