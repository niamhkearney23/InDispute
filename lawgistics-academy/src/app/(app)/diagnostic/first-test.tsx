import { DIAGNOSTIC_QUESTION_COUNT, diagnosticMinutes } from '@/lib/learning/config';
import { BeginSessionButton } from '../begin-session-button';

/**
 * The one thing on the first visit once the first steps are done: Today
 * and the diagnostic page both show only this until the diagnostic is
 * finished (first-steps.ts). Set out like an assessment notice (the owner,
 * November 2026: "more serious"): a plain title, one line on what it is
 * for, and the terms as a short list of facts. "Begin" carries on where
 * they stopped if they started it before.
 */
export function FirstTest() {
  const terms: Array<[string, string]> = [
    ['Questions', `${DIAGNOSTIC_QUESTION_COUNT}, multiple choice, across every area of the programme`],
    ['Time', `About ${diagnosticMinutes()} minutes`],
    ['Pass mark', 'None. Your level is the share of questions answered correctly.'],
    ['Confidence', 'Each answer asks how sure you are. A guess marked as a guess is not held against you.'],
    ['Progress', 'Saved as you go. You may stop and return to it.'],
    ['Taken', 'Once. Daily training follows from the result.'],
  ];
  return (
    <section aria-labelledby="first-test" className="mx-auto w-full max-w-[36rem]">
      <div className="text-center">
        <p className="auth-in text-sm text-paper/50">Required before you begin</p>
        <h1 id="first-test" className="auth-hello auth-hello--small auth-in auth-in--hello mt-3">
          Diagnostic assessment
        </h1>
        <p className="auth-in auth-in--2 mx-auto mt-5 max-w-md text-[1.0625rem] leading-relaxed text-balance text-paper/65">
          It sets your starting level and what your daily training covers. The rest of the academy opens
          once it is complete.
        </p>
      </div>
      <dl className="auth-in auth-in--3 mt-9 border-t border-paper/12 text-[0.9375rem]">
        {terms.map(([term, detail]) => (
          <div key={term} className="grid gap-1 border-b border-paper/12 py-3 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
            <dt className="text-paper/45">{term}</dt>
            <dd className="text-paper/85">{detail}</dd>
          </div>
        ))}
      </dl>
      <div className="auth-in auth-in--4 mt-9 flex justify-center">
        <BeginSessionButton kind="diagnostic" label="Begin the assessment" variant="light" />
      </div>
    </section>
  );
}
