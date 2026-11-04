/**
 * Shown the moment somebody taps a link, while the next page is fetched.
 * Every page here is rendered on the server per request, so without this the
 * old page sits still until the new one arrives and a tap feels ignored.
 */
export default function Loading() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="h-4 w-24 animate-pulse rounded bg-rule motion-reduce:animate-none" />
      <div className="h-9 w-2/3 animate-pulse rounded bg-rule motion-reduce:animate-none" />
      <div className="h-24 w-full animate-pulse rounded-lg bg-rule motion-reduce:animate-none" />
      <div className="h-24 w-full animate-pulse rounded-lg bg-rule motion-reduce:animate-none" />
    </div>
  );
}
