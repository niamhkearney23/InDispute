-- =============================================================================
-- A trainee is a trainee once somebody at the firm says so
-- =============================================================================
-- The trainee sign-up page is public, on purpose: the owner wants a trainee
-- to be able to find it and join without waiting for a link. But what being
-- a trainee opens (the work coaches post for trainees, the files and voice
-- memos on it, and a place on work that only a few people may take) was
-- decided by a field the person set about themselves. Anybody who found the
-- page could read the firm's trainee work and take the places on it.
--
-- So the programme is now two things: saying you are on it, which anybody
-- may, and a coach or administrator confirming it, which only they may. The
-- confirmation records who and when. Until it exists, trainee work stays
-- out of sight and everything else in the app works as normal.
--
-- Joining by invitation, or through an account an administrator made, is
-- confirmed on the way in: the firm chose the programme when it invited
-- them. Trainees who already joined that way are confirmed here from their
-- invitation. Anybody who signed themselves up before this is not, and a
-- coach confirms them in a click; that is the point of the change.
--
-- A person changing their own programme loses the confirmation, because it
-- was a statement about the programme they were on.
-- =============================================================================

alter table public.profiles
  add column if not exists trainee_approved_at timestamptz;
alter table public.profiles
  add column if not exists trainee_approved_by uuid references auth.users (id) on delete set null;

update public.profiles p
set trainee_approved_at = i.accepted_at,
    trainee_approved_by = i.invited_by
from public.joiner_invitations i
where i.accepted_by = p.id
  and i.track = 'litigation_trainee'
  and i.accepted_at is not null
  and p.track = 'litigation_trainee'
  and p.trainee_approved_at is null;

create or replace function public.guard_trainee_approval()
returns trigger language plpgsql set search_path = public as $$
begin
  -- Staff, and the server acting for them, may confirm. Even they cannot
  -- leave a confirmation on somebody who is not on the programme.
  if current_user in ('service_role', 'postgres', 'supabase_admin') or public.is_coach() then
    if new.track is distinct from 'litigation_trainee' then
      new.trainee_approved_at := null;
      new.trainee_approved_by := null;
    end if;
    return new;
  end if;

  -- Anybody else: never set it themselves, and lose it if they change
  -- programme.
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

create or replace trigger profiles_guard_trainee_approval
  before insert or update on public.profiles
  for each row execute function public.guard_trainee_approval();

-- Trainee-only work is for confirmed trainees.
create or replace function public.work_visible(post public.work_posts)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select post.published
        and (post.country is null or post.country = p.country)
        and (not post.trainees_only
             or (p.track = 'litigation_trainee' and p.trainee_approved_at is not null))
       from public.profiles p where p.id = auth.uid()),
    false
  );
$$;
