-- =============================================================================
-- Daily homework
-- =============================================================================
-- The next piece of the placement program in "Lawgistics Academy: the
-- brief": four weeks of daily homework, one task per working day, tied to
-- the learner's own start date rather than to a firm-wide calendar.
--
-- A task here is something the person does in the firm, not something they
-- read about the law, so nothing in it needs a lawyer's sign-off and none of
-- it enters the review queue. The tasks themselves live in code
-- (src/content/seed/homework.ts) for the same reason the certification boxes
-- do: twenty fixed items that a firm adjusts once, not content anybody edits
-- in the app.
--
-- This table holds one fact and nothing else: that a person said they had
-- done day N. No marking, no confirmation, no upload. It is the same trust
-- model as an ordinary firm step that needs no firm check, and the same
-- append-only treatment, because it is a record a firm may later rely on to
-- show what an intern was set and what they said they did.
-- =============================================================================

create table if not exists public.homework_declarations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,

  -- Which working day of their own placement, one to twenty. Bounded here and
  -- not merely in the application: a row for day 37 would be a record of
  -- homework that does not exist. Four weeks is twenty working days, and a
  -- longer program is a migration rather than a silently wider column.
  day         smallint not null check (day between 1 and 20),

  -- The task as it stood when they ticked it. If the firm rewrites day three
  -- next year, this row still says which task was actually done.
  task_slug   text not null,

  declared_at timestamptz not null default now(),

  unique (user_id, day)
);

create index if not exists homework_declarations_user_idx
  on public.homework_declarations (user_id, day);

-- As in 0008: the date is the whole evidentiary value of the row, so it is
-- the database's and never the request's.
create or replace trigger homework_declarations_stamp
  before insert on public.homework_declarations
  for each row execute function public.stamp_declared_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.homework_declarations enable row level security;

-- Insert and select only, exactly as firm_step_declarations. There is no
-- update or delete policy for anybody, administrators included: an
-- administrator who could tick somebody's homework, or untick it, would turn
-- "they told us they had done it" into something the firm said to itself.
drop policy if exists homework_declarations_insert_own on public.homework_declarations;
create policy homework_declarations_insert_own on public.homework_declarations
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists homework_declarations_select_own on public.homework_declarations;
create policy homework_declarations_select_own on public.homework_declarations
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
