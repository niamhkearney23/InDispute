/**
 * Fills a database built from the live site's SETUP.sql (before this
 * release) with the kind of thing the live database holds, so the update can
 * be rehearsed on more than empty tables. Run by
 * tools/integration/rehearse-update.sh, never against a real project.
 *
 * It copies the old behaviour where it matters for this release: the
 * Australian questions and daily facts are published without a sign-off, the
 * way the old loader left them, and a few are signed off properly.
 */
import { seedContent } from '../../src/lib/setup/seed-content';
import { person, service } from '../helpers';

async function main() {
  const db = service();
  await seedContent(db);

  const admin = await person('admin');
  const coach = await person('coach');
  const learners = [await person('learner', 'AU'), await person('learner', 'AU'), await person('learner', 'MY')];
  void admin;

  // The old loader published the Australian bank unsigned.
  const { error: pubError } = await db.from('questions').update({ status: 'published' }).eq('country', 'AU');
  if (pubError) throw pubError;
  const { error: factError } = await db.from('daily_facts').update({ status: 'published' }).eq('country', 'AU');
  if (factError) throw factError;

  // Three questions and two facts a lawyer really signed off.
  const { data: signed } = await db.from('questions').select('id').eq('country', 'AU').order('slug').limit(3);
  const now = new Date().toISOString();
  for (const q of signed ?? []) {
    const { error } = await db
      .from('question_versions')
      .update({ verification_status: 'human_verified', verified_by: coach.id, verified_at: now, reviewed_by: coach.id, reviewed_at: now })
      .eq('question_id', q.id)
      .eq('is_current', true);
    if (error) throw error;
  }
  const { data: facts } = await db.from('daily_facts').select('id').eq('country', 'AU').order('slug').limit(2);
  for (const f of facts ?? []) {
    const { error } = await db
      .from('daily_facts')
      .update({ verification_status: 'human_verified', verified_by: coach.id, verified_at: now })
      .eq('id', f.id);
    if (error) throw error;
  }

  // Learners who have trained: a session each and some answers.
  const { data: versions } = await db
    .from('question_versions')
    .select('id, question_id, correct_option_ids')
    .eq('is_current', true)
    .limit(12);
  for (const learner of learners) {
    const { data: session, error } = await db
      .from('training_sessions')
      .insert({ user_id: learner.id, kind: 'daily', status: 'completed', total_answered: 4, correct_count: 3 })
      .select('id')
      .single();
    if (error) throw error;
    const answers = (versions ?? []).slice(0, 4).map((v, i) => ({
      user_id: learner.id,
      question_id: v.question_id,
      question_version_id: v.id,
      session_id: session.id,
      selected_option_ids: i === 3 ? ['zzz'] : v.correct_option_ids,
      is_correct: i !== 3,
    }));
    const { error: answerError } = await db.from('user_question_attempts').insert(answers);
    if (answerError) throw answerError;
  }

  // A piece of work with a message thread, and a profile photo in storage.
  const { data: post, error: postError } = await db
    .from('work_posts')
    .insert({ title: 'Draft a letter of demand', instructions: 'One page.', posted_by: coach.id, published: true, published_at: now })
    .select('id')
    .single();
  if (postError) throw postError;
  const { error: msgError } = await db.from('work_messages').insert({
    post_id: post.id,
    thread_user_id: learners[0].id,
    sender_id: learners[0].id,
    body: 'Should the letter go to the director or the company?',
  });
  if (msgError) throw msgError;
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  const { error: uploadError } = await db.storage
    .from('avatars')
    .upload(`${learners[0].id}/photo.png`, png, { contentType: 'image/png', upsert: true });
  if (uploadError) throw uploadError;

  console.log('Production-like data loaded.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
