import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';
import { modulesFor, moduleBySlug } from '@/content/seed/modules';
import type { Country } from '@/lib/types';
import type { TutorMode, VerifiedQuestion } from './rules';

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
  createdAt: string;
}

export interface TutorConversation {
  id: string;
  userId: string;
  mode: TutorMode;
  topic: string;
  moduleSlug: string | null;
  createdAt: string;
}

const CONVERSATION_COLUMNS = 'id, user_id, mode, topic, module_slug, created_at';
const MESSAGE_COLUMNS = 'id, role, body, question_version_id, chosen_option, correct, created_at';

function toConversation(row: Record<string, unknown>): TutorConversation {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    mode: row.mode as TutorMode,
    topic: row.topic as string,
    moduleSlug: (row.module_slug as string | null) ?? null,
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
    createdAt: row.created_at as string,
  };
}

/**
 * The questions "Test me" may ask from one module: published, current, and
 * marked verified by a person. Published alone is not enough, because the
 * seed content ships published before anybody has checked it.
 */
export async function verifiedQuestions(
  country: Country,
  moduleSlug: string,
): Promise<VerifiedQuestion[]> {
  const chosen = moduleBySlug(moduleSlug);
  if (!chosen || chosen.country !== country) return [];

  const db = createServiceClient();
  const { data: domains } = await db.from('domains').select('id, slug').in('slug', chosen.domains);
  const domainIds = (domains ?? []).map((d) => d.id as string);
  if (domainIds.length === 0) return [];

  const { data: questions } = await db
    .from('questions')
    .select('id')
    .eq('status', 'published')
    .eq('country', country)
    .in('domain_id', domainIds);
  const questionIds = (questions ?? []).map((q) => q.id as string);
  if (questionIds.length === 0) return [];

  const { data: versions } = await db
    .from('question_versions')
    .select('id, stem, scenario, options, correct_option_ids, explanation, common_misconception')
    .in('question_id', questionIds)
    .eq('is_current', true)
    .eq('verification_status', 'human_verified');

  return (versions ?? []).map((v) => ({
    versionId: v.id as string,
    stem: v.stem as string,
    scenario: (v.scenario as string | null) ?? null,
    options: (v.options as Array<{ id: string; text: string }>) ?? [],
    correctOptionIds: (v.correct_option_ids as string[]) ?? [],
    explanation: v.explanation as string,
    misconception: (v.common_misconception as string | null) ?? null,
  }));
}

/** One verified question by its version, for checking an answer. */
export async function verifiedQuestion(versionId: string): Promise<VerifiedQuestion | null> {
  const db = createServiceClient();
  const { data: v } = await db
    .from('question_versions')
    .select(
      'id, stem, scenario, options, correct_option_ids, explanation, common_misconception, verification_status',
    )
    .eq('id', versionId)
    .maybeSingle();
  if (!v || v.verification_status !== 'human_verified') return null;
  return {
    versionId: v.id as string,
    stem: v.stem as string,
    scenario: (v.scenario as string | null) ?? null,
    options: (v.options as Array<{ id: string; text: string }>) ?? [],
    correctOptionIds: (v.correct_option_ids as string[]) ?? [],
    explanation: v.explanation as string,
    misconception: (v.common_misconception as string | null) ?? null,
  };
}

/** The modules this learner's country has, each with how many checked questions it holds. */
export async function testableModules(
  country: Country,
): Promise<Array<{ slug: string; name: string; verified: number }>> {
  const modules = modulesFor(country);
  const counts = await Promise.all(
    modules.map(async (m) => (await verifiedQuestions(country, m.slug)).length),
  );
  return modules.map((m, i) => ({ slug: m.slug, name: m.name, verified: counts[i] }));
}

export async function startConversation(input: {
  userId: string;
  mode: TutorMode;
  topic: string;
  moduleSlug: string | null;
}): Promise<string | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from('tutor_conversations')
    .insert({
      user_id: input.userId,
      mode: input.mode,
      topic: input.topic,
      module_slug: input.moduleSlug,
    })
    .select('id')
    .single();
  return error || !data ? null : (data.id as string);
}

export async function addMessage(
  conversationId: string,
  message: {
    role: 'learner' | 'tutor';
    body: string;
    questionVersionId?: string | null;
    chosenOption?: string | null;
    correct?: boolean | null;
  },
): Promise<boolean> {
  const db = createServiceClient();
  const { error } = await db.from('tutor_messages').insert({
    conversation_id: conversationId,
    role: message.role,
    body: message.body,
    question_version_id: message.questionVersionId ?? null,
    chosen_option: message.chosenOption ?? null,
    correct: message.correct ?? null,
  });
  return !error;
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

export async function messages(conversationId: string): Promise<TutorMessage[]> {
  const db = createServiceClient();
  const { data } = await db
    .from('tutor_messages')
    .select(MESSAGE_COLUMNS)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return (data ?? []).map(toMessage);
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

/** How many messages this person has sent the tutor in the last day. */
export async function messagesInLastDay(userId: string): Promise<number> {
  const db = createServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: convos } = await db.from('tutor_conversations').select('id').eq('user_id', userId);
  const ids = (convos ?? []).map((c) => c.id as string);
  if (ids.length === 0) return 0;
  const { count } = await db
    .from('tutor_messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', ids)
    .eq('role', 'learner')
    .gte('created_at', since);
  return count ?? 0;
}

export interface CoachConversationRow extends TutorConversation {
  name: string;
  messageCount: number;
}

/** Every recent conversation, with the learner's name. Staff pages only. */
export async function recentConversations(limit = 50): Promise<CoachConversationRow[]> {
  const db = createServiceClient();
  const { data } = await db
    .from('tutor_conversations')
    .select(CONVERSATION_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);
  const convos = (data ?? []).map(toConversation);
  if (convos.length === 0) return [];

  const [{ data: people }, { data: msgs }] = await Promise.all([
    db
      .from('profiles')
      .select('id, display_name, email')
      .in('id', [...new Set(convos.map((c) => c.userId))]),
    db
      .from('tutor_messages')
      .select('conversation_id')
      .in(
        'conversation_id',
        convos.map((c) => c.id),
      ),
  ]);
  const names = new Map(
    (people ?? []).map((p) => [
      p.id as string,
      ((p.display_name as string | null) || (p.email as string | null) || 'Someone') as string,
    ]),
  );
  const counts = new Map<string, number>();
  for (const m of msgs ?? []) {
    const id = m.conversation_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return convos.map((c) => ({
    ...c,
    name: names.get(c.userId) ?? 'Someone',
    messageCount: counts.get(c.id) ?? 0,
  }));
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
