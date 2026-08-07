-- =============================================================================
-- Daily brief -- one verified legal fact per day
-- =============================================================================
-- A fact is content, so it carries the same provenance and sign-off discipline
-- as a question: jurisdiction, source, and a human verification step before it
-- can be published.
--
-- It is simpler than a question in one respect. Nothing a learner does is
-- recorded against a fact, so there is no mastery to protect and no need for
-- immutable versioning. Correcting a fact just corrects it.
--
-- And in one other respect: there is no answer key, so nothing has to be hidden
-- from the browser. Learners read published facts directly under RLS rather
-- than through a delivery view.
-- =============================================================================

create type publication_status as enum (
  'draft', 'requires_review', 'verified', 'published', 'retired'
);

create table public.daily_facts (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,

  -- The hook. One sentence, stated as a proposition.
  title               text not null,
  -- Two to four sentences explaining it.
  body                text not null,
  -- Optional: what it means for someone actually practising.
  why_it_matters      text,

  jurisdiction        jurisdiction not null default 'AU_GENERAL',
  court               text,
  domain_id           uuid references public.domains (id) on delete set null,

  source_reference    text,
  source_url          text,
  source_checked_on   date,

  status              publication_status not null default 'draft',
  verification_status verification_status not null default 'unverified',
  verified_by         uuid references auth.users (id) on delete set null,
  verified_at         timestamptz,

  -- Controls rotation order. Facts cycle in this order and do not repeat until
  -- the whole published pool has been through.
  sort_order          int not null default 0,

  created_by          uuid references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index daily_facts_rotation_idx
  on public.daily_facts (sort_order, id) where status = 'published';

create trigger daily_facts_touch before update on public.daily_facts
  for each row execute function public.touch_updated_at();

alter table public.daily_facts enable row level security;

-- Learners read the published pool. Nothing here is secret; the rotation is
-- computed server-side from the calendar date.
create policy daily_facts_read_published on public.daily_facts
  for select to authenticated using (status = 'published');

create policy daily_facts_admin on public.daily_facts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
