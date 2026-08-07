'use client';

import { useActionState, useState } from 'react';
import { saveOnboarding, type OnboardingState } from '../actions';
import { Button, Card, Notice, cn } from '@/components/ui';
import {
  CAREER_STAGE_LABELS,
  COUNTRIES,
  COUNTRY_LABELS,
  DEFAULT_JURISDICTION,
  IMPROVEMENT_GOALS,
  JURISDICTION_LABELS,
  type CareerStage,
  type Country,
  type Jurisdiction,
} from '@/lib/types';

const STAGES: CareerStage[] = ['law_student', 'plt_student', 'graduate', 'junior_lawyer'];
const MINUTES = [5, 10, 15, 20];

/**
 * Ordered as a person would expect to find their own, with the general option
 * first for anyone who does not want to commit to one.
 */
const JURISDICTIONS: Record<Country, Jurisdiction[]> = {
  AU: ['AU_GENERAL', 'VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'CTH'],
  MY: ['MY_GENERAL', 'MY_FEDERAL', 'MY_MALAYA', 'MY_SABAH_SARAWAK'],
};

const initialState: OnboardingState = { error: null };

export function OnboardingForm({
  defaultName,
  defaultCountry,
  defaultJurisdiction,
}: {
  defaultName: string;
  defaultCountry: Country;
  defaultJurisdiction: Jurisdiction;
}) {
  const [state, formAction, pending] = useActionState(saveOnboarding, initialState);
  const [stage, setStage] = useState<CareerStage>('law_student');
  const [goals, setGoals] = useState<string[]>(['litigation_knowledge']);
  const [minutes, setMinutes] = useState(10);
  const [country, setCountry] = useState<Country>(defaultCountry);

  function toggleGoal(slug: string) {
    setGoals((current) =>
      current.includes(slug) ? current.filter((g) => g !== slug) : [...current, slug],
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="careerStage" value={stage} />
      <input type="hidden" name="country" value={country} />
      <input type="hidden" name="dailyGoalMinutes" value={minutes} />
      {goals.map((slug) => (
        <input key={slug} type="hidden" name="goals" value={slug} />
      ))}

      <Card>
        <fieldset>
          <legend className="mb-1 text-lg">Which country are you training in?</legend>
          <p className="mb-4 text-sm text-slate">
            This one is not a preference. Australian and Malaysian law are different
            bodies of law, so it decides which questions you are ever shown.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {COUNTRIES.map((value) => (
              <Choice
                key={value}
                selected={country === value}
                onClick={() => setCountry(value)}
                label={COUNTRY_LABELS[value]}
                centered
              />
            ))}
          </div>
        </fieldset>
      </Card>

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
                label={CAREER_STAGE_LABELS[value]}
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

          <div>
            <label htmlFor="homeJurisdiction" className="mb-1 block text-lg">
              Which jurisdiction do you work in?
            </label>
            <p className="mb-2 text-sm text-slate">
              Every question is tagged with the jurisdiction its rule belongs to. This
              tells us which one is home; you will still see the others, clearly
              labelled.
            </p>
            <select
              id="homeJurisdiction"
              name="homeJurisdiction"
              // Keyed on country so switching country resets the selection
              // rather than leaving a Victorian learner in Malaysia.
              key={country}
              defaultValue={
                country === defaultCountry ? defaultJurisdiction : DEFAULT_JURISDICTION[country]
              }
              className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy"
            >
              {JURISDICTIONS[country].map((value) => (
                <option key={value} value={value}>
                  {JURISDICTION_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}

      <Button type="submit" size="lg" variant="accent" disabled={pending}>
        {pending ? 'Saving…' : 'Continue to the diagnostic'}
      </Button>
    </form>
  );
}

function Choice({
  selected,
  onClick,
  label,
  centered = false,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
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
    </button>
  );
}
