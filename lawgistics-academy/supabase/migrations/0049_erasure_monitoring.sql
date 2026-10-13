-- =============================================================================
-- A record of every nightly run, so an unfinished deletion cannot go unseen
-- =============================================================================
-- The owner's finding: "The nightly erasure endpoint can return HTTP 200
-- while deletion jobs remain incomplete." The route now reads back what is
-- still unfinished after it retries, answers 200 only when nothing is, and
-- keeps a row here for every run: when it ran, its level (ok, warning or
-- escalate), how many deletions were unfinished, tried, finished, still
-- failing, not attempted (the batch limit or the deadline stopped it) and
-- failing repeatedly, how long the oldest has waited, and whether the alert
-- went out. Admin, Deletions shows the last few, and every admin page warns
-- an administrator when the job has not run for thirty-six hours.
--
-- Counts, ages and levels only: nothing in a row names anybody, so no row
-- needs erasing when an account is deleted.
--
-- The server's alone: no table right and no policy for anybody signed in or
-- signed out. The service role may read and add rows; a row is never
-- changed or removed, by anybody (the trigger refuses it even for the
-- table's owner), because "the check ran and found this" is only worth
-- something if it cannot be rewritten afterwards. Re-runnable.
-- =============================================================================

create table if not exists public.operational_runs (
  id                       uuid primary key default gen_random_uuid(),
  job                      text not null,
  started_at               timestamptz not null,
  finished_at              timestamptz not null default now(),
  status                   text not null,
  outstanding              integer,
  tried                    integer,
  completed                integer,
  still_failing            integer,
  not_attempted            integer,
  repeatedly_failing       integer,
  oldest_outstanding_hours integer,
  alert_sent               boolean not null default false,
  alert_error              text
);

alter table public.operational_runs drop constraint if exists operational_runs_job_name;
alter table public.operational_runs add constraint operational_runs_job_name check (
  job ~ '^[a-z0-9][a-z0-9-]{0,62}$'
);
alter table public.operational_runs drop constraint if exists operational_runs_status;
alter table public.operational_runs add constraint operational_runs_status check (
  status in ('ok', 'warning', 'escalate')
);
alter table public.operational_runs drop constraint if exists operational_runs_counts;
alter table public.operational_runs add constraint operational_runs_counts check (
  coalesce(outstanding, 0) >= 0 and coalesce(tried, 0) >= 0 and coalesce(completed, 0) >= 0
  and coalesce(still_failing, 0) >= 0 and coalesce(not_attempted, 0) >= 0
  and coalesce(repeatedly_failing, 0) >= 0 and coalesce(oldest_outstanding_hours, 0) >= 0
  and coalesce(completed, 0) <= coalesce(tried, 0)
);
-- "ok" means nothing was left unfinished, and is recorded only when that was read.
alter table public.operational_runs drop constraint if exists operational_runs_ok_means_none_left;
alter table public.operational_runs add constraint operational_runs_ok_means_none_left check (
  status <> 'ok' or coalesce(outstanding = 0, false)
);
alter table public.operational_runs drop constraint if exists operational_runs_finished_after_start;
alter table public.operational_runs add constraint operational_runs_finished_after_start check (
  finished_at >= started_at
);
alter table public.operational_runs drop constraint if exists operational_runs_error_length;
alter table public.operational_runs add constraint operational_runs_error_length check (
  alert_error is null or length(alert_error) <= 500
);

create index if not exists operational_runs_job_started_idx
  on public.operational_runs (job, started_at desc);

alter table public.operational_runs enable row level security;
-- No policy for anybody: the server reads and writes it with the service role.
revoke all on public.operational_runs from public, anon, authenticated, service_role;
grant select, insert on public.operational_runs to service_role;

-- Kept as it was written. Update, delete and truncate are refused for
-- everybody, the table's owner included.
create or replace function public.guard_operational_run()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'A record of a nightly run is kept as it was written';
end;
$$;

revoke all on function public.guard_operational_run() from public, anon, authenticated, service_role;

create or replace trigger operational_runs_guard
  before update or delete on public.operational_runs
  for each row execute function public.guard_operational_run();

create or replace trigger operational_runs_no_truncate
  before truncate on public.operational_runs
  for each statement execute function public.guard_operational_run();

-- The restrictive policy refusing a deleted account (0045) on this table too.
-- SETUP.sql and UPDATE.sql run this again at the very end anyway.
do $$
begin
  if to_regprocedure('public.refuse_erased_callers()') is not null then
    perform public.refuse_erased_callers();
  end if;
end
$$;
