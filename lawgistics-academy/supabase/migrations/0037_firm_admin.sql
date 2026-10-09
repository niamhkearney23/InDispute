-- =============================================================================
-- The firm administrator: the firm's own person who runs their people
-- =============================================================================
-- Each firm gets its own copy of the academy: its own Vercel project and its
-- own database, so one firm never shares a table with another. Inside a copy
-- there were two staff flags. An administrator owns the product: writes the
-- questions, matters and daily brief and publishes them. A coach is the lawyer
-- who signs content off and supervises the juniors.
--
-- A firm buying this needs a third: somebody at the firm who runs their own
-- people without being handed the question bank. They invite people and
-- confirm trainees, run the joining checklist and the firm's own documents,
-- make and switch off the firm's codes, set the programme dates, post and mark
-- work, and see the firm's figures. They do not write or publish content.
--
-- In the database a firm administrator is a coach: everything is_coach()
-- opens (the work board, the register, sessions, reading people's records)
-- they need too. In the app they are not a reviewer: signing a question, a
-- matter or a lesson off asks for the coach flag itself, so a firm
-- administrator who is not a lawyer cannot sign legal content off. A firm
-- administrator who is a lawyer is given both flags.
--
-- Only an administrator, the service role or the database owner may change
-- the flag. guard_profile_privileges() is redefined whole here from its
-- latest body (0016), with the new flag added to the first clause.
-- =============================================================================

alter table public.profiles
  add column if not exists is_firm_admin boolean not null default false;

comment on column public.profiles.is_firm_admin is
  'Runs the firm''s own people: invitations, the joining checklist, codes, '
  'programme dates, the work board and the firm''s figures. Never writes or '
  'publishes content, and does not sign content off unless also a coach. '
  'Read through public.is_firm_admin(), which an administrator also answers.';

create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_coach or p.is_admin or p.is_firm_admin
       from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_firm_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_firm_admin or p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_firm_admin() from public;
revoke all on function public.is_firm_admin() from anon;
grant execute on function public.is_firm_admin() to authenticated;

create or replace function public.guard_profile_privileges()
returns trigger language plpgsql set search_path = public as $$
begin
  if (new.is_admin is distinct from old.is_admin
      or new.is_coach is distinct from old.is_coach
      or new.is_firm_admin is distinct from old.is_firm_admin)
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'is_admin, is_coach and is_firm_admin may only be changed by an administrator';
  end if;

  if new.starts_on is distinct from old.starts_on
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'starts_on may only be changed by an administrator';
  end if;

  if new.ends_on is distinct from old.ends_on
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'ends_on may only be changed by an administrator';
  end if;

  new.id := old.id;
  return new;
end;
$$;

-- The leaderboard is the firm's choice, so the firm administrator makes it.
drop policy if exists firm_settings_admin on public.firm_settings;
create policy firm_settings_admin on public.firm_settings
  for update to authenticated using (public.is_firm_admin()) with check (public.is_firm_admin());

-- A firm administrator is staff, so, like administrators and coaches, they
-- are not on the learners' leaderboard. Redefined whole from its 0025 body.
create or replace function public.weekly_leaderboard()
returns table (place integer, first_name text, xp integer, is_me boolean)
language sql
stable
security definer
set search_path = public
as $$
  with totals as (
    select
      p.id,
      -- A first name, or "Someone". A display name that is really the
      -- email's local part (what sign-up fills in when no name is given)
      -- is not a first name and would put the email on every dashboard.
      case
        when nullif(trim(p.display_name), '') is null then 'Someone'
        when p.display_name like '%@%' then 'Someone'
        when lower(trim(p.display_name)) = lower(split_part(coalesce(p.email, ''), '@', 1)) then 'Someone'
        else split_part(trim(p.display_name), ' ', 1)
      end as first_name,
      coalesce(sum(x.amount), 0)::integer as xp
    from public.profiles p
    left join public.xp_events x
      on x.user_id = p.id
     and x.created_at >= now() - interval '7 days'
    where not p.is_admin
      and not coalesce(p.is_coach, false)
      and not p.is_firm_admin
      and not p.leaderboard_opt_out
    group by p.id, p.display_name
  ),
  ranked as (
    select id, first_name, xp,
           rank() over (order by xp desc, first_name asc, id asc)::integer as place
    from totals
    where xp > 0
  )
  select place, first_name, xp, id = auth.uid() as is_me
  from ranked
  where auth.uid() is not null
    and (select leaderboard_enabled from public.firm_settings where id)
    and (place <= 10 or id = auth.uid())
  order by place;
$$;
