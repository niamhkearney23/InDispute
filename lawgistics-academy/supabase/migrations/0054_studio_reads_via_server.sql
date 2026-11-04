-- =============================================================================
-- Advocacy Studio: a coach reads a recording only through the server
-- =============================================================================
-- The Studio tells a learner: "each time a coach opens it, that is recorded."
-- The coach pages do read through the server, which writes to
-- `studio_access_log` first. But 0053 also let any coach (is_coach(), which
-- includes a firm administrator) read `studio_attempts` and `studio_reviews`
-- directly with their own sign-in, past the server and so past the log.
--
-- Now a person reading these tables with their own sign-in sees only their
-- own attempts and the reviews of them. Coaches lose nothing in the app: the
-- coach pages use the server's key and log each view.
--
-- This does not protect against the database's owners or administrators,
-- who can read any table; it closes the route for people signed in to the
-- Academy.

drop policy if exists studio_attempts_read on public.studio_attempts;
create policy studio_attempts_read on public.studio_attempts
  for select to authenticated using (user_id = auth.uid());

drop policy if exists studio_reviews_read on public.studio_reviews;
create policy studio_reviews_read on public.studio_reviews
  for select to authenticated using (
    exists (select 1 from public.studio_attempts a
             where a.id = attempt_id and a.user_id = auth.uid())
  );
