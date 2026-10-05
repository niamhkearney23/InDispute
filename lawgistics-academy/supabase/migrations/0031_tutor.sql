-- =============================================================================
-- The tutor
-- =============================================================================
-- Two ways to practise with an AI tutor. "Explain it back": the learner
-- explains an idea as if to a ten-year-old and the tutor stops them at jargon,
-- skipped steps and oversimplification, asking one question at a time.
-- "Test me": five questions from the lawyer-verified bank, one at a time,
-- each followed by what the answer suggests is missing.
--
-- The tutor never states law of its own. What it says about the law comes
-- from a verified question's explanation, which is shown beside it.
--
-- A learner reads their own conversations through the database. Staff read
-- them only through the server, which shows a coach the conversations of
-- people the firm supervises and an administrator everybody's; the page
-- says who can read before the first message. Nothing here is written by a
-- learner directly: the server writes each message after checking who is
-- asking. Once written a message is never changed or deleted, with one
-- exception: an administrator may blank one (somebody typed a client's
-- name), and the record shows who did it and when.
-- =============================================================================

create table if not exists public.tutor_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  mode        text not null,
  topic       text not null,
  -- The module a "Test me" draws its questions from.
  module_slug text,
  created_at  timestamptz not null default now()
);

-- How many questions this "Test me" was set at when it started, so the
-- count it shows ("Question 2 of 5") does not move if questions are
-- signed off or taken back while it runs.
alter table public.tutor_conversations add column if not exists test_length smallint;

alter table public.tutor_conversations drop constraint if exists tutor_conversations_mode_known;
alter table public.tutor_conversations
  add constraint tutor_conversations_mode_known check (mode in ('explain', 'test'));
alter table public.tutor_conversations drop constraint if exists tutor_conversations_topic_present;
alter table public.tutor_conversations
  add constraint tutor_conversations_topic_present check (length(trim(topic)) between 1 and 200);
alter table public.tutor_conversations drop constraint if exists tutor_conversations_test_length_range;
alter table public.tutor_conversations
  add constraint tutor_conversations_test_length_range
  check (test_length is null or test_length between 1 and 5);

create index if not exists tutor_conversations_by_user
  on public.tutor_conversations (user_id, created_at desc);

create table if not exists public.tutor_messages (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     uuid not null references public.tutor_conversations (id) on delete cascade,
  role                text not null,
  body                text not null,
  -- "Test me": the verified question this message asks or answers.
  question_version_id uuid references public.question_versions (id) on delete restrict,
  -- "Test me": the option the learner chose, and whether it was right,
  -- worked out by the server from the answer key.
  chosen_option       text,
  correct             boolean,
  created_at          timestamptz not null default now()
);

-- When an administrator blanked this message, and who.
alter table public.tutor_messages add column if not exists redacted_at timestamptz;
alter table public.tutor_messages
  add column if not exists redacted_by uuid references auth.users (id) on delete set null;

alter table public.tutor_messages drop constraint if exists tutor_messages_role_known;
alter table public.tutor_messages
  add constraint tutor_messages_role_known check (role in ('learner', 'tutor'));
alter table public.tutor_messages drop constraint if exists tutor_messages_body_present;
alter table public.tutor_messages
  add constraint tutor_messages_body_present check (length(trim(body)) between 1 and 6000);

create index if not exists tutor_messages_by_conversation
  on public.tutor_messages (conversation_id, created_at);

-- One answer to each question in a test, and each question asked once. Two
-- presses of "Answer" (or two tabs) cannot both be marked, and cannot ask
-- the next question twice.
create unique index if not exists tutor_messages_one_answer
  on public.tutor_messages (conversation_id, question_version_id)
  where role = 'learner' and question_version_id is not null;
create unique index if not exists tutor_messages_one_asking
  on public.tutor_messages (conversation_id, question_version_id)
  where role = 'tutor' and question_version_id is not null;

-- The time of a row is the database's, and a row, once written, stays as it
-- was: a coach reading a conversation reads what was said. Nothing is
-- deleted on its own either; a conversation goes only when the account it
-- belongs to does (a delete that arrives by cascade, from inside another
-- trigger, so pg_trigger_depth() is above one).
create or replace function public.stamp_tutor_row()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    return new;
  end if;
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'tutor conversations are kept as they were said';
end;
$$;

-- A message: the same, except that an administrator may blank one, once.
-- Only the body changes, only to the fixed words, and the time is the
-- database's. Who did it is set by the server from the signed-in
-- administrator and must be present.
create or replace function public.guard_tutor_message()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.redacted_at := null;
    new.redacted_by := null;
    return new;
  end if;
  if tg_op = 'DELETE' then
    if pg_trigger_depth() > 1 then
      return old;
    end if;
    raise exception 'tutor conversations are kept as they were said';
  end if;
  if old.redacted_at is null
     and new.redacted_by is not null
     and new.body = '[Removed by an administrator]'
     and (new.id, new.conversation_id, new.role, new.question_version_id,
          new.chosen_option, new.correct, new.created_at)
         is not distinct from
         (old.id, old.conversation_id, old.role, old.question_version_id,
          old.chosen_option, old.correct, old.created_at) then
    new.redacted_at := now();
    return new;
  end if;
  raise exception 'tutor conversations are kept as they were said';
end;
$$;

create or replace trigger tutor_conversations_stamp
  before insert or update or delete on public.tutor_conversations
  for each row execute function public.stamp_tutor_row();
create or replace trigger tutor_messages_stamp
  before insert or update or delete on public.tutor_messages
  for each row execute function public.guard_tutor_message();

alter table public.tutor_conversations enable row level security;
alter table public.tutor_messages enable row level security;

drop policy if exists tutor_conversations_read on public.tutor_conversations;
create policy tutor_conversations_read on public.tutor_conversations
  for select to authenticated using (user_id = auth.uid());

drop policy if exists tutor_messages_read on public.tutor_messages;
create policy tutor_messages_read on public.tutor_messages
  for select to authenticated using (
    exists (
      select 1 from public.tutor_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
