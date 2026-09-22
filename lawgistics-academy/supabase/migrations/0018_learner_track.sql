-- =============================================================================
-- Which programme somebody is on
-- =============================================================================
-- The signup and onboarding country question grows a third choice: a
-- litigation trainee, on a Malaysian firm's programme. It is recorded as its
-- own column rather than folded into career_stage, because it is not a stage
-- of a career: a trainee may be a student or a graduate, and the firm's
-- programme is a fact about the placement, not the person.
--
-- For now a trainee is shown the same things as any Malaysian learner. The
-- column exists so the app knows who they are before it starts treating them
-- differently, and so a firm reading a roster can tell its trainees from
-- everyone else who happened to pick Malaysia.
--
-- Self-service, like country: the person says which programme they are on,
-- and the firm's confirmations and placement dates remain the firm's to set.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'learner_track') then
    create type learner_track as enum ('general', 'litigation_trainee');
  end if;
end
$$;

alter table public.profiles
  add column if not exists track learner_track not null default 'general';

comment on column public.profiles.track is
  'Which programme they are on. A litigation trainee is on a Malaysian firm''s '
  'programme; everyone else is general. Self-set, like country.';

-- The trainee programme is a Malaysian one, so the track has no meaning
-- against Australian law. Enforced here rather than in the forms alone: a
-- profile can be changed from more than one place, and every one of them
-- should get the same answer.
alter table public.profiles drop constraint if exists profiles_trainee_is_malaysian;
alter table public.profiles add constraint profiles_trainee_is_malaysian
  check (track <> 'litigation_trainee' or country = 'MY');

-- As in 0006: the values arrive in the auth user's metadata, written by the
-- browser, and are narrowed rather than trusted. Choosing the trainee track
-- also settles the country, so the constraint above cannot fail at signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  chosen_track learner_track :=
    case when new.raw_user_meta_data ->> 'track' = 'litigation_trainee'
      then 'litigation_trainee' else 'general' end;
begin
  insert into public.profiles (id, email, display_name, country, track)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case
      when chosen_track = 'litigation_trainee' then 'MY'
      when new.raw_user_meta_data ->> 'country' = 'MY' then 'MY'
      else 'AU'
    end::country,
    chosen_track
  )
  on conflict (id) do nothing;

  insert into public.user_streaks (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
