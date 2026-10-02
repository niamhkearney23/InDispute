import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/guard';
import { MatterForm } from '../forms';

export const metadata: Metadata = { title: 'Write a matter' };
export const dynamic = 'force-dynamic';

export default async function NewMatterPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">New</p>
        <h1 className="text-3xl">Write a matter</h1>
        <p className="mt-2 max-w-2xl text-slate">
          Once saved it waits for somebody else to sign it off, then you can put it up.
        </p>
      </div>
      <MatterForm
        initial={{
          number: 1,
          title: '',
          country: 'MY',
          area: '',
          brief: '',
          timeLimitMinutes: 45,
          procedurePrompt: 'Identify the applicable procedure, and the rule or provision it comes from.',
          draftPrompt: 'Draft a short advice to the client: what they should do, by when, and why.',
          speakPrompt: 'Explain your advice out loud, as you would to the client, in no more than three minutes.',
          modelAnswer: '',
          sources: '',
        }}
      />
    </div>
  );
}
