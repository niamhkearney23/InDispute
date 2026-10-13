-- =============================================================================
-- The sign-off guard no longer reads the sign-in accounts table itself
-- =============================================================================
-- guard_signoff (0040) checks, when "who wrote this" is being emptied, whether
-- the writer's account still exists, by reading auth.users. The server's role
-- (service_role) may not read auth.users on Supabase. Postgres checks table
-- permissions for the whole statement when it plans it, whether or not that
-- part would run, and after a connection has run the guard about five times
-- it switches to a plan that keeps the lookup. From then on every update the
-- server makes to a daily fact, a question version or a matter on that
-- connection failed with "permission denied for table users": signing off,
-- and loading the content again. The integration tests against real
-- Supabase found it; the plain-Postgres tests could not, because there the
-- role may read the table.
--
-- The lookup now goes through a function that runs as its owner and says
-- only whether an account exists. guard_signoff is redefined whole from its
-- 0040 body with that one expression changed.
-- =============================================================================

create or replace function public.account_exists(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from auth.users u where u.id = uid);
$$;

-- Postgres checks the right to call a function when it prepares the
-- statement, not when the call is reached, so everybody who may update these
-- tables needs it, signed-in staff included. It says only whether an account
-- with a given id (a random 128-bit number) exists.
revoke all on function public.account_exists(uuid) from public, anon;
grant execute on function public.account_exists(uuid) to authenticated, service_role;

create or replace function public.guard_signoff()
returns trigger language plpgsql set search_path = public as $$
declare
  server boolean := current_user in ('service_role', 'postgres', 'supabase_admin');
  was jsonb;
  now_is jsonb;
  col text;
  reworded boolean := false;
  signing boolean;
begin
  if tg_op = 'UPDATE' then
    -- Who wrote it is what stops them signing it off. It empties only when
    -- the account itself is removed, which is the foreign key doing it.
    if old.created_by is not null and new.created_by is null
       and (not server or public.account_exists(old.created_by)) then
      raise exception 'Who wrote this is part of the record and cannot be cleared';
    end if;

    was := to_jsonb(old);
    now_is := to_jsonb(new);
    foreach col in array tg_argv loop
      if now_is -> col is distinct from was -> col then
        reworded := true;
      end if;
    end loop;

    -- A sign-off was a statement about the words that were there. New words
    -- have not been signed off by anybody, whatever the request said.
    if reworded then
      if new.verification_status = 'human_verified' then
        new.verification_status := 'requires_review';
      end if;
      new.verified_by := null;
      new.verified_at := null;
      new.review_due_on := null;
      if old.verification_status = 'human_verified' then
        if tg_table_name = 'daily_facts' then
          if new.status = 'verified' then
            new.status := 'requires_review';
          end if;
        elsif new.is_current then
          update public.questions set status = 'requires_review'
          where id = new.question_id and status = 'verified';
        end if;
      end if;
      return new;
    end if;
  end if;

  -- Giving a sign-off: a new name, or the status coming back to verified.
  signing := new.verified_by is not null and (
    tg_op = 'INSERT'
    or new.verified_by is distinct from old.verified_by
    or (new.verification_status = 'human_verified'
        and old.verification_status is distinct from 'human_verified')
  );

  if signing then
    -- Through the API the name on a sign-off is the person signed in. The
    -- server signs for the coach whose session it checked, and names them.
    if not server and new.verified_by is distinct from auth.uid() then
      raise exception 'A sign-off is in the name of the person giving it';
    end if;
    new.verified_at := now();
  elsif not server and new.verification_status = 'human_verified'
        and (tg_op = 'INSERT' or old.verification_status is distinct from 'human_verified') then
    raise exception 'A sign-off is in the name of the person giving it';
  elsif tg_op = 'UPDATE' then
    -- No new sign-off, so its date stays as it was, or goes with the name.
    new.verified_at := case when new.verified_by is null then null else old.verified_at end;
  elsif new.verified_by is null then
    new.verified_at := null;
  end if;
  return new;
end;
$$;
