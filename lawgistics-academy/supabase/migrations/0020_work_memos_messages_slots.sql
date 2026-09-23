-- =============================================================================
-- The work board, second pass: a voice memo, a message thread, and how many
-- people may take a task
-- =============================================================================
-- Three things a lawyer asked for after using the board for a day.
--
-- A VOICE MEMO. A lawyer explaining a task out loud for a minute is how they
-- would brief a junior in the corridor, and it is often clearer than what
-- they would type. The recording is a file in the same private bucket as
-- everything else on the board, under the post, signed for by row exactly
-- as the post's document is.
--
-- A MESSAGE THREAD. "Message me for more info" is the sentence under every
-- task. One thread per intern per post: the intern and the coaches, nobody
-- else. Append-only, like everything an intern writes in the firm half: a
-- question asked is a question asked, and nobody edits it afterwards.
--
-- HOW MANY. "For one person" and "for everyone" were the two choices; the
-- lawyer wants "three people" as well. So the choice becomes a number, or
-- nothing for no limit, and the first-name-wins rule becomes the first N
-- names win. The old two-value column goes: two sources of truth for the
-- same rule is how a rule quietly stops holding.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- The memo, and a time estimate the coach confirms
-- -----------------------------------------------------------------------------
alter table public.work_posts add column if not exists memo_path text;
alter table public.work_posts add column if not exists memo_type text;

-- How long the coach expects it to take, in minutes. The app may suggest a
-- number, but what is stored is what the coach saved: an estimate shown to
-- an intern under the coach's name has to be the coach's.
alter table public.work_posts add column if not exists expected_minutes smallint;
alter table public.work_posts
  drop constraint if exists work_posts_expected_minutes_positive;
alter table public.work_posts
  add constraint work_posts_expected_minutes_positive check (
    expected_minutes is null or expected_minutes between 1 and 6000
  );

-- The bucket now takes what a browser records: WebM and Ogg on most
-- browsers, MP4 on Safari, and MP3 and WAV for anybody attaching a file
-- recorded elsewhere.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('work', 'work', false, 20971520, array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav'
])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- How many people may take it
-- -----------------------------------------------------------------------------
alter table public.work_posts add column if not exists max_claims smallint;
alter table public.work_posts
  drop constraint if exists work_posts_max_claims_positive;
alter table public.work_posts
  add constraint work_posts_max_claims_positive check (
    max_claims is null or max_claims between 1 and 100
  );

-- Carry the old two-way choice across, then retire it. Guarded so a second
-- paste of the update file, after the column is gone, does nothing.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'work_posts' and column_name = 'scope'
  ) then
    update public.work_posts set max_claims = 1 where max_claims is null and scope = 'one';
    alter table public.work_posts drop column scope;
  end if;
end $$;

drop type if exists public.work_scope;

-- The first N names win. Everything said about this trigger in 0019 still
-- holds: security definer, because as the intern both the lock and the
-- count would come back empty; a row lock on the post, because that is the
-- only thing that stops two clicks at the same moment from both getting
-- the last place.
create or replace function public.guard_work_claim()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  post public.work_posts%rowtype;
  taken integer;
begin
  select * into post from public.work_posts where id = new.post_id for update;
  if not found then
    raise exception 'That piece of work does not exist';
  end if;
  if post.kind <> 'task' then
    raise exception 'A material is for reading, not for claiming';
  end if;
  if post.max_claims is not null then
    select count(*) into taken from public.work_claims where post_id = new.post_id;
    if taken >= post.max_claims then
      raise exception 'This piece of work already has all the names it can take';
    end if;
  end if;
  -- The date is the record, so it is the database's and never the request's.
  new.claimed_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Messages
-- -----------------------------------------------------------------------------
-- A thread is (post, intern). The intern writes into their own; a coach
-- writes into any. Nobody edits or deletes: this is the firm half's rule
-- for anything a person says on the record, and a question to a supervisor
-- is on the record.
create table if not exists public.work_messages (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references public.work_posts (id) on delete restrict,
  -- Whose thread this is: always the intern, even when a coach is writing.
  thread_user_id uuid not null references auth.users (id) on delete cascade,
  sender_id      uuid not null references auth.users (id) on delete set null,
  body           text not null check (length(body) between 1 and 2000),
  sent_at        timestamptz not null default now()
);

create index if not exists work_messages_thread_idx
  on public.work_messages (post_id, thread_user_id, sent_at);

create or replace function public.stamp_work_message()
returns trigger language plpgsql set search_path = public as $$
begin
  new.sent_at := now();
  return new;
end;
$$;

create or replace trigger work_messages_stamp
  before insert on public.work_messages
  for each row execute function public.stamp_work_message();

alter table public.work_messages enable row level security;

drop policy if exists work_messages_read on public.work_messages;
create policy work_messages_read on public.work_messages
  for select to authenticated using (thread_user_id = auth.uid() or public.is_coach());

-- An intern may write into their own thread on a post they can see. A coach
-- may write into any thread. In both cases the sender is the caller and
-- nobody else: a message under somebody's name is that person's message.
drop policy if exists work_messages_insert on public.work_messages;
create policy work_messages_insert on public.work_messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and (
      public.is_coach()
      or (
        thread_user_id = auth.uid()
        and exists (
          select 1 from public.work_posts p
          where p.id = work_messages.post_id
            and (public.work_visible(p) or exists (
              select 1 from public.work_claims c
              where c.post_id = p.id and c.user_id = auth.uid()
            ))
        )
      )
    )
  );
