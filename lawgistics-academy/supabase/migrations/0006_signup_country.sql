-- =============================================================================
-- 0006  Country chosen at signup
-- =============================================================================
-- The country question moves to the signup page, so a Malaysian visitor can see
-- the app covers them before deciding whether to create an account. Onboarding
-- still asks, pre-set to this answer, because it is the question that decides
-- what a learner is ever shown and it deserves confirming.
--
-- The value arrives in the auth user's metadata, which is written by the client
-- at signup. It is therefore untrusted: anything could be in there. It is
-- narrowed to 'MY' here, and anything else, including nothing, becomes 'AU'.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, country)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'country' = 'MY' then 'MY' else 'AU' end::country
  )
  on conflict (id) do nothing;

  insert into public.user_streaks (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
