import Image from 'next/image';
import { cn } from '@/components/ui';

/**
 * A picture for each module.
 *
 * Five illustrations, one per kind, generated once with OpenAI's image model
 * in one house style (burgundy, warm paper and ink, no text, no faces, no
 * gavels) and saved as files in `public/modules/`. The app never calls
 * OpenAI for them: they are ordinary static pictures. A module added in code
 * picks up whichever of the five its slug maps to.
 *
 * Decorative: the card already says what the module is, so the picture is
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
        'module-art relative flex items-center justify-center overflow-hidden rounded-t-[inherit] bg-accent-wash',
        className,
      )}
    >
      <Image
        src={`/modules/${kind}.webp`}
        alt=""
        fill
        sizes="(min-width: 640px) 400px, 100vw"
        className="object-cover"
      />
    </div>
  );
}
