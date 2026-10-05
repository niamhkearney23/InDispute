-- =============================================================================
-- Lesson sign-offs
-- =============================================================================
-- Lessons are written in the code, not the database, so a reviewer can fix a
-- sentence in one line. Until now nothing recorded that a lawyer had read
-- one. This does: a coach or administrator signs off a lesson exactly as it
-- stands, and the sign-off is pinned to a fingerprint of every word a learner
-- sees (`content_hash`, SHA-256 of the lesson's content). Change a word, a
-- guess or which answer is right and the fingerprint changes, so the old
-- sign-off no longer covers it and the lesson needs signing again.
--
-- A rewritten lesson is shown to learners only once it is signed off. A
-- sign-off is a record somebody is answerable for: it is written by the
-- server after checking who is asking, carries their name and the
-- database's time, and is never changed or deleted.
-- =============================================================================

create table if not exists public.lesson_signoffs (
  id           uuid primary key default gen_random_uuid(),
  lesson_slug  text not null,
  content_hash text not null,
  signed_by    uuid not null references auth.users (id) on delete restrict,
  signed_at    timestamptz not null default now()
);

alter table public.lesson_signoffs drop constraint if exists lesson_signoffs_slug_shape;
alter table public.lesson_signoffs
  add constraint lesson_signoffs_slug_shape check (lesson_slug ~ '^[a-z0-9-]{3,80}$');
alter table public.lesson_signoffs drop constraint if exists lesson_signoffs_hash_shape;
alter table public.lesson_signoffs
  add constraint lesson_signoffs_hash_shape check (content_hash ~ '^[0-9a-f]{64}$');

-- One sign-off per wording. Signing the same words twice adds nothing.
create unique index if not exists lesson_signoffs_one_per_wording
  on public.lesson_signoffs (lesson_slug, content_hash);

-- Only a coach or administrator signs a lesson off, the time is the
-- database's, and a sign-off, once given, stays as it was.
create or replace function public.guard_lesson_signoff()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not exists (
      select 1 from public.profiles p
      where p.id = new.signed_by and (p.is_coach or p.is_admin)
    ) then
      raise exception 'a lesson is signed off by a coach or an administrator';
    end if;
    new.signed_at := now();
    return new;
  end if;
  raise exception 'a lesson sign-off is kept as it was given';
end;
$$;

create or replace trigger lesson_signoffs_guard
  before insert or update or delete on public.lesson_signoffs
  for each row execute function public.guard_lesson_signoff();

-- Read and written by the server only: no policy lets anybody at it through
-- the database directly, so a learner's browser cannot add one.
alter table public.lesson_signoffs enable row level security;
