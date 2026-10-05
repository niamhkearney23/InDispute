import { cn } from '@/components/ui';
import { cartoonDataUri, type CartoonStyle } from '@/lib/avatar/cartoon';

/**
 * The cartoon a person built of themselves, or their own photo, or their
 * initial when they have set neither. A cartoon comes first: somebody who
 * made one has said that is how they want to be shown.
 *
 * Never a silhouette or a generic icon standing in for a person: an initial is
 * honestly "nobody has told us what they look like", where a stock icon reads
 * as a photo that failed to load.
 */
export function Avatar({
  url,
  cartoon = null,
  name,
  size = 28,
  className,
}: {
  url: string | null;
  cartoon?: CartoonStyle | null;
  /** Used only for the initial and the alt text, never shown as a fallback image. */
  name: string | null;
  size?: number;
  className?: string;
}) {
  const initial = name?.trim().charAt(0).toUpperCase() || '?';

  if (cartoon) {
    return (
      // Drawn here from a list of choices, as an SVG data URI.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={cartoonDataUri(cartoon)}
        alt=""
        width={size}
        height={size}
        className={cn('shrink-0 rounded-full border border-rule', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  if (url) {
    return (
      // A learner's own upload, at a size next-image cannot know ahead of time.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className={cn('shrink-0 rounded-full border border-rule object-cover', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border border-rule bg-paper-sunk font-medium text-slate',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initial}
    </span>
  );
}
