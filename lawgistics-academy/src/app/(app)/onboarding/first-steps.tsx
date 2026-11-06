'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { saveOnboarding, type OnboardingState } from '../actions';
import { cn } from '@/components/ui';
import { CartoonPicker } from '@/components/cartoon-picker';
import { DEFAULT_CARTOON, randomCartoon, type CartoonStyle } from '@/lib/avatar/cartoon';
import { cartoonDataUri } from '@/lib/avatar/draw';
import { choicesFor, openCountryOr } from '@/lib/countries';
import {
  careerStageLabel,
  HOME_JURISDICTIONS,
  JURISDICTION_LABELS,
  PRACTICE_CHOICES,
  practiceChoiceFor,
  type CareerStage,
  type Country,
  type Jurisdiction,
  type LearnerTrack,
  type PracticeChoice,
} from '@/lib/types';

const STAGES: CareerStage[] = ['law_student', 'plt_student', 'graduate', 'junior_lawyer'];
const MINUTES = [5, 10, 15, 20];
const MINUTE_FEEL: Record<number, string> = {
  5: 'A coffee',
  10: 'A commute',
  15: 'A lunch break',
  20: 'Serious',
};
const HOME_DEFAULT: Record<Country, Jurisdiction> = { AU: 'NSW', MY: 'MY_MALAYA' };
const MALAYSIA_HOMES: Array<{ value: Jurisdiction; label: string; detail: string }> = [
  {
    value: 'MY_MALAYA',
    label: 'Peninsular Malaysia',
    detail: 'Kuala Lumpur, Selangor, Penang, Johor and the rest of the peninsula.',
  },
  {
    value: 'MY_SABAH_SARAWAK',
    label: 'Sabah and Sarawak',
    detail: 'The High Court in Sabah and Sarawak, with its own rules on land.',
  },
];

type Step = 'name' | 'look' | 'country' | 'stage' | 'minutes' | 'where' | 'ready';

const initialState: OnboardingState = { error: null };

/**
 * A person's first visit, one question to a screen on the dark surface the
 * sign-in pages use (the owner, November 2026: "it says like hi, what's your
 * name? ... I want you to be able to pick what you look like, and it'd be
 * centered"): their name, their cartoon, where they are in their career,
 * how long a day, and where in the country. A choice moves straight on; a
 * Back puts them on the one before. It ends by saying what comes next,
 * which is the diagnostic when there are questions to sit it with.
 *
 * What they want to improve is not asked here: it starts on litigation
 * knowledge and can be changed on Account, and the diagnostic covers
 * everything either way. The programme is never asked: it was settled at
 * sign-up, and saveOnboarding keeps it whatever is sent.
 */
export function FirstSteps({
  defaultName,
  defaultCountry,
  track,
  invited,
  questionsOpen,
  diagnosticQuestions,
}: {
  defaultName: string;
  defaultCountry: Country;
  track: LearnerTrack;
  invited: boolean;
  questionsOpen: boolean;
  diagnosticQuestions: number;
}) {
  const [state, formAction, pending] = useActionState(saveOnboarding, initialState);
  const [name, setName] = useState(defaultName);
  const [cartoon, setCartoon] = useState<CartoonStyle | null>(null);
  const [stage, setStage] = useState<CareerStage | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const countryChoices = choicesFor(PRACTICE_CHOICES.filter((c) => c.track === 'general'));
  const askCountry = track !== 'litigation_trainee' && !invited && countryChoices.length > 1;
  const [choice, setChoice] = useState<PracticeChoice>(() =>
    practiceChoiceFor(invited || track === 'litigation_trainee' ? defaultCountry : openCountryOr(defaultCountry), track),
  );
  const country = choice.country;
  const [home, setHome] = useState<Jurisdiction | null>(null);

  const steps: Step[] = ['name', 'look', ...(askCountry ? (['country'] as Step[]) : []), 'stage', 'minutes', 'where', 'ready'];
  const [at, setAt] = useState(0);
  const step = steps[at];
  const next = () => setAt((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setAt((i) => Math.max(i - 1, 0));
  const first = name.trim().split(/\s+/)[0] ?? '';

  const face = useMemo(() => cartoonDataUri(cartoon ?? DEFAULT_CARTOON), [cartoon]);

  return (
    <form action={formAction} className="mx-auto w-full max-w-[34rem] text-center">
      <input type="hidden" name="displayName" value={name.trim()} />
      <input type="hidden" name="careerStage" value={stage ?? 'law_student'} />
      <input type="hidden" name="country" value={country} />
      <input type="hidden" name="track" value={track} />
      <input type="hidden" name="dailyGoalMinutes" value={minutes ?? 10} />
      <input type="hidden" name="homeJurisdiction" value={home ?? HOME_DEFAULT[country]} />
      <input type="hidden" name="goals" value="litigation_knowledge" />
      {cartoon ? <input type="hidden" name="style" value={JSON.stringify(cartoon)} /> : null}

      <Dots count={steps.length - 1} at={Math.min(at, steps.length - 2)} done={step === 'ready'} />

      {/* Each screen is keyed, so it arrives afresh: the first slowly, as
          the sign-in page does, the rest a little quicker. */}
      <div key={step} className={cn(at === 0 ? 'auth-in auth-in--hello' : 'first-step-in')}>
        {step === 'name' ? (
          <>
            <h1 className="auth-hello">Hi.</h1>
            <p className="mt-5 text-[1.1875rem] text-paper/75">What should we call you?</p>
            <div className="mx-auto mt-8 max-w-[23.5rem]">
              <label htmlFor="first-name" className="sr-only">
                Your name
              </label>
              <input
                id="first-name"
                autoFocus
                autoComplete="name"
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (name.trim()) next();
                  }
                }}
                placeholder="Your first name"
                className="auth-input text-center text-lg"
              />
              <button type="button" disabled={!name.trim()} onClick={next} className="auth-button mt-4">
                Continue
              </button>
            </div>
          </>
        ) : step === 'look' ? (
          <>
            <Title>Nice to meet you{first ? `, ${first}` : ''}.</Title>
            <Lead>Make a cartoon of yourself. It shows beside your name instead of a photo.</Lead>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={face}
              alt="Your cartoon, as it stands"
              width={152}
              height={152}
              className="mx-auto mt-7 size-[152px] rounded-full bg-paper/90"
            />
            <button
              type="button"
              onClick={() => setCartoon(randomCartoon())}
              className="mt-3 inline-flex min-h-11 items-center px-3 text-sm text-paper/65 underline decoration-paper/30 underline-offset-4 hover:text-paper"
            >
              Surprise me
            </button>
            <div className="mt-4 text-left">
              <CartoonPicker value={cartoon ?? DEFAULT_CARTOON} onChange={setCartoon} dark centered />
            </div>
            <Actions onBack={back}>
              <button type="button" onClick={next} className="auth-button sm:w-auto sm:px-10">
                {cartoon ? 'Keep this' : 'Continue'}
              </button>
              {cartoon ? null : (
                <p className="mt-3 text-xs text-paper/45">You can make it later on Account.</p>
              )}
            </Actions>
          </>
        ) : step === 'country' ? (
          <>
            <Title>Which country do you plan to practise in?</Title>
            <Lead>It decides which law you are trained on.</Lead>
            <Options>
              {countryChoices.map((option) => (
                <Option
                  key={option.key}
                  on={choice.key === option.key}
                  label={option.label}
                  detail={option.detail}
                  onPick={() => {
                    setChoice(option);
                    setHome(null);
                    next();
                  }}
                />
              ))}
            </Options>
            <Actions onBack={back} />
          </>
        ) : step === 'stage' ? (
          <>
            <Title>Where are you in your legal career?</Title>
            <Lead>It shapes the tone of the explanations, not how hard the questions are.</Lead>
            <Options>
              {STAGES.map((value) => (
                <Option
                  key={value}
                  on={stage === value}
                  label={careerStageLabel(value, country)}
                  onPick={() => {
                    setStage(value);
                    next();
                  }}
                />
              ))}
            </Options>
            <Actions onBack={back} />
          </>
        ) : step === 'minutes' ? (
          <>
            <Title>How long do you want to train each day?</Title>
            <Lead>Pick something you will do on a bad day. You can change it later.</Lead>
            <Options columns={4}>
              {MINUTES.map((value) => (
                <Option
                  key={value}
                  on={minutes === value}
                  label={`${value} min`}
                  detail={MINUTE_FEEL[value]}
                  onPick={() => {
                    setMinutes(value);
                    next();
                  }}
                />
              ))}
            </Options>
            <Actions onBack={back} />
          </>
        ) : step === 'where' ? (
          country === 'MY' ? (
            <>
              <Title>Where in Malaysia?</Title>
              <Lead>A few rules differ between the peninsula and Sabah and Sarawak, and those are labelled for you.</Lead>
              <Options>
                {MALAYSIA_HOMES.map((option) => (
                  <Option
                    key={option.value}
                    on={home === option.value}
                    label={option.label}
                    detail={option.detail}
                    onPick={() => {
                      setHome(option.value);
                      next();
                    }}
                  />
                ))}
              </Options>
              <Actions onBack={back} />
            </>
          ) : (
            <>
              <Title>Which State or Territory are you in?</Title>
              <Lead>You still see the others, clearly labelled.</Lead>
              <Options columns={4}>
                {HOME_JURISDICTIONS[country].map((value) => (
                  <Option
                    key={value}
                    on={home === value}
                    label={JURISDICTION_LABELS[value]}
                    onPick={() => {
                      setHome(value);
                      next();
                    }}
                  />
                ))}
              </Options>
              <Actions onBack={back} />
            </>
          )
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={face} alt="" width={96} height={96} className="mx-auto mb-6 size-24 rounded-full bg-paper/90" />
            <Title>You are all set{first ? `, ${first}` : ''}.</Title>
            {questionsOpen ? (
              <Lead>
                Next, a test to see where you are: {diagnosticQuestions} questions across every area, with
                no pass mark. The rest of the academy opens when it is done.
              </Lead>
            ) : (
              <Lead>Your day is ready. The diagnostic opens as soon as questions are published.</Lead>
            )}
            {state.error ? (
              <p role="alert" className="mx-auto mt-6 max-w-sm text-[0.9375rem] text-[#f3b9ae]">
                {state.error}
              </p>
            ) : null}
            <Actions onBack={back}>
              <button type="submit" disabled={pending} className="auth-button sm:w-auto sm:px-10">
                {pending ? (
                  <span
                    aria-hidden
                    className="size-4 animate-spin rounded-full border-2 border-[#0c1520]/25 border-t-[#0c1520]"
                  />
                ) : null}
                {pending ? 'Setting up…' : questionsOpen ? 'Start the test' : 'Go to Today'}
              </button>
            </Actions>
          </>
        )}
      </div>
    </form>
  );
}

/**
 * Each screen's question. Every screen is drawn afresh, so its heading takes
 * the focus as it arrives: a screen reader says the new question, and the
 * keyboard starts from it.
 */
function Title({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <h1 ref={ref} tabIndex={-1} className="auth-hello auth-hello--small text-balance focus:outline-none">
      {children}
    </h1>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mx-auto mt-4 max-w-md text-[1.0625rem] leading-relaxed text-balance text-paper/65">{children}</p>;
}

function Options({ children, columns = 2 }: { children: React.ReactNode; columns?: 2 | 4 }) {
  return (
    <div className={cn('mx-auto mt-8 grid gap-2.5 text-left', columns === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'sm:grid-cols-2')}>
      {children}
    </div>
  );
}

function Option({
  on,
  label,
  detail,
  onPick,
}: {
  on: boolean;
  label: string;
  detail?: string;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onPick}
      className={cn(
        'min-h-14 rounded-[6px] border px-4 py-3 text-left transition-colors active:scale-[0.99]',
        on ? 'border-paper/80 bg-paper/[0.08]' : 'border-paper/15 hover:border-paper/40 hover:bg-paper/[0.03]',
      )}
    >
      <span className="block text-[0.9375rem] font-medium text-paper">{label}</span>
      {detail ? <span className="mt-0.5 block text-xs leading-snug text-paper/55">{detail}</span> : null}
    </button>
  );
}

/** The step's own button, and Back to the one before. */
function Actions({ onBack, children }: { onBack: () => void; children?: React.ReactNode }) {
  return (
    <div className="mt-8">
      {children}
      <p className="mt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center px-3 text-sm text-paper/50 transition-colors hover:text-paper"
        >
          Back
        </button>
      </p>
    </div>
  );
}

/** How far along: a short row of dots, the current one longer. */
function Dots({ count, at, done }: { count: number; at: number; done: boolean }) {
  return (
    <div className="mb-10 flex justify-center gap-1.5" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-1 rounded-full transition-all duration-500',
            done || i < at ? 'w-4 bg-paper/60' : i === at ? 'w-8 bg-paper' : 'w-4 bg-paper/15',
          )}
        />
      ))}
    </div>
  );
}
