import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/guard';
import { loadTaxonomy } from '@/lib/admin/taxonomy';
import { createQuestion } from '../../actions';
import { QuestionForm } from '../../question-form';

export const metadata: Metadata = { title: 'New question' };

export default async function NewQuestionPage() {
  await requireAdmin();
  const { domains, concepts, skills } = await loadTaxonomy();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">New</p>
        <h1 className="text-3xl">Draft a question</h1>
        <p className="mt-2 max-w-2xl text-slate">
          It will be saved as a draft. Nothing reaches a learner until it has been verified
          by a person and then published — the publish action is refused for anything that
          has not been signed off.
        </p>
      </div>

      <QuestionForm
        action={createQuestion}
        submitLabel="Save draft"
        domains={domains}
        concepts={concepts}
        skills={skills}
        initial={{
          slug: '',
          domainId: domains[0]?.id ?? '',
          questionType: 'multiple_choice',
          difficulty: 2,
          jurisdiction: 'AU_GENERAL',
          court: '',
          scenario: '',
          stem: '',
          options: [],
          correctOptionIds: [],
          explanation: '',
          whyItMatters: '',
          commonMisconception: '',
          memoryTrick: '',
          sourceReference: '',
          sourceUrl: '',
          sourceCheckedOn: '',
          conceptIds: [],
          skillIds: [],
        }}
      />
    </div>
  );
}
