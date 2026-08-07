'use client';

import { useActionState, useState } from 'react';
import { Button, Card, Notice, cn } from '@/components/ui';
import { JURISDICTION_LABELS, type Jurisdiction, type QuestionType } from '@/lib/types';
import type { AdminState } from './actions';

export interface FormOption {
  id: string;
  text: string;
}

export interface QuestionFormValues {
  questionId?: string;
  slug: string;
  domainId: string;
  questionType: QuestionType;
  difficulty: number;
  jurisdiction: Jurisdiction;
  court: string;
  scenario: string;
  stem: string;
  options: FormOption[];
  correctOptionIds: string[];
  explanation: string;
  whyItMatters: string;
  commonMisconception: string;
  memoryTrick: string;
  sourceReference: string;
  sourceUrl: string;
  sourceCheckedOn: string;
  conceptIds: string[];
  skillIds: string[];
}

export interface TaxonomyOption {
  id: string;
  name: string;
  group?: string;
}

const JURISDICTIONS = Object.keys(JURISDICTION_LABELS) as Jurisdiction[];
const TRUE_FALSE: FormOption[] = [
  { id: 'true', text: 'True' },
  { id: 'false', text: 'False' },
];

export function QuestionForm({
  action,
  initial,
  domains,
  concepts,
  skills,
  submitLabel,
}: {
  action: (state: AdminState, formData: FormData) => Promise<AdminState>;
  initial: QuestionFormValues;
  domains: TaxonomyOption[];
  concepts: TaxonomyOption[];
  skills: TaxonomyOption[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  const [questionType, setQuestionType] = useState<QuestionType>(initial.questionType);
  const [options, setOptions] = useState<FormOption[]>(
    initial.options.length > 0
      ? initial.options
      : [
          { id: 'a', text: '' },
          { id: 'b', text: '' },
          { id: 'c', text: '' },
          { id: 'd', text: '' },
        ],
  );
  const [correct, setCorrect] = useState<string[]>(initial.correctOptionIds);

  const effectiveOptions = questionType === 'true_false' ? TRUE_FALSE : options;

  function setType(next: QuestionType) {
    setQuestionType(next);
    if (next === 'true_false') setCorrect([]);
  }

  function updateOption(index: number, text: string) {
    setOptions((current) =>
      current.map((option, i) => (i === index ? { ...option, text } : option)),
    );
  }

  const conceptsByGroup = groupBy(concepts);

  return (
    <form action={formAction} className="space-y-5">
      {initial.questionId ? (
        <input type="hidden" name="questionId" value={initial.questionId} />
      ) : null}
      <input
        type="hidden"
        name="options"
        value={JSON.stringify(
          effectiveOptions.map((o) => ({ id: o.id, text: o.text.trim() })),
        )}
      />
      {correct.map((id) => (
        <input key={id} type="hidden" name="correctOptionIds" value={id} />
      ))}

      <Card>
        <h2 className="mb-4 text-lg">Classification</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Text
            label="Slug"
            name="slug"
            defaultValue={initial.slug}
            hint="Lower case, hyphens. Permanent identifier."
            required
          />
          <Select label="Area" name="domainId" defaultValue={initial.domainId} required>
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.name}
              </option>
            ))}
          </Select>
          <Select
            label="Jurisdiction"
            name="jurisdiction"
            defaultValue={initial.jurisdiction}
            hint="Which jurisdiction does this rule belong to? Never guess."
            required
          >
            {JURISDICTIONS.map((value) => (
              <option key={value} value={value}>
                {JURISDICTION_LABELS[value]}
              </option>
            ))}
          </Select>
          <Text
            label="Court (optional)"
            name="court"
            defaultValue={initial.court}
            hint="e.g. Magistrates’ Court of Victoria"
          />
          <Select
            label="Difficulty"
            name="difficulty"
            defaultValue={String(initial.difficulty)}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value}. {['Foundational', 'Easy', 'Moderate', 'Hard', 'Very hard'][value - 1]}
              </option>
            ))}
          </Select>
          <div>
            <span className="mb-1.5 block text-sm font-medium">Type</span>
            <div className="flex flex-wrap gap-1.5">
              {(['multiple_choice', 'true_false', 'scenario'] as QuestionType[]).map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={cn(
                      'rounded-full border px-3.5 py-2.5 text-xs',
                      questionType === value
                        ? 'border-ink bg-ink text-paper'
                        : 'border-rule-strong text-slate hover:bg-paper-sunk',
                    )}
                  >
                    {value.replace('_', ' ')}
                  </button>
                ),
              )}
            </div>
            <input type="hidden" name="questionType" value={questionType} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg">The question</h2>
        <p className="mb-4 text-sm text-slate">
          Changing anything in this section on an existing question mints a new immutable
          version and sends it back for verification.
        </p>

        <div className="space-y-4">
          <TextArea
            label="Scenario (optional)"
            name="scenario"
            defaultValue={initial.scenario}
            rows={3}
            hint="Fact pattern shown above the question."
          />
          <TextArea label="Question" name="stem" defaultValue={initial.stem} rows={3} required />

          <div>
            <span className="mb-2 block text-sm font-medium">
              Options: tick the correct answer
            </span>
            <div className="space-y-2">
              {effectiveOptions.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCorrect((current) =>
                        current.includes(option.id)
                          ? current.filter((id) => id !== option.id)
                          : [...current, option.id],
                      )
                    }
                    aria-pressed={correct.includes(option.id)}
                    className={cn(
                      'size-11 shrink-0 rounded-[5px] border text-xs font-semibold sm:size-9',
                      correct.includes(option.id)
                        ? 'border-verdict-correct bg-verdict-correct text-paper'
                        : 'border-rule-strong text-muted hover:bg-paper-sunk',
                    )}
                  >
                    {option.id.slice(0, 1).toUpperCase()}
                  </button>
                  <input
                    value={option.text}
                    onChange={(event) => updateOption(index, event.target.value)}
                    readOnly={questionType === 'true_false'}
                    placeholder={`Option ${option.id.toUpperCase()}`}
                    className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10 read-only:bg-paper-sunk read-only:text-muted"
                  />
                </div>
              ))}
            </div>
            {questionType !== 'true_false' ? (
              <button
                type="button"
                onClick={() =>
                  setOptions((current) => [
                    ...current,
                    { id: String.fromCharCode(97 + current.length), text: '' },
                  ])
                }
                className="mt-2 inline-block py-2 text-xs text-burgundy underline underline-offset-2"
                disabled={options.length >= 8}
              >
                Add another option
              </button>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg">Feedback</h2>
        <div className="space-y-4">
          <TextArea
            label="Explanation"
            name="explanation"
            defaultValue={initial.explanation}
            rows={5}
            required
            hint="Why the right answer is right, and, where it helps, why the others are not."
          />
          <TextArea
            label="Why this matters in practice"
            name="whyItMatters"
            defaultValue={initial.whyItMatters}
            rows={3}
          />
          <TextArea
            label="What this is often confused with"
            name="commonMisconception"
            defaultValue={initial.commonMisconception}
            rows={2}
          />
          <TextArea
            label="Memory trick"
            name="memoryTrick"
            defaultValue={initial.memoryTrick}
            rows={2}
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg">Source</h2>
        <p className="mb-4 text-sm text-slate">
          A question without a checkable source cannot be verified.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Text
            label="Reference"
            name="sourceReference"
            defaultValue={initial.sourceReference}
            hint="e.g. Civil Procedure Act 2010 (Vic) s 63"
          />
          <Text label="URL" name="sourceUrl" type="url" defaultValue={initial.sourceUrl} />
          <Text
            label="Checked on"
            name="sourceCheckedOn"
            type="date"
            defaultValue={initial.sourceCheckedOn}
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg">Knowledge graph</h2>
        <p className="mb-4 text-sm text-slate">
          Concepts drive mastery and spaced repetition. Skills drive the cross-cutting
          profile. A question needs at least one of each or it teaches nothing measurable.
        </p>

        <div className="space-y-5">
          <div>
            <span className="mb-2 block text-sm font-medium">Concepts</span>
            <div className="space-y-3">
              {Object.entries(conceptsByGroup).map(([group, items]) => (
                <div key={group}>
                  <p className="eyebrow mb-1.5">{group}</p>
                  <CheckGrid
                    name="conceptIds"
                    items={items}
                    defaultChecked={initial.conceptIds}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium">Skills</span>
            <CheckGrid name="skillIds" items={skills} defaultChecked={initial.skillIds} />
          </div>
        </div>
      </Card>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="neutral">{state.ok}</Notice> : null}

      <div className="sticky bottom-0 -mx-5 border-t border-rule bg-paper/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:mx-0 sm:rounded-md sm:border sm:px-4">
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

function groupBy(items: TaxonomyOption[]): Record<string, TaxonomyOption[]> {
  return items.reduce<Record<string, TaxonomyOption[]>>((acc, item) => {
    const key = item.group ?? 'Other';
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

function CheckGrid({
  name,
  items,
  defaultChecked,
}: {
  name: string;
  items: TaxonomyOption[];
  defaultChecked: string[];
}) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {items.map((item) => (
        <label key={item.id} className="flex min-h-8 items-start gap-2 py-1 text-sm">
          <input
            type="checkbox"
            name={name}
            value={item.id}
            defaultChecked={defaultChecked.includes(item.id)}
            className="mt-0.5 size-6 shrink-0 accent-[#6b1f2a] sm:mt-1 sm:size-4"
          />
          <span>{item.name}</span>
        </label>
      ))}
    </div>
  );
}

function Text({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.ComponentProps<'input'>) {
  return (
    <div>
      <label htmlFor={props.name} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={props.name}
        className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
        {...props}
      />
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function TextArea({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.ComponentProps<'textarea'>) {
  return (
    <div>
      <label htmlFor={props.name} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={props.name}
        className="w-full rounded-[5px] border border-rule-strong bg-paper px-3 py-2 text-base outline-none focus:border-burgundy"
        {...props}
      />
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function Select({
  label,
  hint,
  children,
  ...props
}: { label: string; hint?: string } & React.ComponentProps<'select'>) {
  return (
    <div>
      <label htmlFor={props.name} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <select
        id={props.name}
        className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-2.5 text-base outline-none focus:border-burgundy sm:h-10"
        {...props}
      >
        {children}
      </select>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
