-- =============================================================================
-- Verification expires, so the record stays true for as long as the firm has it
-- =============================================================================
-- Until now, `human_verified` was permanent. A lawyer signed an item off once
-- and it stayed signed off, for good.
--
-- That is fine for a demonstration and wrong for something a firm keeps. Rules
-- of court are amended. Practice notes are reissued. The Bar Council replaced
-- its 2023 AI circular in 2025. None of that touches a verification stamp, so
-- the longer the app runs the more of its content is confidently wrong, and the
-- stamp that was the whole point becomes the thing doing the damage: an item
-- nobody has checked at least looks unchecked.
--
-- So a verification now has a date it runs out on, and when it does the item
-- goes back into the queue by itself. Three things follow:
--
--   * The reviewer chooses how long it holds. They are the only one who knows
--     whether they just verified that the plaintiff bears the onus of proof or
--     that a filing fee is RM 100. A regex cannot tell those apart and should
--     not try; the queue's risk score only picks the default.
--
--   * A verified row cannot exist without a date. Enforced by a trigger rather
--     than a constraint, so rows written before this migration are repaired on
--     the way past instead of rejected.
--
--   * Losing verification clears the date. An item that was flagged is not
--     "verified until March", it is not verified.
-- =============================================================================

alter table public.question_versions
  add column if not exists review_due_on date;

alter table public.daily_facts
  add column if not exists review_due_on date;

comment on column public.question_versions.review_due_on is
  'When this verification runs out and the item returns to the review queue.';
comment on column public.daily_facts.review_due_on is
  'When this verification runs out and the item returns to the review queue.';

-- -----------------------------------------------------------------------------
-- No verification without an expiry
-- -----------------------------------------------------------------------------
-- A default rather than a rule: twelve months is what the application sends
-- when nobody chooses, and this is the backstop for anything that reaches the
-- table another way.
create or replace function public.stamp_review_due()
returns trigger language plpgsql as $$
begin
  if new.verification_status = 'human_verified' then
    if new.review_due_on is null then
      new.review_due_on := current_date + interval '12 months';
    end if;
  else
    -- Not verified means not verified. Carrying the old date forward would
    -- leave a flagged item looking like it had been signed off until March.
    new.review_due_on := null;
  end if;
  return new;
end;
$$;

create or replace trigger question_versions_review_due
  before insert or update on public.question_versions
  for each row execute function public.stamp_review_due();

create or replace trigger daily_facts_review_due
  before insert or update on public.daily_facts
  for each row execute function public.stamp_review_due();

-- Anything signed off before this migration existed. Given a year from today
-- rather than backdated: the sign-off was real, it simply had no end date, and
-- inventing one in the past would put the whole bank into the queue at once and
-- teach everybody to ignore it.
update public.question_versions
  set review_due_on = current_date + interval '12 months'
  where verification_status = 'human_verified' and review_due_on is null;

update public.daily_facts
  set review_due_on = current_date + interval '12 months'
  where verification_status = 'human_verified' and review_due_on is null;

-- -----------------------------------------------------------------------------
-- Finding what has lapsed
-- -----------------------------------------------------------------------------
create index if not exists question_versions_review_due_idx
  on public.question_versions (review_due_on)
  where verification_status = 'human_verified';

create index if not exists daily_facts_review_due_idx
  on public.daily_facts (review_due_on)
  where verification_status = 'human_verified';
