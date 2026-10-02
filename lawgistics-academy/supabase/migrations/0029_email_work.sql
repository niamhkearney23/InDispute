-- =============================================================================
-- Work that arrives by email
-- =============================================================================
-- A lawyer emails a piece of work to the academy's address. The app turns it
-- into a draft post on the work board, under the lawyer's name, and the
-- lawyer checks it and presses Publish. Nothing that arrives by email is ever
-- published by arriving: the post starts unpublished, like any other draft.
--
-- Three columns say where a post came from, so the board can show a draft
-- from email as one, with a reminder to take out client names before it goes
-- up. The email's own message id is kept so that the same email delivered
-- twice (inbound services retry) makes one draft, not two.
-- =============================================================================

alter table public.work_posts
  add column if not exists source text not null default 'form';
alter table public.work_posts drop constraint if exists work_posts_source_known;
alter table public.work_posts
  add constraint work_posts_source_known check (source in ('form', 'email'));

alter table public.work_posts add column if not exists inbound_message_id text;
alter table public.work_posts add column if not exists inbound_from text;
-- Whether the sending domain's own check (SPF) passed. A draft that failed it
-- is still made, because forwarding breaks SPF more often than forgery does,
-- but the page says so, and it is still only a draft.
alter table public.work_posts add column if not exists inbound_verified boolean;

create unique index if not exists work_posts_inbound_message_once
  on public.work_posts (inbound_message_id) where inbound_message_id is not null;
