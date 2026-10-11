import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { certificateStatus } from '@/lib/certificate/service';
import { certificatePdf, downloadHeaders } from '@/lib/reports/pdf';
import { fileSlug } from '@/lib/reports/rules';

/**
 * The signed-in learner's own certificate of completion as a branded PDF,
 * with the same words as the page. Only their own, and only once earned.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response('Not signed in.', { status: 401 });
  const profile = await getLearnerProfile(user.id);
  if (!profile) return new Response('Your account is not set up yet.', { status: 404 });

  const status = await certificateStatus(user.id, profile.country);
  if (!status.earned || !status.issuedAt) {
    return new Response('The certificate is not earned yet.', { status: 404 });
  }

  const name = profile.displayName?.trim() || profile.email || 'Learner';
  const issued = new Date(status.issuedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: profile.timezone,
  });
  const bytes = await certificatePdf({
    name,
    body: `finished every required module of the ${profile.country === 'MY' ? 'Malaysian' : 'Australian'} litigation training, and completed ${status.mattersGood} practice ${status.mattersGood === 1 ? 'matter' : 'matters'} marked Good by a supervising lawyer.`,
    modules: status.requiredModules.map((m) => m.name),
    issued,
  });
  return new Response(Buffer.from(bytes), {
    headers: downloadHeaders(`certificate-${fileSlug(name)}.pdf`, 'application/pdf'),
  });
}
