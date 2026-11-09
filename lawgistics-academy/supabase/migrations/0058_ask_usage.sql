-- =============================================================================
-- A daily limit on the "Ask" box, without keeping what was asked
-- =============================================================================
-- The owner, November 2026: a box on Today where a learner asks a question and
-- gets an answer drawn only from the lessons a lawyer has signed off. Each
-- answer the AI writes costs money, so each person gets a daily number.
--
-- This records only that a question was asked, and when. Never the question,
-- never the answer: nothing a person typed is kept. Server only: no policy for
-- anybody, the server reads and writes it with the service role. Deleting an
-- account deletes its rows.

create table if not exists public.ask_usage (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users (id) on delete cascade,
  asked_at  timestamptz not null default now()
);

create index if not exists ask_usage_user_idx on public.ask_usage (user_id, asked_at desc);

alter table public.ask_usage enable row level security;
revoke all on public.ask_usage from public, anon, authenticated;
grant select, insert on public.ask_usage to service_role;
revoke update, truncate on public.ask_usage from service_role;
