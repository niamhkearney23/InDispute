'use client';

import { useActionState, useState } from 'react';
import { saveOnboarding, type OnboardingState } from '../actions';
import { Button, Card, Notice, cn } from '@/components/ui';
import {
  careerStageLabel,
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

/**
 * Ordered as a person would expect to find their own, with the general option
 * first for anyone who does not want to commit to one.
 */
const JURISDICTIONS: Record<Country, Jurisdiction[]> = {
  AU: ['AU_GENERAL', 'VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'CTH'],
  // Only the two places a person can actually be. "General" and "federal"
  // are tags on questions whose rule applies everywhere in Malaysia; offered
  // here as somewhere to work, they only confused people.
  MY: ['MY_MALAYA', 'MY_SABAH_SARAWAK'],
};

/** Where the form starts when nothing has been chosen yet. */
const HOME_DEFAULT: Record<Country, Jurisdiction> = { AU: 'AU_GENERAL', MY: 'MY_MALAYA' };

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
          <p className="eyebrow mb-2">Your programme</p>
          <p className="text-lg">Litigation trainee, Malaysia</p>
          <p className="mt-1 text-sm text-slate">
            You are on a Malaysian firm&rsquo;s programme, so you are trained on Malaysian
            law. Your supervisor confirms you once you are in.
          </p>
        </Card>
      ) : (
        <Card>
          <fieldset>
            <legend className="mb-1 text-lg">Which country do you plan to practice in?</legend>
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
          <legend className="mb-1 text-lg">Where are you in your legal career?</legend>
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
          <legend className="mb-1 text-lg">What do you want to improve?</legend>
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
          <legend className="mb-1 text-lg">How long do you want to train daily?</legend>
          <p className="mb-4 text-sm text-slate">
            Pick something you will actually do on a bad day. You can change it later.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {MINUTES.map((value) => (
              <Choice
                key={value}
                selected={minutes === value}
                onClick={() => setMinutes(value)}
                label={`${value} min`}
                centered
              />
            ))}
          </div>
        </fieldset>
      </Card>

      <Card>
        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="mb-1 block text-lg">
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
            <div>
              <label htmlFor="homeJurisdiction" className="mb-1 block text-lg">
                Which State or Territory do you work in?
              </label>
              <p className="mb-2 text-sm text-slate">
                Every question is tagged with the jurisdiction its rule belongs to. This
                tells us which one is home; you will still see the others, clearly
                labelled.
              </p>
              <select
                id="homeJurisdiction"
                name="homeJurisdiction"
                value={home}
                onChange={(event) => setHome(event.target.value as Jurisdiction)}
                className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy"
              >
                {JURISDICTIONS[country].map((value) => (
                  <option key={value} value={value}>
                    {JURISDICTION_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}

      <Button type="submit" size="lg" variant="accent" disabled={pending}>
        {pending ? 'Saving…' : editing ? 'Save changes' : 'Continue'}
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
        'rounded-md border px-4 py-3 text-[0.9375rem] transition-colors',
        centered ? 'text-center' : 'text-left',
        selected
          ? 'border-burgundy bg-burgundy-wash font-medium text-burgundy'
          : 'border-rule-strong hover:bg-paper-sunk',
      )}
    >
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
