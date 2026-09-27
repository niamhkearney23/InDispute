-- =============================================================================
-- What a second audit found
-- =============================================================================
-- A second pass over the schema, after 0022 and 0023, found one thing 0022
-- itself got wrong and a handful of smaller gaps.
--
-- 1. The rule that nobody signs off their own writing was added "not valid",
--    to leave older rows alone. Postgres checks such a rule again whenever a
--    row changes, so any item somebody had already signed off themselves
--    could no longer be changed at all: not withdrawn, not flagged, not
--    replaced by a new version. Those sign-offs are cleared here, because
--    under the rule they were never sign-offs, and the rule is then checked
--    against every row. The items go back to "needs review" and show in the
--    queue as such. Nothing about what learners can see changes here.
--
-- 2. A hand-in's file path could climb out of its folder with "..", which
--    the link-signing on the server then followed to somebody else's file.
--    The path must now be exactly the shape the app writes.
--
-- 3. The name and date on a published session or a posted piece of work
--    could be rewritten after the fact, and a certification entry could be
--    logged under another coach's name, when written directly.
--
-- 4. A learner could rewrite the email address on their own profile, which
--    is how staff pages identify people, so a stranger could pose as the
--    trainee a coach was expecting and be confirmed. Email and the date the
--    account was made are now the server's, along with the placement dates
--    and "must change password" on a newly made profile.
--
-- 5. A staff confirmation of a trainee made directly now records the person
--    who made it and the moment, not values from the request.
--
-- 6. An acknowledgement could be recorded against a version that is not the
--    current one of a published policy.
--
-- 7. The count of names on each piece of work showed posts the reader could
--    not otherwise see.
--
-- 8. An administrator could confirm their own checklist item, or clear
--    themselves, by writing directly; the app refused it, the database now
--    does too.
--
-- 9. Somebody who took a place on trainee work before 0023, or who has been
--    moved off the programme since, kept seeing that work and its files.
-- =============================================================================

-- 1. Self sign-offs -------------------------------------------------------------

update public.question_versions
set verification_status = 'requires_review',
    verified_by = null,
    verified_at = null,
    review_due_on = null
where verified_by is not null
  and created_by is not null
  and verified_by = created_by;

update public.daily_facts
set verification_status = 'requires_review',
    verified_by = null,
    verified_at = null,
    review_due_on = null
where verified_by is not null
  and created_by is not null
  and verified_by = created_by;

do $$
begin
  alter table public.question_versions validate constraint question_versions_not_self_verified;
  alter table public.daily_facts validate constraint daily_facts_not_self_verified;
exception when others then
  raise notice 'self sign-off rule left unvalidated: %', sqlerrm;
end
$$;

-- 2. A hand-in's file is where the app put it ------------------------------------

alter table public.work_submissions
  drop constraint if exists work_submissions_own_folder;
alter table public.work_submissions
  add constraint work_submissions_own_folder check (
    file_path ~ ('^submissions/' || user_id::text || '/' || post_id::text || '/[0-9]+\.[a-z0-9]+$')
  ) not valid;

do $$
begin
  alter table public.work_submissions validate constraint work_submissions_own_folder;
exception when others then
  raise notice 'hand-in path rule left unvalidated: %', sqlerrm;
end
$$;

-- 3. Names and dates on what coaches publish -----------------------------------

create or replace function public.stamp_coach_session()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.published and not coalesce(old.published, false) then
    new.published_at := now();
    if auth.uid() is not null then
      new.published_by := auth.uid();
    end if;
  elsif new.published then
    -- Still published: who published it, and when, stay as they were.
    new.published_at := old.published_at;
    new.published_by := old.published_by;
  else
    new.published_at := null;
    new.published_by := null;
  end if;
  return new;
end;
$$;

create or replace function public.stamp_work_post()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.published and not coalesce(old.published, false) then
    new.published_at := now();
  elsif new.published then
    new.published_at := old.published_at;
  else
    new.published_at := null;
  end if;
  if tg_op = 'UPDATE' then
    new.posted_by := old.posted_by;
  end if;
  return new;
end;
$$;

create or replace function public.stamp_created_by()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

create or replace trigger certification_trainees_author
  before insert on public.certification_trainees
  for each row execute function public.stamp_created_by();

create or replace trigger certification_entries_author
  before insert on public.certification_entries
  for each row execute function public.stamp_created_by();

-- 4. What a person may not change about their own profile ------------------------

create or replace function public.guard_profile_identity()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Only reachable where the signup trigger did not make the row. Nothing
    -- the firm decides may arrive with it.
    new.starts_on := null;
    new.ends_on := null;
    new.must_change_password := false;
    new.diagnostic_completed_at := null;
    new.created_at := now();
    return new;
  end if;

  new.email := old.email;
  new.created_at := old.created_at;
  -- Set by the server when the diagnostic is finished, not by the learner.
  new.diagnostic_completed_at := old.diagnostic_completed_at;
  -- A person may clear "choose your own password", never set it.
  if new.must_change_password and not old.must_change_password then
    new.must_change_password := false;
  end if;
  return new;
end;
$$;

create or replace trigger profiles_guard_identity
  before insert or update on public.profiles
  for each row execute function public.guard_profile_identity();

-- 5. A trainee confirmation carries who made it ----------------------------------

create or replace function public.guard_trainee_approval()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') or public.is_coach() then
    if new.track is distinct from 'litigation_trainee' then
      new.trainee_approved_at := null;
      new.trainee_approved_by := null;
    elsif auth.uid() is not null
          and new.trainee_approved_at is not null
          and (tg_op = 'INSERT' or old.trainee_approved_at is null) then
      -- A member of staff confirming directly: their name, now.
      new.trainee_approved_at := now();
      new.trainee_approved_by := auth.uid();
    elsif auth.uid() is not null and tg_op = 'UPDATE' and new.trainee_approved_at is not null then
      new.trainee_approved_at := old.trainee_approved_at;
      new.trainee_approved_by := old.trainee_approved_by;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' or new.track is distinct from old.track then
    new.trainee_approved_at := null;
    new.trainee_approved_by := null;
  else
    new.trainee_approved_at := old.trainee_approved_at;
    new.trainee_approved_by := old.trainee_approved_by;
  end if;
  return new;
end;
$$;

-- 6. Acknowledging the policy that is actually in force --------------------------

drop policy if exists firm_ack_insert_own on public.firm_module_acknowledgements;
create policy firm_ack_insert_own on public.firm_module_acknowledgements
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.firm_module_versions v
      join public.firm_modules m on m.id = v.firm_module_id
      where v.id = firm_module_version_id
        and v.is_current
        and m.published
    )
  );

-- 7. Counts only for work the reader can see ------------------------------------

create or replace view public.work_claim_counts as
select c.post_id, count(*)::integer as claims
from public.work_claims c
where exists (
  select 1 from public.work_posts p
  where p.id = c.post_id
    and (public.work_visible(p) or public.is_coach()
         or exists (select 1 from public.work_claims mine
                    where mine.post_id = p.id and mine.user_id = auth.uid()))
)
group by c.post_id;

revoke all on public.work_claim_counts from anon;
grant select on public.work_claim_counts to authenticated;

-- 8. Nobody confirms or clears themselves, in the database too -------------------
-- The app already refuses it. This is the same rule where a direct write
-- cannot reach round it.

drop policy if exists firm_step_confirmations_insert on public.firm_step_confirmations;
create policy firm_step_confirmations_insert on public.firm_step_confirmations
  for insert to authenticated
  with check (public.is_admin() and confirmed_by = auth.uid() and user_id <> auth.uid());

drop policy if exists onboarding_decisions_insert on public.onboarding_decisions;
create policy onboarding_decisions_insert on public.onboarding_decisions
  for insert to authenticated
  with check (public.is_admin() and decided_by = auth.uid() and user_id <> auth.uid());

-- 9. Keeping a trainee post you took needs you to still be a trainee -------------
-- Somebody who put their name on a post keeps seeing it after it is
-- unpublished, deliberately. For a post that is for trainees, that now also
-- needs them to be a confirmed trainee, so anybody who took a place before
-- 0023, or who has since been moved off the programme, loses it.

create or replace function public.is_confirmed_trainee()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select track = 'litigation_trainee' and trainee_approved_at is not null
     from public.profiles where id = auth.uid()),
    false
  );
$$;

drop policy if exists work_posts_read on public.work_posts;
create policy work_posts_read on public.work_posts
  for select to authenticated using (
    public.work_visible(work_posts)
    or public.is_coach()
    or (
      exists (
        select 1 from public.work_claims c
        where c.post_id = work_posts.id and c.user_id = auth.uid()
      )
      and (not work_posts.trainees_only or public.is_confirmed_trainee())
    )
  );

drop policy if exists work_messages_insert on public.work_messages;
create policy work_messages_insert on public.work_messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and (
      public.is_coach()
      or (
        thread_user_id = auth.uid()
        and exists (
          select 1 from public.work_posts p
          where p.id = work_messages.post_id
            and (public.work_visible(p) or (
              exists (
                select 1 from public.work_claims c
                where c.post_id = p.id and c.user_id = auth.uid()
              )
              and (not p.trainees_only or public.is_confirmed_trainee())
            ))
        )
      )
    )
  );
