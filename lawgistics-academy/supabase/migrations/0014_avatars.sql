-- =============================================================================
-- Avatars: a person's own photo, on their own account
-- =============================================================================
-- Nothing in this product currently puts a face to a name. The one place that
-- would matter most is the coach's own session card, which already says whose
-- teaching it is; a photo next to that name is a real, honest detail rather
-- than a stock image standing in for one, which is why this is a photo people
-- upload of themselves rather than anything chosen for them.
--
-- A photo is not legal content and it is not a firm record, so it sits outside
-- every rule written for those: no version chain, no sign-off, no review queue.
-- It is closer to a display name than to a question. What it is not is free of
-- Row Level Security: a bucket that let anybody overwrite anybody else's file
-- would be a stranger's photo appearing under a different person's name, and
-- that is worse than no photo at all.
--
-- One file per person, at `{user_id}/avatar`, upsert on re-upload. The bucket
-- is public because a photo on a training page is not a secret and every place
-- it is shown, a plain <img src>, needs to load it without a session.
-- =============================================================================

alter table public.profiles add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anybody may look. The next three policies are the ones that matter: they are
-- what stops the read policy from being the only thing standing between one
-- person's account and another person's photo.
drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects
  for select to public using (bucket_id = 'avatars');

-- Write access is scoped to the first path segment, which the application
-- always sets to the uploader's own id. Nobody, including a learner who has
-- read the source of the upload form, can write to a path that does not start
-- with their own auth.uid().
drop policy if exists avatars_write_own on storage.objects;
create policy avatars_write_own on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
  for delete to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
