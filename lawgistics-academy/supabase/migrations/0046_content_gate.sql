-- =============================================================================
-- Lessons, court maps and other legal content reach learners only once signed
-- =============================================================================
-- The owner's decision: hide unverified lessons and legal court content until
-- a qualified lawyer approves them, in Australia and Malaysia alike. 0044 did
-- this for questions and daily facts. This does it for the rest.
--
-- Lessons, each country's court map and the comparison essay topics live in
-- the code, not the database, so the app decides what a learner is sent
-- (src/lib/content/gate.ts and service.ts). A sign-off is recorded here, and
-- it is pinned to a fingerprint (SHA-256) of every word a learner would see,
-- worked out from the code each time. Changing a word in the code changes
-- the fingerprint, so the old sign-off stops covering it: the change itself
-- withdraws it, and nobody has to remember to.
--
-- What this file does in the database:
--
-- 1. content_signoffs records sign-offs of court maps and essay topics, the
--    same way lesson_signoffs (0032) records lessons: written by the server
--    after it has checked who is asking, only for a coach or administrator,
--    stamped with the database's time, never changed or deleted.
-- 2. The lawyer's approach to a matter (matter_model_answer) is given to a
--    learner only while the matter's current wording is signed off. Editing
--    a matter clears its sign-off (0027), so a learner who handed in before a
--    rewrite does not receive the new, unchecked words.
-- 3. A learner reads a matter only when it is published, signed off and not
--    flagged. Published already implied signed (0027); this says it in the
--    read rule too, the way 0044 did for questions and facts.
-- 4. The legal sources table, which nobody has signed and no learner page
--    uses, is readable by staff only.
--
-- Staff (an administrator, a coach, a firm administrator) still read
-- everything, so they can review it; the app labels what is not yet checked.
-- Re-runnable: everything is guarded or replaced.
-- =============================================================================

-- 1. Sign-offs of court maps and essay topics ----------------------------------

create table if not exists public.content_signoffs (
  id           uuid primary key default gen_random_uuid(),
  content_key  text not null,
  content_hash text not null,
  signed_by    uuid not null references auth.users (id) on delete restrict,
  signed_at    timestamptz not null default now()
);

alter table public.content_signoffs drop constraint if exists content_signoffs_key_shape;
alter table public.content_signoffs
  add constraint content_signoffs_key_shape check (content_key ~ '^[a-z0-9-]{3,80}$');
alter table public.content_signoffs drop constraint if exists content_signoffs_hash_shape;
alter table public.content_signoffs
  add constraint content_signoffs_hash_shape check (content_hash ~ '^[0-9a-f]{64}$');

-- One sign-off per wording. Signing the same words twice adds nothing.
create unique index if not exists content_signoffs_one_per_wording
  on public.content_signoffs (content_key, content_hash);

-- Only a lawyer on the staff signs off: a coach or an administrator, never a
-- firm administrator on that flag alone (0037). Nobody signs in somebody
-- else's name. The time is the database's, and a sign-off, once given,
-- stays as it was.
create or replace function public.guard_content_signoff()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not exists (
      select 1 from public.profiles p
      where p.id = new.signed_by and (p.is_coach or p.is_admin)
    ) then
      raise exception 'Court maps and essay topics are signed off by a coach or an administrator';
    end if;
    if auth.uid() is not null and new.signed_by is distinct from auth.uid() then
      raise exception 'Nobody signs off in somebody else''s name';
    end if;
    new.signed_at := now();
    return new;
  end if;
  raise exception 'A sign-off is kept as it was given';
end;
$$;

revoke all on function public.guard_content_signoff() from public;

create or replace trigger content_signoffs_guard
  before insert or update or delete on public.content_signoffs
  for each row execute function public.guard_content_signoff();

-- Read and written by the server only: no policy lets anybody at it through
-- the database directly, so a browser can neither add a sign-off nor learn
-- from one which content exists.
alter table public.content_signoffs enable row level security;
revoke all on public.content_signoffs from anon, authenticated;

-- 2. The lawyer's approach, only while it is signed off ------------------------
-- Redefined whole from its 0027 body. Staff read it as before.

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
      or (
        a.user_id = auth.uid()
        and a.submitted_at is not null
        and m.verified_by is not null
        and not m.review_flagged
      )
    );
$$;

revoke all on function public.matter_model_answer(uuid) from public;
revoke all on function public.matter_model_answer(uuid) from anon;
grant execute on function public.matter_model_answer(uuid) to authenticated;

-- 3. A learner reads a matter only when it is published and signed off --------
-- Redefined whole from its 0027 body, with the sign-off added.

drop policy if exists matters_read on public.matters;
create policy matters_read on public.matters
  for select to authenticated using (
    public.is_coach()
    or (
      published
      and verified_by is not null
      and not review_flagged
      and country = (select p.country from public.profiles p where p.id = auth.uid())
    )
  );

-- 4. Legal sources: staff only -------------------------------------------------
-- Nothing in this table has a sign-off, and no learner page reads it.

drop policy if exists legal_sources_read on public.legal_sources;
create policy legal_sources_read on public.legal_sources
  for select to authenticated using (public.is_coach());
