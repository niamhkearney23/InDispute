-- =============================================================================
-- Matters: a problem first, then how a lawyer would approach it
-- =============================================================================
-- A matter is a short practice file. The learner gets the facts and a time
-- limit, and works four tasks: identify the procedure, draft a short advice,
-- record a spoken explanation of up to three minutes, and answer five
-- follow-up questions asked about their own draft. Once they hand it in they
-- see the lawyer's approach, and a coach may mark it Good or Needs another go.
--
-- A matter is legal content, so it follows the questions' rules:
--
--   * An administrator writes it. A coach signs it off. Nobody signs off what
--     they wrote, and that is a constraint here, not only a check in the app.
--   * Nothing is published until it is signed off, and changing what a
--     matter says clears the sign-off and takes it down again, so a signed
--     record always describes the words that were actually checked.
--   * The lawyer's approach is never readable by a learner before they have
--     handed in their own attempt. Column grants keep it out of the table's
--     public face; one security definer function hands it over, and only for
--     an attempt the caller owns and has submitted.
--
-- An attempt keeps a copy of the matter as it stood when it was started, so
-- a later edit never changes what somebody was actually asked. What they
-- hand in is frozen once submitted: marking can add a verdict and a
-- paragraph, and nothing else.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Matters
-- -----------------------------------------------------------------------------
create table if not exists public.matters (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  number             smallint not null default 1 check (number between 1 and 999),
  title              text not null check (length(title) between 3 and 200),
  country            country not null default 'MY',
  area               text not null default '' check (length(area) <= 80),
  brief              text not null check (length(brief) between 20 and 6000),
  time_limit_minutes smallint not null default 45 check (time_limit_minutes between 5 and 240),
  procedure_prompt   text not null default 'Identify the applicable procedure, and the rule or provision it comes from.',
  draft_prompt       text not null default 'Draft a short advice to the client: what they should do, by when, and why.',
  speak_prompt       text not null default 'Explain your advice out loud, as you would to the client, in no more than three minutes.',
  model_answer       text not null default '' check (length(model_answer) <= 12000),
  sources            text not null default '' check (length(sources) <= 2000),
  published          boolean not null default false,
  published_at       timestamptz,
  verified_by        uuid
                     references auth.users (id) on delete set null,
  verified_at        timestamptz,
  review_flagged     boolean not null default false,
  review_note        text not null default '' check (length(review_note) <= 2000),
  reviewed_by        uuid
                     references auth.users (id) on delete set null,
  reviewed_at        timestamptz,
  created_by         uuid
                     references auth.users (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Nobody signs off their own writing.
alter table public.matters drop constraint if exists matters_not_self_verified;
alter table public.matters
  add constraint matters_not_self_verified check (
    verified_by is null or created_by is null or verified_by <> created_by
  );

-- Nothing reaches a learner unchecked, and nothing flagged stays up.
alter table public.matters drop constraint if exists matters_published_only_when_verified;
alter table public.matters
  add constraint matters_published_only_when_verified check (
    not published or (verified_by is not null and not review_flagged)
  );

create or replace trigger matters_touch
  before update on public.matters
  for each row execute function public.touch_updated_at();

-- Changing what a matter says clears its sign-off and takes it down. The
-- sign-off was a statement about particular words; it does not carry over to
-- new ones. Publishing stamps its own date.
create or replace function public.guard_matter()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (
       new.title is distinct from old.title
    or new.country is distinct from old.country
    or new.area is distinct from old.area
    or new.brief is distinct from old.brief
    or new.time_limit_minutes is distinct from old.time_limit_minutes
    or new.procedure_prompt is distinct from old.procedure_prompt
    or new.draft_prompt is distinct from old.draft_prompt
    or new.speak_prompt is distinct from old.speak_prompt
    or new.model_answer is distinct from old.model_answer
    or new.sources is distinct from old.sources
  ) then
    new.verified_by := null;
    new.verified_at := null;
    new.published := false;
  end if;

  -- A flag takes it down, as a flag on a question does.
  if new.review_flagged then
    new.published := false;
  end if;

  if new.verified_by is not null
     and (tg_op = 'INSERT' or new.verified_by is distinct from old.verified_by) then
    new.verified_at := now();
  end if;

  if new.published and (tg_op = 'INSERT' or not old.published) then
    new.published_at := now();
  elsif not new.published then
    new.published_at := null;
  end if;
  return new;
end;
$$;

create or replace trigger matters_guard
  before insert or update on public.matters
  for each row execute function public.guard_matter();

alter table public.matters enable row level security;

-- A learner sees published matters for their own country; staff see all.
-- Writes go through the server, after the role is checked, so there is no
-- write policy for anybody.
drop policy if exists matters_read on public.matters;
create policy matters_read on public.matters
  for select to authenticated using (
    public.is_coach()
    or (
      published
      and country = (select p.country from public.profiles p where p.id = auth.uid())
    )
  );

-- The lawyer's approach is not part of what a learner can select. Every
-- other column is.
revoke select on public.matters from anon, authenticated;
grant select (
  id, slug, number, title, country, area, brief, time_limit_minutes,
  procedure_prompt, draft_prompt, speak_prompt, published, published_at,
  verified_at, created_at, updated_at
) on public.matters to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Attempts
-- -----------------------------------------------------------------------------
create table if not exists public.matter_attempts (
  id                 uuid primary key default gen_random_uuid(),
  matter_id          uuid not null
                     references public.matters (id) on delete restrict,
  user_id            uuid not null
                     references auth.users (id) on delete cascade,
  started_at         timestamptz not null default now(),
  deadline_at        timestamptz not null default now(),
  snapshot           jsonb not null default '{}'::jsonb,
  procedure_answer   text not null default '' check (length(procedure_answer) <= 4000),
  draft_answer       text not null default '' check (length(draft_answer) <= 12000),
  recording_path     text,
  recording_seconds  smallint check (recording_seconds is null or recording_seconds between 1 and 200),
  followup_questions jsonb not null default '[]'::jsonb,
  followup_answers   jsonb not null default '[]'::jsonb,
  followups_by_ai    boolean,
  followups_asked_at timestamptz,
  submitted_at       timestamptz,
  submitted_late     boolean,
  verdict            work_verdict,
  feedback           text not null default '' check (length(feedback) <= 4000),
  marked_by          uuid
                     references auth.users (id) on delete set null,
  marked_at          timestamptz
);

create index if not exists matter_attempts_user_idx
  on public.matter_attempts (user_id, matter_id, started_at desc);

-- One open attempt per person per matter. Another go is a new attempt, once
-- the last one is handed in.
create unique index if not exists matter_attempts_one_open
  on public.matter_attempts (matter_id, user_id) where submitted_at is null;

-- Starting: the clock, the deadline and the copy of the matter are the
-- database's, never the request's. Security definer, because the copy is
-- taken from columns a learner cannot read; the lawyer's approach is left out
-- of it all the same.
create or replace function public.stamp_matter_attempt()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m public.matters%rowtype;
begin
  select * into m from public.matters where id = new.matter_id;
  if not found then
    raise exception 'That matter does not exist';
  end if;
  new.started_at := now();
  new.deadline_at := now() + make_interval(mins => m.time_limit_minutes);
  new.snapshot := jsonb_build_object(
    'number', m.number,
    'title', m.title,
    'country', m.country,
    'area', m.area,
    'brief', m.brief,
    'time_limit_minutes', m.time_limit_minutes,
    'procedure_prompt', m.procedure_prompt,
    'draft_prompt', m.draft_prompt,
    'speak_prompt', m.speak_prompt
  );
  new.procedure_answer := '';
  new.draft_answer := '';
  new.recording_path := null;
  new.recording_seconds := null;
  new.followup_questions := '[]'::jsonb;
  new.followup_answers := '[]'::jsonb;
  new.followups_by_ai := null;
  new.followups_asked_at := null;
  new.submitted_at := null;
  new.submitted_late := null;
  new.verdict := null;
  new.feedback := '';
  new.marked_by := null;
  new.marked_at := null;
  return new;
end;
$$;

create or replace trigger matter_attempts_stamp
  before insert on public.matter_attempts
  for each row execute function public.stamp_matter_attempt();

-- After starting: the start, the deadline, the copy and whose it is never
-- change. Handing in stamps its own time and whether it was late. Once
-- handed in, what was handed in is frozen; marking may set the verdict and
-- the paragraph, and only on something handed in.
create or replace function public.guard_matter_attempt()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.matter_id is distinct from old.matter_id
     or new.user_id is distinct from old.user_id
     or new.started_at is distinct from old.started_at
     or new.deadline_at is distinct from old.deadline_at
     or new.snapshot is distinct from old.snapshot then
    raise exception 'An attempt keeps the matter, the person and the clock it started with';
  end if;

  if old.submitted_at is not null then
    if new.procedure_answer is distinct from old.procedure_answer
       or new.draft_answer is distinct from old.draft_answer
       or new.recording_path is distinct from old.recording_path
       or new.recording_seconds is distinct from old.recording_seconds
       or new.followup_questions is distinct from old.followup_questions
       or new.followup_answers is distinct from old.followup_answers
       or new.followups_by_ai is distinct from old.followups_by_ai
       or new.followups_asked_at is distinct from old.followups_asked_at
       or new.submitted_at is distinct from old.submitted_at
       or new.submitted_late is distinct from old.submitted_late then
      raise exception 'What was handed in is not changed afterwards';
    end if;
  elsif new.submitted_at is not null then
    new.submitted_at := now();
    new.submitted_late := now() > old.deadline_at;
  end if;

  if new.verdict is distinct from old.verdict or new.feedback is distinct from old.feedback then
    if old.submitted_at is null then
      raise exception 'Only an attempt that has been handed in can be marked';
    end if;
    new.marked_at := now();
  end if;
  return new;
end;
$$;

create or replace trigger matter_attempts_guard
  before update on public.matter_attempts
  for each row execute function public.guard_matter_attempt();

alter table public.matter_attempts enable row level security;

drop policy if exists matter_attempts_read on public.matter_attempts;
create policy matter_attempts_read on public.matter_attempts
  for select to authenticated using (user_id = auth.uid() or public.is_coach());

-- Starting one: as yourself, on a matter you can see that is up.
drop policy if exists matter_attempts_start on public.matter_attempts;
create policy matter_attempts_start on public.matter_attempts
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matters m
      where m.id = matter_attempts.matter_id and m.published
    )
  );

-- Working on it: your own, until it is handed in. The guard above keeps the
-- clock and the copy fixed, and freezes it at hand-in.
drop policy if exists matter_attempts_work on public.matter_attempts;
create policy matter_attempts_work on public.matter_attempts
  for update to authenticated
  using (user_id = auth.uid() and submitted_at is null)
  with check (user_id = auth.uid() and verdict is null and marked_by is null);

-- Learners may change only the columns their work lives in. The follow-up
-- questions are written by the server, which asks them; the answers are the
-- learner's.
revoke update on public.matter_attempts from anon, authenticated;
grant update (
  procedure_answer, draft_answer, recording_path, recording_seconds,
  followup_answers, submitted_at
) on public.matter_attempts to authenticated;

-- -----------------------------------------------------------------------------
-- 3. The lawyer's approach, after you have handed in your own
-- -----------------------------------------------------------------------------
create or replace function public.matter_model_answer(attempt uuid)
returns table (model_answer text, sources text)
language sql
stable
security definer
set search_path = public
as $$
  select m.model_answer, m.sources
  from public.matter_attempts a
  join public.matters m on m.id = a.matter_id
  where a.id = attempt
    and auth.uid() is not null
    and (
      public.is_coach()
      or (a.user_id = auth.uid() and a.submitted_at is not null)
    );
$$;

revoke all on function public.matter_model_answer(uuid) from public;
revoke all on function public.matter_model_answer(uuid) from anon;
grant execute on function public.matter_model_answer(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Recordings
-- -----------------------------------------------------------------------------
-- Private. A learner uploads into their own folder, for an attempt of their
-- own that is still open; only staff read the bucket directly, and a learner
-- hears their own recording through a short-lived link the server signs
-- after reading the attempt through their own client.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('matter-recordings', 'matter-recordings', false, 4194304, array[
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

drop policy if exists matter_recordings_insert_own on storage.objects;
create policy matter_recordings_insert_own on storage.objects
  for insert to authenticated with check (
    bucket_id = 'matter-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.matter_attempts a
      where a.user_id = auth.uid()
        and a.submitted_at is null
        and a.id::text = (storage.foldername(name))[2]
    )
  );

drop policy if exists matter_recordings_staff_read on storage.objects;
create policy matter_recordings_staff_read on storage.objects
  for select to authenticated using (
    bucket_id = 'matter-recordings' and public.is_coach()
  );

-- -----------------------------------------------------------------------------
-- 5. Certificates
-- -----------------------------------------------------------------------------
-- Issued once, by the server, the first time somebody is seen to have met
-- the requirements: every required module finished and the set number of
-- matters marked Good by a lawyer. Insert and select only, like every other
-- record a firm might rely on.
create table if not exists public.certificates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique
             references auth.users (id) on delete cascade,
  country    country not null,
  matters    smallint not null check (matters >= 1),
  issued_at  timestamptz not null default now()
);

create or replace function public.stamp_certificate()
returns trigger language plpgsql set search_path = public as $$
begin
  new.issued_at := now();
  return new;
end;
$$;

create or replace trigger certificates_stamp
  before insert on public.certificates
  for each row execute function public.stamp_certificate();

alter table public.certificates enable row level security;

drop policy if exists certificates_read on public.certificates;
create policy certificates_read on public.certificates
  for select to authenticated using (user_id = auth.uid() or public.is_coach());
