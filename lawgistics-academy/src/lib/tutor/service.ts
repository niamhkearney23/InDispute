import 'server-only';
import { deliveryOrder } from '@/lib/learning/option-order';
import { createServiceClient } from '@/lib/supabase/service';
import { modulesFor, moduleBySlug } from '@/content/seed/modules';
import type { Country } from '@/lib/types';
import { REDACTED, askable, stillChecked, type TutorMode, type VerifiedQuestion } from './rules';
import { isSupervised, staffMayRead, supervisedIds } from '@/lib/admin/supervision';

export { isSupervised, staffMayRead };

/**
 * The tutor's reads and writes. Everything here uses the service client, so
 * every caller has already established who is asking (the signed-in user in
 * a learner action, requireCoach on a staff page) and passes that id, never
 * one from a form.
 */

export interface TutorMessage {
  id: string;
  role: 'learner' | 'tutor';
  body: string;
  questionVersionId: string | null;
  chosenOption: string | null;
  correct: boolean | null;
  redacted: boolean;
  createdAt: string;
}

export interface TutorConversation {
  id: string;
  userId: string;
  mode: TutorMode;
  topic: string;
  moduleSlug: string | null;
  /** "Test me": how many questions it was set at when it started. */
  testLength: number | null;
  createdAt: string;
}

const CONVERSATION_COLUMNS = 'id, user_id, mode, topic, module_slug, test_length, created_at';
const MESSAGE_COLUMNS =
  'id, role, body, question_version_id, chosen_option, correct, redacted_at, created_at';

function toConversation(row: Record<string, unknown>): TutorConversation {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    mode: row.mode as TutorMode,
    topic: row.topic as string,
    moduleSlug: (row.module_slug as string | null) ?? null,
    testLength: (row.test_length as number | null) ?? null,
    createdAt: row.created_at as string,
  };
}

function toMessage(row: Record<string, unknown>): TutorMessage {
  return {
    id: row.id as string,
    role: row.role as 'learner' | 'tutor',
    body: row.body as string,
    questionVersionId: (row.question_version_id as string | null) ?? null,
    chosenOption: (row.chosen_option as string | null) ?? null,
    correct: (row.correct as boolean | null) ?? null,
    redacted: Boolean(row.redacted_at),
    createdAt: row.created_at as string,
  };
}

const CHECKED_COLUMNS =
  'id, stem, scenario, options, correct_option_ids, explanation, common_misconception, ' +
  'is_current, verification_status, review_flagged, review_due_on, ' +
  'questions!inner(status, country, domain_id)';

interface CheckedRow {
  id: string;
  stem: string;
  scenario: string | null;
  options: Array<{ id: string; text: string }> | null;
  correct_option_ids: string[] | null;
  explanation: string;
  common_misconception: string | null;
  is_current: boolean;
  verification_status: string;
  review_flagged: boolean | null;
  review_due_on: string | null;
  questions: { status: string; country: string; domain_id: string } | null;
}

/** Today, as the sign-off dates are written: YYYY-MM-DD, by UTC. */
const todayUtc = () => new Date().toISOString().slice(0, 10);

/**
 * A row read back as a question the tutor may stand on, or null. The query
 * already asks the database for all of this; it is checked again here so
 * that a filter dropped from a query, or a database that does not apply one,
 * cannot let a lapsed or flagged question through.
 */
function asChecked(row: CheckedRow, today: string): VerifiedQuestion | null {
  const ok = stillChecked(
    {
      isCurrent: row.is_current === true,
      verificationStatus: row.verification_status,
      reviewFlagged: row.review_flagged === true,
      reviewDueOn: row.review_due_on ?? null,
      published: row.questions?.status === 'published',
    },
    today,
  );
  if (!ok) return null;
  const q: VerifiedQuestion = {
    versionId: row.id,
    stem: row.stem,
    scenario: row.scenario ?? null,
    // The same shuffled order the training shows: the bank was written with
    // the right answer second three times in four.
    options: deliveryOrder(row.options ?? [], row.id),
    correctOptionIds: row.correct_option_ids ?? [],
    explanation: row.explanation,
    misconception: row.common_misconception ?? null,
  };
  return askable(q) ? q : null;
}

/**
 * Every question the tutor may ask in a country, each with its domain:
 * the current version of a published question, signed off by a person,
 * not flagged and not lapsed, with exactly one right answer. Published
 * alone is not enough, because the seed content ships published before
 * anybody has checked it.
 */
async function checkedPool(
  country: Country,
  domainIds: string[],
): Promise<Array<VerifiedQuestion & { domainId: string }>> {
  if (domainIds.length === 0) return [];
  const today = todayUtc();
  const db = createServiceClient();
  const { data } = await db
    .from('question_versions')
    .select(CHECKED_COLUMNS)
    .eq('is_current', true)
    .eq('verification_status', 'human_verified')
    .eq('review_flagged', false)
    .or(`review_due_on.is.null,review_due_on.gt.${today}`)
    .eq('questions.status', 'published')
    .eq('questions.country', country)
    .in('questions.domain_id', domainIds);
  const out: Array<VerifiedQuestion & { domainId: string }> = [];
  for (const row of (data ?? []) as unknown as CheckedRow[]) {
    const q = asChecked(row, today);
    if (!q || !row.questions || row.questions.country !== country) continue;
    if (!domainIds.includes(row.questions.domain_id)) continue;
    out.push({ ...q, domainId: row.questions.domain_id });
  }
  return out;
}

async function domainIdsBySlug(slugs: string[]): Promise<Map<string, string>> {
  if (slugs.length === 0) return new Map();
  const db = createServiceClient();
  const { data } = await db.from('domains').select('id, slug').in('slug', slugs);
  return new Map((data ?? []).map((d) => [d.slug as string, d.id as string]));
}

/** The questions "Test me" may ask from one module. */
export async function verifiedQuestions(
  country: Country,
  moduleSlug: string,
): Promise<VerifiedQuestion[]> {
  const chosen = moduleBySlug(moduleSlug);
  if (!chosen || chosen.country !== country) return [];
  const ids = [...(await domainIdsBySlug(chosen.domains)).values()];
  return checkedPool(country, ids);
}

/**
 * One question by its version, for marking an answer: null unless it is
 * still a question the tutor may stand on today.
 */
export async function verifiedQuestion(versionId: string): Promise<VerifiedQuestion | null> {
  const db = createServiceClient();
  const { data } = await db
    .from('question_versions')
    .select(CHECKED_COLUMNS)
    .eq('id', versionId)
    .maybeSingle();
  return data ? asChecked(data as unknown as CheckedRow, todayUtc()) : null;
}

/**
 * The checked explanation to show beside each answered question, by
 * version: the words if a lawyer still stands behind them today, or null if
 * the question has since been changed, flagged or let lapse, so the page
 * says so instead of showing words nobody is standing behind any more.
 */
export async function explanationsFor(versionIds: string[]): Promise<Record<string, string | null>> {
  const ids = [...new Set(versionIds)];
  if (ids.length === 0) return {};
  const today = todayUtc();
  const db = createServiceClient();
  const { data } = await db.from('question_versions').select(CHECKED_COLUMNS).in('id', ids);
  const out: Record<string, string | null> = Object.fromEntries(ids.map((id) => [id, null]));
  for (const row of (data ?? []) as unknown as CheckedRow[]) {
    out[row.id] = asChecked(row, today)?.explanation ?? null;
  }
  return out;
}

/** The modules this learner's country has, each with how many checked questions it holds. */
export async function testableModules(
  country: Country,
): Promise<Array<{ slug: string; name: string; verified: number }>> {
  const modules = modulesFor(country);
  const bySlug = await domainIdsBySlug([...new Set(modules.flatMap((m) => m.domains))]);
  const pool = await checkedPool(country, [...bySlug.values()]);
  return modules.map((m) => {
    const ids = new Set(m.domains.map((d) => bySlug.get(d)).filter(Boolean));
    return { slug: m.slug, name: m.name, verified: pool.filter((q) => ids.has(q.domainId)).length };
  });
}

export async function startConversation(input: {
  userId: string;
  mode: TutorMode;
  topic: string;
  moduleSlug: string | null;
  testLength: number | null;
}): Promise<string | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from('tutor_conversations')
    .insert({
      user_id: input.userId,
      mode: input.mode,
      topic: input.topic,
      module_slug: input.moduleSlug,
      test_length: input.testLength,
    })
    .select('id')
    .single();
  return error || !data ? null : (data.id as string);
}

/**
 * Writes one message. "duplicate" when the database refused it as a second
 * answer to the same question, or the same question asked twice: two presses
 * of a button, or two tabs, where the first one already did the work.
 */
export async function addMessage(
  conversationId: string,
  message: {
    role: 'learner' | 'tutor';
    body: string;
    questionVersionId?: string | null;
    chosenOption?: string | null;
    correct?: boolean | null;
  },
): Promise<'saved' | 'duplicate' | 'failed'> {
  const db = createServiceClient();
  const { error } = await db.from('tutor_messages').insert({
    conversation_id: conversationId,
    role: message.role,
    body: message.body,
    question_version_id: message.questionVersionId ?? null,
    chosen_option: message.chosenOption ?? null,
    correct: message.correct ?? null,
  });
  if (!error) return 'saved';
  return error.code === '23505' ? 'duplicate' : 'failed';
}

export async function conversation(id: string): Promise<TutorConversation | null> {
  const db = createServiceClient();
  const { data } = await db
    .from('tutor_conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  return data ? toConversation(data) : null;
}

/** The longest stretch of a conversation that is read back, newest kept. */
const THREAD_MAX = 200;

/** A conversation's messages, oldest first: the latest THREAD_MAX of them. */
export async function messages(conversationId: string): Promise<TutorMessage[]> {
  const db = createServiceClient();
  const { data } = await db
    .from('tutor_messages')
    .select(MESSAGE_COLUMNS)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(THREAD_MAX);
  // Newest first from the database, so the limit keeps the latest; put back
  // in the order it was said.
  return (data ?? [])
    .map(toMessage)
    .sort((x, y) => x.createdAt.localeCompare(y.createdAt) || x.id.localeCompare(y.id));
}

/** A learner's own recent conversations, newest first. */
export async function conversationsFor(userId: string, limit = 20): Promise<TutorConversation[]> {
  const db = createServiceClient();
  const { data } = await db
    .from('tutor_conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map(toConversation);
}

/**
 * What this person has asked of the tutor in the last day: messages sent and
 * conversations started. A count that cannot be read comes back as null,
 * and the caller treats that as the limit reached: each message costs money,
 * and a failed count must not mean an unlimited one.
 */
export async function usageToday(
  userId: string,
): Promise<{ messages: number; conversations: number } | null> {
  const db = createServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [sent, started] = await Promise.all([
    db
      .from('tutor_messages')
      .select('id, tutor_conversations!inner(user_id)', { count: 'exact', head: true })
      .eq('tutor_conversations.user_id', userId)
      .eq('role', 'learner')
      .gte('created_at', since),
    db
      .from('tutor_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since),
  ]);
  if (sent.error || started.error || sent.count === null || started.count === null) return null;
  return { messages: sent.count, conversations: started.count };
}

export interface CoachConversationRow extends TutorConversation {
  name: string;
  /** How many messages the learner has sent in it. */
  sent: number;
}

/** How many conversations the staff list shows a page. */
export const STAFF_PAGE = 50;

/**
 * Recent conversations with the learner's name, newest first, a page at a
 * time. Staff pages only, after requireCoach: an administrator sees
 * everybody's, a coach only those of people the firm supervises.
 */
export async function recentConversations(input: {
  page: number;
  isAdmin: boolean;
}): Promise<{ rows: CoachConversationRow[]; more: boolean }> {
  const db = createServiceClient();
  let ids: string[] | null = null;
  if (!input.isAdmin) {
    ids = [...(await supervisedIds())];
    if (ids.length === 0) return { rows: [], more: false };
  }
  const from = Math.max(0, input.page) * STAFF_PAGE;
  let query = db
    .from('tutor_conversations')
    .select(`${CONVERSATION_COLUMNS}, tutor_messages(count)`)
    .eq('tutor_messages.role', 'learner')
    .order('created_at', { ascending: false })
    .range(from, from + STAFF_PAGE);
  if (ids) query = query.in('user_id', ids);
  const { data } = await query;
  const all = (data ?? []) as Array<Record<string, unknown>>;
  const page = all.slice(0, STAFF_PAGE);
  if (page.length === 0) return { rows: [], more: false };

  const { data: people } = await db
    .from('profiles')
    .select('id, display_name, email')
    .in('id', [...new Set(page.map((c) => c.user_id as string))]);
  const names = new Map(
    (people ?? []).map((p) => [
      p.id as string,
      ((p.display_name as string | null) || (p.email as string | null) || 'Someone') as string,
    ]),
  );
  return {
    rows: page.map((row) => {
      const c = toConversation(row);
      const counted = row.tutor_messages as Array<{ count: number }> | undefined;
      return { ...c, name: names.get(c.userId) ?? 'Someone', sent: counted?.[0]?.count ?? 0 };
    }),
    more: all.length > STAFF_PAGE,
  };
}


/** Blanks one message, for an administrator. The database records when. */
export async function redactMessage(messageId: string, adminId: string): Promise<boolean> {
  const db = createServiceClient();
  const { data, error } = await db
    .from('tutor_messages')
    .update({ body: REDACTED, redacted_by: adminId })
    .eq('id', messageId)
    .is('redacted_at', null)
    .select('conversation_id')
    .maybeSingle();
  return !error && Boolean(data);
}

/** The conversation a message belongs to. */
export async function conversationOfMessage(messageId: string): Promise<string | null> {
  const db = createServiceClient();
  const { data } = await db
    .from('tutor_messages')
    .select('conversation_id')
    .eq('id', messageId)
    .maybeSingle();
  return (data?.conversation_id as string | undefined) ?? null;
}

/** A name for one person, for the staff page that shows a single conversation. */
export async function personName(userId: string): Promise<string> {
  const db = createServiceClient();
  const { data } = await db
    .from('profiles')
    .select('display_name, email')
    .eq('id', userId)
    .maybeSingle();
  return ((data?.display_name as string | null) ||
    (data?.email as string | null) ||
    'Someone') as string;
}
