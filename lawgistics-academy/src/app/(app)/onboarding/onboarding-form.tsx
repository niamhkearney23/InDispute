'use client';

import { useActionState, useState } from 'react';
import { saveOnboarding, type OnboardingState } from '../actions';
import { Button, Card, Notice, cn } from '@/components/ui';
import { ArrowIcon, CheckIcon } from '@/components/icons';
import {
  careerStageLabel,
  HOME_JURISDICTIONS,
  IMPROVEMENT_GOALS,
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

/** What each daily length feels like, so the choice is about a day, not a number. */
const MINUTE_FEEL: Record<number, string> = {
  5: 'A coffee',
  10: 'A commute',
  15: 'A lunch break',
  20: 'Serious',
};

/**
 * Only places a person can actually work. "Australia, general principle" and
 * "Commonwealth" are tags on questions whose rule applies everywhere; offered
 * here as somewhere to be, they only confused people, the same as "general"
 * and "federal" did for Malaysia. Ordered by how many lawyers are in each.
 */
const JURISDICTIONS = HOME_JURISDICTIONS;

/** Where the form starts when nothing has been chosen yet. */
const HOME_DEFAULT: Record<Country, Jurisdiction> = { AU: 'NSW', MY: 'MY_MALAYA' };

const MALAYSIA_HOMES: Array<{ value: Jurisdiction; label: string; detail: string }> = [
  {
    value: 'MY_MALAYA',
    label: 'Peninsular Malaysia',
    detail: 'The High Court in Malaya: Kuala Lumpur, Selangor, Penang, Johor and the rest of the peninsula.',
  },
  {
    value: 'MY_SABAH_SARAWAK',
    label: 'Sabah and Sarawak',
    detail: 'The High Court in Sabah and Sarawak, with its own rules on land and the native courts.',
  },
];

const initialState: OnboardingState = { error: null };

export function OnboardingForm({
  defaultName,
  defaultCountry,
  defaultTrack,
  defaultJurisdiction,
  defaultStage,
  defaultGoals,
  defaultMinutes,
  editing = false,
}: {
  defaultName: string;
  defaultCountry: Country;
  defaultTrack: LearnerTrack;
  defaultJurisdiction: Jurisdiction;
  defaultStage?: CareerStage;
  defaultGoals?: string[];
  defaultMinutes?: number;
  editing?: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveOnboarding, initialState);
  const [stage, setStage] = useState<CareerStage>(
    defaultStage && STAGES.includes(defaultStage) ? defaultStage : 'law_student',
  );
  const [goals, setGoals] = useState<string[]>(
    defaultGoals && defaultGoals.length > 0 ? defaultGoals : ['litigation_knowledge'],
  );
  const [minutes, setMinutes] = useState(
    defaultMinutes && MINUTES.includes(defaultMinutes) ? defaultMinutes : 10,
  );
  const [choice, setChoice] = useState<PracticeChoice>(() =>
    practiceChoiceFor(defaultCountry, defaultTrack),
  );
  const country = choice.country;
  // Where they work, kept in step with the country: choosing Malaysia must not
  // leave a Victorian home behind, and a Malaysian home that is one of the
  // old country-wide tags starts them on the peninsula.
  const [home, setHome] = useState<Jurisdiction>(() =>
    JURISDICTIONS[defaultCountry].includes(defaultJurisdiction)
      ? defaultJurisdiction
      : HOME_DEFAULT[defaultCountry],
  );
  // Somebody who chose "Australia, general principle" before it stopped being
  // offered is started on the first tile, and told, so they do not save a
  // State they never picked without noticing.
  const remapped = editing && !JURISDICTIONS[defaultCountry].includes(defaultJurisdiction);
  const pickChoice = (option: PracticeChoice) => {
    setChoice(option);
    if (option.country !== country) setHome(HOME_DEFAULT[option.country]);
  };

  function toggleGoal(slug: string) {
    setGoals((current) =>
      current.includes(slug) ? current.filter((g) => g !== slug) : [...current, slug],
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="careerStage" value={stage} />
      <input type="hidden" name="country" value={country} />
      <input type="hidden" name="track" value={choice.track} />
      <input type="hidden" name="dailyGoalMinutes" value={minutes} />
      {editing ? <input type="hidden" name="editing" value="1" /> : null}
      {goals.map((slug) => (
        <input key={slug} type="hidden" name="goals" value={slug} />
      ))}

      {/* A trainee is on a Malaysian firm's programme, which settled the
          country when they signed up on the trainee page. Offering Australia
          here as well only confused them: they are told where they are, not
          asked. Everyone else chooses between the two countries; the way on
          to the programme is the trainee page, not a third tile here. */}
      {choice.track === 'litigation_trainee' ? (
        <Card>
          <div className="flex items-center gap-3">
            <StepNumber n={1} done />
            <div>
              <p className="eyebrow">Your programme</p>
              <p className="text-lg">Litigation trainee, Malaysia</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <fieldset>
            <legend className="mb-1 flex items-center gap-3 text-lg">
              <StepNumber n={1} />
              Which country do you plan to practise in?
            </legend>
            <p className="mb-4 text-sm text-slate">
              This one is not a preference. Australian and Malaysian law are different
              bodies of law, so it decides which questions you are ever shown.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PRACTICE_CHOICES.filter((option) => option.track === 'general').map((option) => (
                <Choice
                  key={option.key}
                  selected={choice.key === option.key}
                  onClick={() => pickChoice(option)}
                  label={option.label}
                  detail={option.detail}
                />
              ))}
            </div>
          </fieldset>
        </Card>
      )}

      <Card>
        <fieldset>
<legend className="mb-1 flex items-center gap-3 text-lg">
            <StepNumber n={2} />
            Where are you in your legal career?
          </legend>
          <p className="mb-4 text-sm text-slate">
            This shapes the tone of explanations, not the difficulty.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {STAGES.map((value) => (
              <Choice
                key={value}
                selected={stage === value}
                onClick={() => setStage(value)}
                label={careerStageLabel(value, country)}
              />
            ))}
          </div>
        </fieldset>
      </Card>

      <Card>
        <fieldset>
<legend className="mb-1 flex items-center gap-3 text-lg">
            <StepNumber n={3} />
            What do you want to improve?
          </legend>
          <p className="mb-4 text-sm text-slate">
            Choose as many as you like. Your diagnostic still covers everything; this
            only nudges what comes up in daily training.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {IMPROVEMENT_GOALS.map((goal) => (
              <Choice
                key={goal.slug}
                selected={goals.includes(goal.slug)}
                onClick={() => toggleGoal(goal.slug)}
                label={goal.label}
              />
            ))}
          </div>
        </fieldset>
      </Card>

      <Card>
        <fieldset>
<legend className="mb-1 flex items-center gap-3 text-lg">
            <StepNumber n={4} />
            How long do you want to train each day?
          </legend>
          <p className="mb-4 text-sm text-slate">
            Pick something you will actually do on a bad day. You can change it later.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MINUTES.map((value) => (
              <Choice
                key={value}
                selected={minutes === value}
                onClick={() => setMinutes(value)}
                label={`${value} min`}
                detail={MINUTE_FEEL[value]}
                centered
              />
            ))}
          </div>
        </fieldset>
      </Card>

      <Card>
        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="mb-1 flex items-center gap-3 text-lg">
              <StepNumber n={5} />
              What should we call you?
            </label>
            <input
              id="displayName"
              name="displayName"
              defaultValue={defaultName}
              maxLength={80}
              className="mt-2 h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3.5 text-base outline-none focus:border-burgundy"
            />
          </div>

          {country === 'MY' ? (
            <fieldset>
              <legend className="mb-1 text-lg">Where in Malaysia?</legend>
              <p className="mb-3 text-sm text-slate">
                Most rules are the same across the country and you see all of them. A few
                differ between the peninsula and Sabah and Sarawak, and those are labelled
                so you know which is yours.
              </p>
              <input type="hidden" name="homeJurisdiction" value={home} />
              <div className="grid gap-2 sm:grid-cols-2">
                {MALAYSIA_HOMES.map((option) => (
                  <Choice
                    key={option.value}
                    selected={home === option.value}
                    onClick={() => setHome(option.value)}
                    label={option.label}
                    detail={option.detail}
                  />
                ))}
              </div>
            </fieldset>
          ) : (
            <fieldset>
              <legend className="mb-1 text-lg">Which State or Territory are you in?</legend>
              <p className="mb-3 text-sm text-slate">
                Every question is tagged with the jurisdiction its rule belongs to. This
                says which one is home; you still see the others, clearly labelled.
                {remapped && country === 'AU'
                  ? ' We have started you on New South Wales. Change it if that is not where you are.'
                  : ''}
              </p>
              <input type="hidden" name="homeJurisdiction" value={home} />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {JURISDICTIONS[country].map((value) => (
                  <Choice
                    key={value}
                    selected={home === value}
                    onClick={() => setHome(value)}
                    label={JURISDICTION_LABELS[value]}
                  />
                ))}
              </div>
            </fieldset>
          )}
        </div>
      </Card>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}

      <Button
        type="submit"
        size="lg"
        variant="accent"
        disabled={pending}
        className="group h-14 w-full rounded-lg text-[1.0625rem] sm:w-auto sm:px-10"
      >
        {pending ? 'Saving…' : editing ? 'Save changes' : 'Start my diagnostic'}
        {pending ? null : (
          <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
        )}
      </Button>
    </form>
  );
}

function Choice({
  selected,
  onClick,
  label,
  detail,
  centered = false,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  detail?: string;
  centered?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'relative rounded-lg border-2 px-4 py-3 text-[0.9375rem] transition-[border-color,background-color,transform,box-shadow] duration-150 active:scale-[0.98]',
        centered ? 'text-center' : 'pr-9 text-left',
        selected
          ? 'border-burgundy bg-burgundy-wash font-medium text-burgundy shadow-card'
          : 'border-rule hover:-translate-y-px hover:border-rule-strong hover:bg-paper-raised',
      )}
    >
      {selected && !centered ? (
        <span
          aria-hidden
          className="bubble-pop absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-burgundy text-paper"
        >
          <CheckIcon className="size-3" />
        </span>
      ) : null}
      {label}
      {detail ? (
        <span
          className={cn(
            'mt-0.5 block text-xs font-normal',
            selected ? 'text-burgundy/80' : 'text-muted',
          )}
        >
          {detail}
        </span>
      ) : null}
    </button>
  );
}

/** The number beside each question, ticked once it is settled. */
function StepNumber({ n, done = false }: { n: number; done?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-full font-serif text-base',
        done ? 'bg-burgundy text-paper' : 'bg-burgundy-wash text-burgundy',
      )}
    >
      {done ? <CheckIcon className="size-4" /> : n}
    </span>
  );
}
