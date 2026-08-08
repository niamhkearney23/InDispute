/**
 * The firm writes their induction as plain text. This turns it into blocks.
 *
 * Deliberately not a rich text editor and deliberately not HTML. A policy is
 * written once, read by everyone, and quoted later if it ever matters; the
 * value is in the words, not the formatting. Storing plain text means what a
 * person acknowledged is exactly what is in the column, with nothing between
 * the two that could render it differently tomorrow.
 *
 * It also closes the obvious hole. If the firm pasted HTML and we rendered it,
 * whoever writes the policy would be able to put a script on a page every
 * member of staff is required to open. Here the text is never markup: it is
 * split into blocks and each block's text goes into a React element, which
 * escapes it.
 *
 * The three conventions are the ones people already use without being taught:
 * a blank line starts a paragraph, "## " makes a heading, "- " makes a bullet.
 */

export type FirmBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] };

/** Roughly how long this takes to read, so nobody opens one they cannot finish. */
export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function parseFirmBody(body: string): FirmBlock[] {
  const blocks: FirmBlock[] = [];
  let paragraph: string[] = [];
  let items: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  };

  const flushList = () => {
    if (items.length === 0) return;
    blocks.push({ kind: 'list', items });
    items = [];
  };

  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();

    if (line.length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    // The bare marker is matched as well as the marker with text after it.
    // Trimming turns "## " into "##", and without this that falls through to
    // the paragraph branch and puts two literal hashes on the page.
    if (line === '##' || line.startsWith('## ')) {
      flushParagraph();
      flushList();
      const text = line.slice(2).trim();
      if (text) blocks.push({ kind: 'heading', text });
      continue;
    }

    if (line === '-' || line.startsWith('- ')) {
      flushParagraph();
      const text = line.slice(1).trim();
      if (text) items.push(text);
      continue;
    }

    // A line inside a paragraph. Joined rather than kept, so text pasted from a
    // document with hard-wrapped lines does not come out as one word per line.
    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}
