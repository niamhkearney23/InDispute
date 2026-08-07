-- =============================================================================
-- 0005  Court hierarchy questions
-- =============================================================================
-- A question type that draws the court hierarchy and asks the learner to pick a
-- court from it, rather than from a list of sentences.
--
-- Nothing else changes. The options are the courts and the answer key is the
-- right one, so grading, the immutable version history and the attempt ledger
-- are all untouched: this is a way of presenting a question, not a new way of
-- being right.
--
-- As in 0004, the new value is added here and used nowhere in this file, since
-- Postgres will not let a value added by ALTER TYPE ADD VALUE be used in the
-- transaction that added it, and SETUP.sql runs every migration in one go.
-- =============================================================================

alter type question_type add value if not exists 'court_hierarchy';
