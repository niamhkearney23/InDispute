-- =============================================================================
-- The firm's weekly leaderboard
-- =============================================================================
-- XP this week, among the learners of one deployment, first names only.
--
-- Off until an administrator turns it on. Some firms want it and some
-- trainees hate it, so it is the firm's call, made in one place, and a
-- learner who would rather not appear can take themselves off it without
-- asking anybody. Staff never appear: a coach on the table would be the
-- wrong kind of competition.
--
-- The table is read through one function that runs as its owner, because
-- the alternative is a policy letting every learner read every other
-- learner's XP ledger and profile, and the function gives back the only
-- two things a leaderboard needs: a first name and a number. It gives back
-- nothing at all while the setting is off, whoever asks.
-- =============================================================================

create table if not exists public.firm_settings (
  -- One row. The key is the boolean true, and the check keeps it that way.
  id                  boolean primary key default true check (id),
  leaderboard_enabled boolean not null default false,
  updated_at          timestamptz not null default now(),
  updated_by          uuid references auth.users (id) on delete set null
);

insert into public.firm_settings (id) values (true) on conflict (id) do nothing;

alter table public.firm_settings enable row level security;

drop policy if exists firm_settings_read on public.firm_settings;
create policy firm_settings_read on public.firm_settings
  for select to authenticated using (true);
drop policy if exists firm_settings_admin on public.firm_settings;
create policy firm_settings_admin on public.firm_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.stamp_firm_settings()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if auth.uid() is not null then
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

create or replace trigger firm_settings_stamp
  before update on public.firm_settings
  for each row execute function public.stamp_firm_settings();

alter table public.profiles
  add column if not exists leaderboard_opt_out boolean not null default false;

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
      split_part(coalesce(nullif(trim(p.display_name), ''), 'Someone'), ' ', 1) as first_name,
      coalesce(sum(x.amount), 0)::integer as xp
    from public.profiles p
    left join public.xp_events x
      on x.user_id = p.id
     and x.created_at >= now() - interval '7 days'
    where not p.is_admin
      and not coalesce(p.is_coach, false)
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

revoke all on function public.weekly_leaderboard() from public;
revoke all on function public.weekly_leaderboard() from anon;
grant execute on function public.weekly_leaderboard() to authenticated;
