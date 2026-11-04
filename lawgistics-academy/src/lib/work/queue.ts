/** The counts already authorised and calculated for the coach's work board. */
export interface WorkQueueEntry {
  waiting: number;
  unanswered: number;
}

/**
 * Give feedback before starting more work: marking first, then conversations.
 * Keep the existing order within each group and never change the caller's list.
 */
export function prioritiseWork<T extends WorkQueueEntry>(posts: readonly T[]): T[] {
  const marking: T[] = [];
  const replies: T[] = [];
  const other: T[] = [];

  for (const post of posts) {
    if (post.waiting > 0) marking.push(post);
    else if (post.unanswered > 0) replies.push(post);
    else other.push(post);
  }

  return [...marking, ...replies, ...other];
}
