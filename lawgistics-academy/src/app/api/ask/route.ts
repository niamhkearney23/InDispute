import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { hasAccess } from '@/lib/access/service';
import { ask } from '@/lib/ask/service';
import { cleanQuestion } from '@/lib/ask/rules';

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

/** A question from a signed-in learner, answered from signed-off lessons only. */
export async function POST(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return json({ kind: 'error' }, 415);
  }
  const user = await getCurrentUser();
  if (!user) return json({ kind: 'error' }, 401);
  if (!(await hasAccess(user.id))) return json({ kind: 'error' }, 403);
  const profile = await getLearnerProfile(user.id);
  if (!profile) return json({ kind: 'error' }, 404);

  const body = (await request.json().catch(() => null)) as { question?: unknown } | null;
  const question = cleanQuestion(body?.question);
  if (!question) return json({ kind: 'error' }, 400);

  return json(await ask(user.id, profile.country, question));
}
