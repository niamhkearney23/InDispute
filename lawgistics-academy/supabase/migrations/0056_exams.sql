-- =============================================================================
-- Exams
-- =============================================================================
-- The owner, November 2026, from an exam app they liked: "this idea too.
-- like how it can help for law school". A learner sits a mock exam (every
-- area, a fixed paper, against the clock) or builds a drill (the areas,
-- difficulty, number of questions and which questions they choose), and sees
-- each attempt afterwards with its score and its answers.
--
-- An exam is a training session of its own kind, so everything that already
-- holds for a session holds for it: questions come only from the delivery
-- view (signed off, published, in date, the learner's country), the server
-- marks every answer, an answer is recorded once and never changed, and the
-- learner reads only their own sessions. Nothing new is written by a
-- browser. The time limit is the session's existing target_minutes, counted
-- from started_at by the server.
--
-- A new enum value cannot be used in the same transaction that adds it.
-- Nothing below uses it; the app does, afterwards.

alter type public.session_kind add value if not exists 'exam';

-- What the learner chose, so their history can say what each attempt was:
-- mock or drill, the areas, the difficulty, which questions, how many and how
-- long. Written by the server only, like every column of the session.
alter table public.training_sessions
  add column if not exists exam_settings jsonb;

comment on column public.training_sessions.exam_settings is
  'For an exam session: mode, areas, difficulty, pool, count and minutes as the learner chose them.';
