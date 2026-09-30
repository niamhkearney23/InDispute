import { cn } from '@/components/ui';

/**
 * A picture for each module, drawn rather than photographed.
 *
 * Line drawings in the brand colour, generated from the module's slug, so a
 * module added in code gets a picture without anyone finding, licensing and
 * uploading a photograph, and the pictures agree with each other. Photographs
 * of gavels and marble columns were considered and are the reason this is
 * drawn: they say "law" the way stock photography says it.
 *
 * Decorative: the card already says what the module is, so the drawing is
 * hidden from screen readers rather than described to them.
 */
export type ModuleArtKind = 'research' | 'ethics' | 'courts' | 'file' | 'firm';

export function artFor(slug: string): ModuleArtKind {
  if (slug.startsWith('research')) return 'research';
  if (slug.startsWith('ai-ethics')) return 'ethics';
  if (slug.startsWith('courts')) return 'courts';
  if (slug.startsWith('litigation-support')) return 'file';
  return 'firm';
}

export function ModuleArt({
  kind,
  className,
}: {
  kind: ModuleArtKind;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'module-art flex items-center justify-center overflow-hidden rounded-t-[inherit] bg-burgundy-wash text-burgundy',
        className,
      )}
    >
      <svg
        viewBox="0 0 120 72"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-full w-auto"
      >
        {ART[kind]}
      </svg>
    </div>
  );
}

const ART: Record<ModuleArtKind, React.ReactNode> = {
  // A book open on the desk, a magnifying glass over the page.
  research: (
    <>
      <path d="M22 20c10-4 20-4 30 0v34c-10-4-20-4-30 0z" fill="currentColor" fillOpacity="0.08" />
      <path d="M52 20c10-4 20-4 30 0v34c-10-4-20-4-30 0" fill="currentColor" fillOpacity="0.04" />
      <path d="M52 20v34" />
      <path d="M29 28h16M29 35h16M29 42h10" strokeOpacity="0.55" />
      <circle cx="80" cy="36" r="12" fill="currentColor" fillOpacity="0.1" />
      <path d="M89 45l11 11" strokeWidth="3" />
      <path d="M75 36a5 5 0 0 1 5-5" strokeOpacity="0.55" />
    </>
  ),
  // Scales, with a spark where the machine sits on one pan.
  ethics: (
    <>
      <path d="M60 14v44M46 58h28" />
      <path d="M30 24h60" />
      <path d="M30 24l-10 18h20zM90 24l-10 18h20z" fill="currentColor" fillOpacity="0.1" />
      <path d="M20 42a10 4 0 0 0 20 0M80 42a10 4 0 0 0 20 0" />
      <circle cx="60" cy="14" r="3" fill="currentColor" />
      <path d="M90 8v6M87 11h6" strokeOpacity="0.7" />
    </>
  ),
  // A courthouse front, and above it the ladder the appeals climb.
  courts: (
    <>
      <path d="M24 58h72" />
      <path d="M30 54v-22M44 54v-22M58 54v-22M72 54v-22M86 54v-22" />
      <path d="M26 32h68" />
      <path d="M22 32l38-18 38 18z" fill="currentColor" fillOpacity="0.1" />
      <path d="M26 58v4h68v-4" strokeOpacity="0.55" />
      <path d="M60 14V6M56 9l4-4 4 4" strokeOpacity="0.7" />
    </>
  ),
  // A folder with the papers of a file sticking out of it.
  file: (
    <>
      <path d="M40 18h20l6 6h28v34H40z" fill="currentColor" fillOpacity="0.06" />
      <path d="M26 24h22l6 6h34v30H26z" fill="currentColor" fillOpacity="0.1" />
      <path d="M52 12h30v10" strokeOpacity="0.55" />
      <path d="M34 42h26M34 49h18" strokeOpacity="0.55" />
      <circle cx="76" cy="46" r="6" fill="currentColor" fillOpacity="0.12" />
      <path d="M73.5 46l2 2 3.5-4" strokeWidth="1.5" />
    </>
  ),
  // The firm's own building.
  firm: (
    <>
      <path d="M34 60V20l26-10 26 10v40z" fill="currentColor" fillOpacity="0.08" />
      <path d="M26 60h68" />
      <path d="M44 30h8v8h-8zM56 30h8v8h-8zM68 30h8v8h-8zM44 44h8v8h-8zM68 44h8v8h-8z" strokeOpacity="0.6" />
      <path d="M56 60V46h8v14" />
      <path d="M60 10V4" strokeOpacity="0.55" />
    </>
  ),
};
