-- =============================================================================
-- Morning notes: a few lines from the coach at the top of Today
-- =============================================================================
-- The owner, October 2026: "make it more like a coach, and this is the
-- homework." The academy reads as homework a lawyer set, so the first thing on
-- Today is that lawyer, in their own words: what to do this morning and what
-- they will look at. A coach writes it at Admin, Morning notes, for one date,
-- for everyone or only for confirmed trainees, in one country or both.
--
-- It sits beside sessions (0012) and work posts (0019), for the same reason
-- and on the same terms. It is the coach's own teaching under their own name:
-- no version chain, no answer key, no sign-off, never the review queue, never
-- the training engine. It is not legal content we stand behind; it is a
-- supervisor speaking to the people they supervise, and it says whose words
-- they are.
--
-- Three rules, held here and not only in the form:
--
--   * A NOTE IS ALWAYS IN ITS AUTHOR'S NAME. Whoever is signed in writes as
--     themselves, and nobody moves a note to somebody else afterwards. Words
--     put in front of juniors under a lawyer's name have to be that lawyer's.
--
--   * ONLY ITS AUTHOR CORRECTS IT. A coach fixes their own typo the way they
--     fix a session; another coach writes their own note instead of editing a
--     colleague's words under the colleague's name.
--
--   * NOTHING IS DELETED. There is no delete policy for anybody. Somebody read
--     it and acted on it; "my coach told me to do the chronology first" has to
--     stay true afterwards. A coach who regrets one writes another.
-- =============================================================================

create table if not exists public.morning_notes (
  id            uuid primary key default gen_random_uuid(),
  body          text not null,
  -- The morning it is for, in the coach's own calendar. Today shows the
  -- latest note for the learner's date.
  for_date      date not null,
  -- Null means both countries: how to run a morning is rarely one country's.
  country       country,
  trainees_only boolean not null default false,
  -- The profile, so pages can show the name with the words.
  author_id     uuid not null default auth.uid() references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint morning_notes_body_length check (char_length(btrim(body)) between 1 and 700)
);

create index if not exists morning_notes_for_date_idx
  on public.morning_notes (for_date desc, created_at desc);

-- The author is the caller, and stays who it was. The service role (the
-- server) has no auth.uid(), and names the coach it checked itself.
create or replace function public.guard_morning_note()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and new.author_id is distinct from auth.uid() then
      raise exception 'A note is written in your own name.' using errcode = '42501';
    end if;
    new.created_at := now();
  else
    if new.author_id is distinct from old.author_id then
      raise exception 'A note stays in the name of whoever wrote it.' using errcode = '42501';
    end if;
    if auth.uid() is not null and old.author_id is distinct from auth.uid() then
      raise exception 'Only the coach who wrote a note may change it.' using errcode = '42501';
    end if;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger morning_notes_guard
  before insert or update on public.morning_notes
  for each row execute function public.guard_morning_note();

alter table public.morning_notes enable row level security;

-- A learner reads the notes meant for them: their country or both, and a
-- trainee-only note only once a coach has confirmed them (0023). Staff read
-- everything. The app reads through the server and applies the same rule.
drop policy if exists morning_notes_read on public.morning_notes;
create policy morning_notes_read on public.morning_notes
  for select to authenticated using (
    public.is_coach()
    or (
      (country is null or country = public.caller_country())
      and (not trainees_only or public.is_confirmed_trainee())
    )
  );

drop policy if exists morning_notes_insert on public.morning_notes;
create policy morning_notes_insert on public.morning_notes
  for insert to authenticated with check (public.is_coach());

drop policy if exists morning_notes_update on public.morning_notes;
create policy morning_notes_update on public.morning_notes
  for update to authenticated using (public.is_coach()) with check (public.is_coach());

-- No delete policy, for anybody, and the server cannot delete one either:
-- the service role passes RLS, so the refusal is a trigger. See the note at
-- the top.
create or replace function public.refuse_morning_note_delete()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'A morning note is never deleted. Write another one instead.' using errcode = '42501';
end;
$$;

create or replace trigger morning_notes_no_delete
  before delete on public.morning_notes
  for each row execute function public.refuse_morning_note_delete();

-- Emptying the table skips row triggers, so it is refused on its own, as
-- operational_runs does (0049). Found by the independent review.
create or replace trigger morning_notes_no_truncate
  before truncate on public.morning_notes
  for each statement execute function public.refuse_morning_note_delete();
