import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AnswerMark } from './score-history';

const PAGE = 1000;
/** Twenty pages is twenty thousand answers, years of mornings. */
const MAX_PAGES = 20;

/**
 * Every answer one person has given, oldest first, when it was given and
 * whether it was right. A request returns at most a thousand rows, which a
 * trainee passes inside a month, so this reads page by page rather than
 * quietly drawing the line from the first thousand.
 *
 * The caller decides who may read: the learner's own client (Row Level
 * Security limits it to their own answers) or the service client after the
 * staff check.
 */
export async function answerMarks(db: SupabaseClient, userId: string): Promise<AnswerMark[] | null> {
  const marks: AnswerMark[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await db
      .from('user_question_attempts')
      .select('answered_at, is_correct')
      .eq('user_id', userId)
      .order('answered_at', { ascending: true })
      .order('id', { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) return null;
    for (const row of data ?? []) {
      marks.push({ answeredAt: row.answered_at as string, correct: Boolean(row.is_correct) });
    }
    if ((data ?? []).length < PAGE) break;
  }
  return marks;
}
