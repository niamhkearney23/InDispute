-- =============================================================================
-- A lapsed sign-off stops content; the server cannot empty or delete records
-- =============================================================================
-- Two findings of the independent review of October 2026.
--
-- 1. A SIGN-OFF THAT HAS RUN OUT IS NOT A SIGN-OFF. Since 0010 every
--    verification carries the date it runs out on (`review_due_on`, chosen by
--    the reviewer), and the tutor has always treated an item past that date as
--    no longer checked. Daily training and the daily brief did not: the
--    delivery view and the facts read policy asked for `human_verified` and
--    never for the date, and nothing moves a lapsed item back to the queue. So
--    a question a lawyer checked for six months kept being given out, with its
--    explanation, in month seven. The view and the policy now ask for the date
--    as the tutor does (none set, or still in the future), and the app asks
--    again before it shows an explanation for a version given out earlier.
--
-- 2. EMPTYING A TABLE IS REFUSED TO EVERY ROLE THE APP USES. Supabase grants
--    anon, authenticated and service_role every right on a new table,
--    TRUNCATE included, and TRUNCATE ignores Row Level Security and row
--    triggers. Neither the website nor the API can send one (PostgREST has no
--    such verb, and none of the three roles can sign in to the database), so
--    this closes a door nobody can reach today, for the day something can.
--    Nothing in the app empties a table. Future tables are covered by
--    changing the defaults, and a schema guarantee checks every table.
--
--    And the server's role no longer deletes the records that exist to prove
--    something was done: a deletion job and its review items (0045), whose
--    disappearing would make the nightly check report nothing outstanding
--    (0049), the sign-offs of lessons, court maps and essays (0032, 0046),
--    morning notes (0050), and the certification register, whose rows a
--    review item points at. The app never deletes from any of them.
--
--    Taking the right away is not the whole of it, because a cascade runs as
--    the table's owner. A deletion job cascades from its person in Supabase
--    Auth, and the server's key can delete a person there (the admin API).
--    So a job is refused deletion by trigger until it is finished and its
--    review closed, and a review item until it is decided. Deleting, in
--    Supabase Auth, somebody whose deletion is unfinished now fails, which is
--    the point. (Sign-offs and notes never cascaded: deleting their author in
--    Auth was already refused, by `on delete restrict` and their triggers.)
--
-- None of this protects anything from the database owner or a Supabase
-- administrator, who can change or drop any of it. It holds the line for the
-- roles the application runs as.
-- =============================================================================

-- 1. Lapsed sign-offs ----------------------------------------------------------
-- The view is redefined whole from its 0044 body, with the date added.

create or replace view public.v_question_delivery
with (security_invoker = false) as
select
  q.id                as question_id,
  q.slug,
  q.country,
  q.domain_id,
  d.slug              as domain_slug,
  d.name              as domain_name,
  qv.id               as question_version_id,
  qv.version,
  qv.question_type,
  qv.scenario,
  qv.stem,
  qv.options,
  qv.difficulty,
  qv.jurisdiction,
  qv.court
from public.questions q
join public.question_versions qv
  on qv.question_id = q.id and qv.is_current
join public.domains d on d.id = q.domain_id
where q.status = 'published'
  and qv.verification_status = 'human_verified'
  and (qv.review_due_on is null or qv.review_due_on > current_date)
  and (
    current_user in ('service_role', 'postgres', 'supabase_admin')
    or public.is_coach()
    or q.country = public.caller_country()
  );

drop policy if exists daily_facts_read_published on public.daily_facts;
create policy daily_facts_read_published on public.daily_facts
  for select to authenticated using (
    status = 'published'
    and verification_status = 'human_verified'
    and (review_due_on is null or review_due_on > current_date)
    and (public.is_coach() or country = public.caller_country())
  );

-- 2. No emptying, and no deleting the proof ------------------------------------

do $$
declare
  t record;
begin
  for t in
    select c.oid::regclass as rel
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  loop
    execute format('revoke truncate on %s from public, anon, authenticated, service_role', t.rel);
  end loop;
end;
$$;

-- Tables made later by the same owner start without it.
alter default privileges in schema public
  revoke truncate on tables from public, anon, authenticated, service_role;

revoke delete on public.account_erasures from service_role;
revoke delete on public.erasure_review_items from service_role;
revoke delete on public.lesson_signoffs from service_role;
revoke delete on public.content_signoffs from service_role;
revoke delete on public.certification_trainees from service_role;
revoke delete on public.certification_entries from service_role;

create or replace function public.keep_unfinished_erasure()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_table_name = 'account_erasures'
     and (old.completed_at is null or old.review_closed_at is null) then
    raise exception 'An unfinished deletion is kept until it is finished and its review closed.'
      using errcode = '42501';
  end if;
  if tg_table_name = 'erasure_review_items' and old.decision is null then
    raise exception 'A review item is kept until somebody decides it.' using errcode = '42501';
  end if;
  return old;
end;
$$;
revoke all on function public.keep_unfinished_erasure() from public;

create or replace trigger account_erasures_keep_unfinished
  before delete on public.account_erasures
  for each row execute function public.keep_unfinished_erasure();
create or replace trigger erasure_review_items_keep_undecided
  before delete on public.erasure_review_items
  for each row execute function public.keep_unfinished_erasure();

-- Morning notes were refused by trigger alone (0050); the rights go as well.
revoke delete on public.morning_notes from anon, authenticated, service_role;
