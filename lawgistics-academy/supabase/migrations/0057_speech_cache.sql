-- =============================================================================
-- Reading lessons and the daily fact aloud
-- =============================================================================
-- The owner, November 2026, with an ElevenLabs key: a "Listen" button on a
-- lesson screen and on the daily fact. What is read is only text a lawyer has
-- signed off for the reader, found by the server itself; the page names the
-- thing and never sends words.
--
-- Each distinct text in a voice is made once and kept here, so the cost
-- follows the amount of content, not the number of times it is played. The
-- bucket is private with no policy for anybody (the server reads and writes
-- it with the service role, as it does for the Studio's recordings in 0053),
-- and holds nothing about any person: only audio of our own text.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('speech', 'speech', false, 10485760, array['audio/mpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
