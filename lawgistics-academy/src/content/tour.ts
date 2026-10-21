import { DEFAULT_SCHEDULE, roundCountWord, roundTimes, zoneName, type Schedule } from '@/lib/training/schedule';

import { DIAGNOSTIC_QUESTION_COUNT } from '@/lib/learning/config';

/**
 * The short tour a learner sees once, straight after they join: what each
 * part of the academy is and where to find it.
 *
 * Every line describes something the app does today. Trainees get the parts
 * that are theirs (the rounds, the work board, the month); everybody else is
 * not told about things they cannot open.
 */

export type TourIcon = 'spark' | 'calendar' | 'check' | 'book' | 'level' | 'briefcase' | 'repeat' | 'arrow';

export interface TourStep {
  key: string;
  /** Where to find it, in the words of the menu. */
  where: string;
  title: string;
  body: string;
  icon: TourIcon;
}

export interface TourFinish {
  title: string;
  body: string;
  label: string;
  href: string;
}

export interface TourFor {
  /** On the litigation trainee programme. */
  trainee: boolean;
  /** Questions are published for their country. */
  open: boolean;
  /** Not yet sat the diagnostic. */
  needsDiagnostic: boolean;
  /** Their cohort's clock, for the rounds card. The programme's own when left out. */
  schedule?: Schedule;
  /**
   * Their country's court map is signed off by a lawyer, so the Courts menu
   * item is there to find. Left out, the tour does not mention it.
   */
  courts?: boolean;
}

export function tourSteps({
  trainee,
  open,
  schedule = DEFAULT_SCHEDULE,
  courts = false,
}: TourFor): TourStep[] {
  const steps: TourStep[] = [
    {
      key: 'today',
      where: 'Menu: Today',
      title: 'Today',
      body: trainee
        ? 'Your day starts here: a note from your coach when they leave one, then everything set for today, with a button to start the round that is open.'
        : 'Your day starts here: a note from your coach when they leave one, then everything set for today, with a button to start training.',
      icon: 'spark',
    },
  ];

  if (trainee) {
    steps.push({
      key: 'rounds',
      where: 'On Today',
      title: 'The daily rounds',
      body:
        `Every working day, ${roundCountWord(schedule)} ${schedule.roundHours.length === 1 ? 'round' : 'rounds'} of ten questions open at ${roundTimes(schedule)}, ${zoneName(schedule)}. Each round is open for its hour. A round you miss stays missed, and your supervisor can see it. The clock in the bottom corner counts down to the next one.` +
        (open ? '' : ' The rounds start once our lawyers have signed the questions off.'),
      icon: 'calendar',
    });
  }

  steps.push(
    {
      key: 'answering',
      where: trainee ? 'In every round' : 'In every session',
      title: 'Answering a question',
      body: 'Pick an answer, then say how sure you are: a guess, somewhat sure, or certain. You see straight away whether it was right and why. Be honest about how sure you are. Being certain and wrong tells us the most, and what you get wrong comes back until you have it.',
      icon: 'check',
    },
    {
      key: 'learn',
      where: 'Menu: Learn',
      title: 'Learn',
      body: 'Modules: a few minutes of teaching, then questions. A lesson appears once a lawyer has checked it. Unlike daily training, a module has a finishing line: it is done when you have got every question in it right at least once.',
      icon: 'book',
    },
    {
      key: 'tutor',
      where: 'Learn, then Tutor',
      title: 'The tutor',
      body: 'Two ways to find out what you really know: explain an idea back in plain words, or let it test you on a module. It asks questions. It does not lecture, and it never tells you the law.',
      icon: 'repeat',
    },
    {
      key: 'skills',
      where: 'Menu: Skills',
      title: 'Where you are',
      body: 'Your score in each area is the share of your answers that were right. It starts at 100% and only a wrong answer brings it down. You also see your score over time, and anything you were certain about and got wrong.',
      icon: 'level',
    },
    ...(courts
      ? [
          {
            key: 'courts',
            where: 'Menu: Courts',
            title: 'Courts',
            body: 'The court map: where a matter starts, and where it goes if somebody appeals. Tap any court to open it.',
            icon: 'arrow' as const,
          },
        ]
      : []),
    {
      key: 'matters',
      where: 'Menu: Learn, then Practise on a file',
      title: 'Matters',
      body: 'A practice file with a clock. Find the procedure, draft a short advice, record yourself explaining it, and answer follow-up questions on your draft. Then see how a lawyer would have done it, and a lawyer marks your work.',
      icon: 'briefcase',
    },
  );

  if (trainee) {
    steps.push(
      {
        key: 'work',
        where: 'Menu: Coach',
        title: 'The work board',
        body: 'Real pieces of work from our lawyers. Put your name on one, hand your work in, and the lawyer marks it and tells you what they would have done differently. Never upload anything that identifies a client.',
        icon: 'briefcase',
      },
      {
        key: 'month',
        where: 'On Today: Your programme',
        title: 'Your month',
        body: 'The month week by week, today’s concept, the training file you work on, a short homework task for each working day, your coach’s videos, and what earns the certificate. All of it is on Your programme, linked from Today.',
        icon: 'calendar',
      },
    );
  }

  steps.push({
    key: 'account',
    where: 'Your picture, top right',
    title: 'Your account',
    body: 'Make a cartoon of yourself or add a photo, and change your password. You can open this tour again from there.',
    icon: 'spark',
  });

  return steps;
}

export function tourFinish({ trainee, open, needsDiagnostic }: TourFor): TourFinish {
  if (open && needsDiagnostic) {
    return {
      title: 'That’s the tour.',
      body: `Next is the diagnostic: about ${DIAGNOSTIC_QUESTION_COUNT} questions with no pass mark. It shows where you are starting from and sets what your training covers.`,
      label: 'Start the diagnostic',
      href: '/diagnostic',
    };
  }
  return {
    title: 'That’s the tour.',
    body:
      !open && trainee
        ? 'The questions open once our lawyers have signed them off. Until then, Today has your homework and anything from your coach.'
        : 'Everything starts from Today.',
    label: 'Go to Today',
    href: '/dashboard',
  };
}
