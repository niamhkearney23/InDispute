-- =============================================================================
-- Sessions: the coach's own teaching, published by the coach, watched by their
-- people at seven in the morning
-- =============================================================================
-- The training runs seven to eight, daily. Until now everything a learner could
-- open at seven was written months earlier by somebody who is not in the room:
-- our questions, our lessons, both compiled into the application and unchangeable
-- without a developer and a deployment.
--
-- The coach is in the room. They know what went wrong in court on Tuesday and
-- what the juniors got wrong last week, and they cannot put any of it in front
-- of anybody. That is the gap this closes. They record something, publish it,
-- and it is there the next morning.
--
-- Three decisions, and they are the design.
--
--   * A COACH MAY PUBLISH THESE, and that does not break the rule that a coach
--     may not write content. That rule is about the question bank: versioned,
--     immutable, carrying an answer key and a sign-off somebody is answerable
--     for, feeding a training engine that decides what a learner sees next.
--     A session is none of those things. It is the coach's own teaching, under
--     the coach's own name, that nobody signs off because nobody else is
--     standing behind it. Keeping the coach out of it would leave the person
--     who actually teaches these juniors unable to teach them.
--
--   * SESSIONS NEVER ENTER THE REVIEW QUEUE, for the same reason firm content
--     does not. The queue exists to sign off statements of law we are
--     answerable for. There is deliberately no verification_status here, and
--     there must not be one: a stamp saying a video had been checked, on a
--     recording nobody transcribed, would be the most misleading thing in the
--     product.
--
--   * SESSIONS NEVER ENTER THE TRAINING POOL. No spaced repetition, no
--     diagnostic, no mastery. Watching is not answering, and a system that
--     counted a video as evidence of a skill would be lying to a firm about
--     what its juniors can do.
--
-- The url is checked twice. Here, so a row that could frame an arbitrary page
-- cannot exist at all, and again in the application before it is rendered. An
-- iframe src is somebody else's page running inside ours, so the question is
-- never whether a link looks safe but whether we chose the host.
-- =============================================================================

create table if not exists public.coach_sessions (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  -- What it covers, so somebody deciding whether to watch at seven in the
  -- morning can decide before pressing play rather than after four minutes.
  summary      text not null default '',
  url          text not null,

  -- Null means everyone. Unlike a question, which is always the law of exactly
  -- one place, a coach talking about how to run a file is often talking about
  -- craft that travels. Making them choose a country would push them to pick
  -- one rather than say "both", and the wrong half would never see it.
  country      country,

  -- The morning it belongs to. Nullable, because not everything is a daily
  -- session: some of it is a library somebody works through in their own time.
  -- When it is set, it is the day the session leads with.
  airs_on      date,

  published    boolean not null default false,

  -- Who put it there. Not decoration: this is somebody's teaching appearing in
  -- front of juniors under the firm's roof, and it should say whose.
  published_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,

  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- The same allowlist the player enforces, as a constraint, so it holds against
-- anything that writes to this table rather than only against the one form that
-- is supposed to. Named hosts rather than a pattern: a rule clever enough to
-- match "any video site" is clever enough to match somewhere we did not choose.
alter table public.coach_sessions
  drop constraint if exists coach_sessions_url_host;
alter table public.coach_sessions
  add constraint coach_sessions_url_host check (
    url ~ '^https://(www\.)?(youtube\.com|youtube-nocookie\.com)/'
    or url ~ '^https://player\.vimeo\.com/'
  );

-- A published session must say who published it and when. Without this, "the
-- coach published it" is an assertion nobody can stand behind, which is the
-- same failure the whole product exists to avoid.
create or replace function public.stamp_coach_session()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.published and not coalesce(old.published, false) then
    new.published_at := now();
  elsif not new.published then
    new.published_at := null;
    new.published_by := null;
  end if;
  return new;
end;
$$;

create or replace trigger coach_sessions_stamp
  before insert or update on public.coach_sessions
  for each row execute function public.stamp_coach_session();

create or replace trigger coach_sessions_touch
  before update on public.coach_sessions
  for each row execute function public.touch_updated_at();

create index if not exists coach_sessions_airing_idx
  on public.coach_sessions (airs_on desc nulls last)
  where published;

alter table public.coach_sessions enable row level security;

-- A learner sees what is published and nothing else. A draft is the coach
-- part-way through writing a title.
drop policy if exists coach_sessions_read on public.coach_sessions;
create policy coach_sessions_read on public.coach_sessions
  for select to authenticated using (published or public.is_coach());

-- And a coach may write them. This is the one place in the product where that
-- is true, and it is deliberate: see the note at the top of this file.
drop policy if exists coach_sessions_write on public.coach_sessions;
create policy coach_sessions_write on public.coach_sessions
  for all to authenticated using (public.is_coach()) with check (public.is_coach());
