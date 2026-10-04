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
-- A learner reads their own conversations and coaches read everybody's, so a
-- supervisor can see where somebody is stuck; the page says so before the
-- first message. Nothing here is written by a learner directly: the server
-- writes each message after checking who is asking, and once written a
-- message is never changed or removed, by anybody.
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

alter table public.tutor_conversations drop constraint if exists tutor_conversations_mode_known;
alter table public.tutor_conversations
  add constraint tutor_conversations_mode_known check (mode in ('explain', 'test'));
alter table public.tutor_conversations drop constraint if exists tutor_conversations_topic_present;
alter table public.tutor_conversations
  add constraint tutor_conversations_topic_present check (length(trim(topic)) between 1 and 200);

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

alter table public.tutor_messages drop constraint if exists tutor_messages_role_known;
alter table public.tutor_messages
  add constraint tutor_messages_role_known check (role in ('learner', 'tutor'));
alter table public.tutor_messages drop constraint if exists tutor_messages_body_present;
alter table public.tutor_messages
  add constraint tutor_messages_body_present check (length(trim(body)) between 1 and 6000);

create index if not exists tutor_messages_by_conversation
  on public.tutor_messages (conversation_id, created_at);

-- The time of a message is the database's, and a message, once written,
-- stays as it was: a coach reading a conversation reads what was said.
create or replace function public.stamp_tutor_row()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    return new;
  end if;
  raise exception 'tutor conversations are kept as they were said';
end;
$$;

create or replace trigger tutor_conversations_stamp
  before insert or update on public.tutor_conversations
  for each row execute function public.stamp_tutor_row();
create or replace trigger tutor_messages_stamp
  before insert or update on public.tutor_messages
  for each row execute function public.stamp_tutor_row();

alter table public.tutor_conversations enable row level security;
alter table public.tutor_messages enable row level security;

drop policy if exists tutor_conversations_read on public.tutor_conversations;
create policy tutor_conversations_read on public.tutor_conversations
  for select to authenticated using (user_id = auth.uid() or public.is_coach());

drop policy if exists tutor_messages_read on public.tutor_messages;
create policy tutor_messages_read on public.tutor_messages
  for select to authenticated using (
    exists (
      select 1 from public.tutor_conversations c
      where c.id = conversation_id and (c.user_id = auth.uid() or public.is_coach())
    )
  );
