import { DIAGNOSTIC_QUESTION_COUNT, diagnosticMinutes } from '@/lib/learning/config';
import { BeginSessionButton } from '../begin-session-button';

/**
 * The one thing on the first visit once the first steps are done: Today
 * and the diagnostic page both show only this until the diagnostic is
 * finished (first-steps.ts). On the dark surface, centred, arriving the
 * way the sign-in page does. "Begin" carries on where they stopped if they
 * started it before.
 */
export function FirstTest({ name }: { name: string | null }) {
  const first = name?.trim().split(/\s+/)[0];
  return (
    <section aria-labelledby="first-test" className="mx-auto w-full max-w-[34rem] text-center">
      <p className="auth-in text-sm text-paper/50">{first ? `Welcome, ${first}` : 'Welcome'}</p>
      <h1 id="first-test" className="auth-hello auth-hello--small auth-in auth-in--hello mt-3 text-balance">
        First, a test to see where you are.
      </h1>
      <p className="auth-in auth-in--2 mx-auto mt-5 max-w-md text-[1.0625rem] leading-relaxed text-balance text-paper/65">
        {DIAGNOSTIC_QUESTION_COUNT} questions across every area. There is no pass mark, and you will get
        some wrong: that is expected. When it is done you see your level, and the rest of the academy
        opens.
      </p>
      <ul className="auth-in auth-in--3 mx-auto mt-8 max-w-md space-y-3 text-left text-[0.9375rem] text-paper/70">
        <li className="border-t border-paper/10 pt-3">
          <span className="text-paper">About {diagnosticMinutes()} minutes.</span> Stop whenever you like;
          your place is kept.
        </li>
        <li className="border-t border-paper/10 pt-3">
          <span className="text-paper">Answer honestly, including how sure you are.</span> A guess marked as
          a guess is not held against you.
        </li>
        <li className="border-t border-b border-paper/10 py-3">
          <span className="text-paper">You are asked once.</span> After this, each day has its own questions.
        </li>
      </ul>
      <div className="auth-in auth-in--4 mt-9 flex justify-center">
        <BeginSessionButton kind="diagnostic" label="Begin the test" variant="light" />
      </div>
    </section>
  );
}
