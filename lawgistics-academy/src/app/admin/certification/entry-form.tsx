'use client';

import { useActionState } from 'react';
import { Button, Card, Notice } from '@/components/ui';
import { CERTIFICATION_BOXES } from '@/content/seed/certification-boxes';
import { GRADE_LABELS, type CertificationGrade } from '@/lib/certification/grades';
import type { AdminState } from '../actions';

export interface EntryFormValues {
  id?: string;
  traineeId: string;
  boxNumber: number | '';
  caseNo: string;
  courtFileRef: string;
  caseTypeStage: string;
  dateIn: string;
  draftBack: string;
  grade: CertificationGrade | '';
  screeningConfirmed: boolean;
  note: string;
}

const GRADE_OPTIONS: CertificationGrade[] = ['l1_observed', 'l2_assisted', 'l3_independent'];

export function EntryForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: AdminState, formData: FormData) => Promise<AdminState>;
  initial: EntryFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="space-y-5">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="traineeId" value={initial.traineeId} />

      <Card>
        <div className="space-y-4">
          <div>
            <label htmlFor="boxNumber" className="mb-1.5 block text-sm font-medium">
              Box
            </label>
            <select
              id="boxNumber"
              name="boxNumber"
              defaultValue={initial.boxNumber}
              required
              className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
            >
              <option value="" disabled>
                Choose a box
              </option>
              {CERTIFICATION_BOXES.map((box) => (
                <option key={box.number} value={box.number}>
                  {box.number}. {box.workProduct}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="caseNo" className="mb-1.5 block text-sm font-medium">
                Case number
              </label>
              <input
                id="caseNo"
                name="caseNo"
                defaultValue={initial.caseNo}
                required
                maxLength={200}
                className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
              />
            </div>
            <div>
              <label htmlFor="courtFileRef" className="mb-1.5 block text-sm font-medium">
                Court / file ref
              </label>
              <input
                id="courtFileRef"
                name="courtFileRef"
                defaultValue={initial.courtFileRef}
                maxLength={200}
                className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="caseTypeStage" className="mb-1.5 block text-sm font-medium">
              Case type & stage
            </label>
            <input
              id="caseTypeStage"
              name="caseTypeStage"
              defaultValue={initial.caseTypeStage}
              maxLength={200}
              placeholder="e.g. Sessions Court civil, pre-trial"
              className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dateIn" className="mb-1.5 block text-sm font-medium">
                Date in
              </label>
              <input
                id="dateIn"
                name="dateIn"
                type="date"
                defaultValue={initial.dateIn}
                required
                className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
              />
            </div>
            <div>
              <label htmlFor="draftBack" className="mb-1.5 block text-sm font-medium">
                Draft back (once returned)
              </label>
              <input
                id="draftBack"
                name="draftBack"
                type="date"
                defaultValue={initial.draftBack}
                className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="grade" className="mb-1.5 block text-sm font-medium">
              Grade
            </label>
            <select
              id="grade"
              name="grade"
              defaultValue={initial.grade}
              className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
            >
              <option value="">Not yet graded</option>
              {GRADE_OPTIONS.map((grade) => (
                <option key={grade} value={grade}>
                  {GRADE_LABELS[grade]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">
              Only L3, Independent, counts toward certification: the first draft needed
              only cosmetic correction.
            </p>
          </div>

          <div>
            <label htmlFor="note" className="mb-1.5 block text-sm font-medium">
              Note (optional)
            </label>
            <textarea
              id="note"
              name="note"
              defaultValue={initial.note}
              rows={3}
              maxLength={2000}
              className="w-full rounded-[5px] border border-rule-strong bg-paper px-3 py-2.5 text-base outline-none focus:border-burgundy"
            />
          </div>

          <label className="flex items-start gap-2.5 py-2 text-sm">
            <input
              type="checkbox"
              name="screeningConfirmed"
              defaultChecked={initial.screeningConfirmed}
              className="mt-0.5 size-5"
            />
            <span>
              <strong className="font-medium">Screening confirmed.</strong>{' '}
              <span className="text-slate">
                Live file, client consent for training use given, and no conflict for the
                trainee or their firm.
              </span>
            </span>
          </label>
        </div>
      </Card>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
