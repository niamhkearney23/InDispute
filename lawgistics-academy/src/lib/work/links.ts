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
