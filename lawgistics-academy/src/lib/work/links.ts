/**
 * The rules the work board applies to what a coach links and what anybody
 * uploads. Pure, no database, so they are tested directly and shared by the
 * forms, the actions and the read side.
 */

/**
 * Where a coach may link to. Named hosts, as the video allowlist in
 * lib/lessons/embed is: a link on a training page is somewhere we are sending
 * a junior, so the question is whether we chose the destination. The same
 * rule is a check constraint on work_posts.
 */
const WORK_LINK_HOSTS = new Set(['drive.google.com', 'docs.google.com']);

export function isTrustedWorkLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && WORK_LINK_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

/** What may be uploaded, and the extension each is stored under. */
export const WORK_FILE_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export const WORK_FILE_MAX_BYTES = 20 * 1024 * 1024;

export const WORK_FILE_ACCEPT = Object.keys(WORK_FILE_TYPES).join(',');

/**
 * Why a file cannot be uploaded, in a sentence, or null when it can. The
 * bucket enforces the same limits again on its side; checking here as well
 * means a rejected file gets plain language instead of a storage error.
 */
export function workFileProblem(file: { type: string; size: number }): string | null {
  if (file.size === 0) return 'Choose a file first.';
  if (!WORK_FILE_TYPES[file.type]) {
    return 'That needs to be a PDF, a Word document, or a JPEG or PNG image.';
  }
  if (file.size > WORK_FILE_MAX_BYTES) {
    return 'That file is larger than 20MB. Try a smaller one.';
  }
  return null;
}

export type Verdict = 'good' | 'again';

export type SubmissionState = 'none' | 'waiting' | 'good' | 'again';

/** Where a person stands on a piece of work, from their latest submission. */
export function submissionState(latest: { verdict: Verdict | null } | null): SubmissionState {
  if (!latest) return 'none';
  return latest.verdict ?? 'waiting';
}

/** Whether a date-only string (YYYY-MM-DD) is before today (also YYYY-MM-DD). */
export function isLate(dueOn: string | null, today: string): boolean {
  return dueOn !== null && dueOn < today;
}

/**
 * What a browser records when a coach presses the button, plus what a phone
 * hands over when they attach a recording made elsewhere. Chrome and Firefox
 * produce WebM, Safari produces MP4; the rest are files, not recordings.
 */
export const WORK_MEMO_TYPES: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
};

export const WORK_MEMO_ACCEPT = Object.keys(WORK_MEMO_TYPES).join(',');

/** Five minutes. Longer than that is a session, and sessions have a home. */
export const WORK_MEMO_MAX_SECONDS = 300;

/**
 * A recorded type can carry a codec suffix ('audio/webm;codecs=opus'), which
 * the bucket does not list. The bare type is what is checked and stored.
 */
export function bareMemoType(type: string): string {
  return type.split(';')[0].trim().toLowerCase();
}

export function workMemoProblem(file: { type: string; size: number }): string | null {
  if (file.size === 0) return 'The recording is empty. Try again.';
  if (!WORK_MEMO_TYPES[bareMemoType(file.type)]) {
    return 'That recording is in a format that cannot be played here.';
  }
  if (file.size > WORK_FILE_MAX_BYTES) {
    return 'That recording is larger than 20MB. Keep it under five minutes.';
  }
  return null;
}

/** How many people may take a task, in words. Null is no limit. */
export function slotsLabel(maxClaims: number | null): string {
  if (maxClaims === null) return 'For everyone';
  if (maxClaims === 1) return 'For one person';
  return `For ${maxClaims} people`;
}

/** An expected time, in words: "about 45 minutes", "about 2 hours". */
export function describeMinutes(minutes: number): string {
  if (minutes < 60) return `about ${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.round((minutes / 60) * 2) / 2;
  if (hours >= 8) {
    const days = Math.round((hours / 8) * 2) / 2;
    return `about ${days} day${days === 1 ? '' : 's'}`;
  }
  return `about ${hours} hour${hours === 1 ? '' : 's'}`;
}
