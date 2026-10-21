/**
 * A section that opens in place: the browser's own <details>, so it works
 * with a keyboard and a screen reader without any script, keeps its state
 * when the page is printed, and opens on a link to its id. The summary says
 * what is inside before it is opened, so nothing is hidden behind a bare
 * "More".
 */
export function Disclosure({
  id,
  title,
  preview,
  children,
  defaultOpen = false,
}: {
  id?: string;
  title: string;
  /** One line on what is inside, shown while it is closed. */
  preview?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="group panel scroll-mt-24 rounded-lg border border-rule bg-paper-raised shadow-card"
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block font-semibold">{title}</span>
          {preview ? <span className="mt-0.5 block text-sm text-muted">{preview}</span> : null}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="border-t border-rule px-4 pt-4 pb-5 sm:px-5">{children}</div>
    </details>
  );
}
