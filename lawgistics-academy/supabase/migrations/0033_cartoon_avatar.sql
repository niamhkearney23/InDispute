-- =============================================================================
-- A cartoon of yourself
-- =============================================================================
-- Trainees can build a cartoon face (skin, hair, eyes, glasses, clothes and
-- so on) and it shows beside their name instead of a photo or an initial.
-- Nothing is drawn from a photo: the person picks every part themselves, and
-- what is stored is the list of choices, never a picture.
--
-- The app only ever saves choices from a fixed list in the code and draws the
-- face from them. The database cannot know that list, so it holds the shape:
-- a small object whose names and values are short plain words, nothing
-- else: no lists, no objects, no markup. A value that is not on the app's
-- list is ignored when the face is drawn.
--
-- A person sets and clears their own, through their own session, under the
-- existing rule that a learner may only update their own profile.
-- =============================================================================

alter table public.profiles
  add column if not exists avatar_style jsonb;

alter table public.profiles drop constraint if exists profiles_avatar_style_shape;
alter table public.profiles
  add constraint profiles_avatar_style_shape check (
    avatar_style is null
    or (
      jsonb_typeof(avatar_style) = 'object'
      and octet_length(avatar_style::text) <= 1024
      -- Strict mode: in the default (lax) mode a list is opened up before
      -- it is tested, so ["bob","fro"] would pass as if it were words.
      and not jsonb_path_exists(avatar_style, 'strict $.* ? (@.type() != "string")')
      and not jsonb_path_exists(avatar_style, 'strict $.* ? (!(@ like_regex "^[A-Za-z0-9]{1,40}$"))')
      and not jsonb_path_exists(avatar_style, 'strict $.keyvalue() ? (!(@.key like_regex "^[A-Za-z]{1,40}$"))')
    )
  );
