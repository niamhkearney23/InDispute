import { CERTIFICATION_BOXES } from '@/content/seed/certification-boxes';
import { PROGRAMME_DAYS } from '@/content/programme-days';
import { TRAINING_FILE } from '@/content/training-file';
import { dateOfWorkingDay } from '@/lib/homework/rules';
import { conceptForDay } from '@/content/programme-concepts';

/**
 * The intake, as a schedule a coach can work from.
 *
 * Pure: dates and pre-filled forms worked out from the day plan and the
 * intake's start date, with no database. The intake page reads what has
 * actually been posted and lays it against this.
 *
 * A work post for a certification piece is recognised by its title
 * starting "Box N:", which is how the pre-filled form names it. A coach
 * who renames one has only made the intake page stop ticking it off; the
 * post itself is untouched.
 */

export interface ScheduledDay {
  day: number;
  date: string;
  title: string;
  video: string;
  concept: string;
  talkingPoints: string[];
  remember: string;
  due: number[];
}

export function intakeSchedule(startsOn: string): ScheduledDay[] {
  return PROGRAMME_DAYS.map((d) => ({
    day: d.day,
    date: dateOfWorkingDay(startsOn, d.day),
    title: d.title,
    video: d.video,
    concept: conceptForDay(d.day)?.concept ?? d.title,
    talkingPoints: conceptForDay(d.day)?.talkingPoints ?? [],
    remember: conceptForDay(d.day)?.remember ?? '',
    due: d.due,
  }));
}

export function boxTitle(n: number): string {
  const box = CERTIFICATION_BOXES.find((b) => b.number === n);
  return box ? `Box ${n}: ${box.workProduct.split(' (')[0]}` : `Box ${n}`;
}

/** Which certification box a work post is for, from its title, or null. */
export function boxOfTitle(title: string): number | null {
  const m = /^Box (\d{1,2}):/.exec(title.trim());
  return m ? Number(m[1]) : null;
}

/** Query string for /admin/sessions/new, pre-filled for one day of the plan. */
export function sessionPrefill(day: ScheduledDay): string {
  return new URLSearchParams({
    title: `Day ${day.day}: ${day.concept}`,
    summary: day.remember ? `${day.video} ${day.remember}` : day.video,
    airsOn: day.date,
    country: 'MY',
    // The daily programme video is for the cohort, not the whole academy.
    traineesOnly: '1',
  }).toString();
}

/** Query string for /admin/work/new, pre-filled for one certification piece. */
export function workPrefill(n: number, dueOn: string, day: number): string {
  const box = CERTIFICATION_BOXES.find((b) => b.number === n);
  const instructions = [
    `On ${TRAINING_FILE.shortName.replace(/^The /, 'the ')}: ${box?.workProduct ?? ''}.`,
    '',
    `What it has to do: ${box?.tickCriteria ?? ''}`,
    '',
    `Due by the end of day ${day}. Hand it in here. You will get it back marked Good or Needs another go, and you can hand it in again.`,
  ].join('\n');
  return new URLSearchParams({
    title: boxTitle(n),
    instructions,
    dueOn,
    maxClaims: '0',
  }).toString();
}
