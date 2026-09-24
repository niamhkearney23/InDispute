import { cn } from '@/components/ui';

/**
 * The bold surface: the accent colour, two soft lights and a faint grid.
 * Depth without a stock photograph, and it takes the firm's accent, so a
 * white-labelled deployment gets its own colour here too. Used for the
 * panel beside the sign-in form and the welcome banner on the dashboard.
 */
export function AccentSurface({
  children,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'aside' | 'section';
}) {
  return (
    <Tag className={cn('relative isolate overflow-hidden bg-burgundy text-paper', className)}>
      <div
        aria-hidden
        className="absolute -top-32 -right-24 -z-10 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_65%)]"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-24 -z-10 size-[30rem] rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.28),transparent_65%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]"
      />
      {children}
    </Tag>
  );
}
