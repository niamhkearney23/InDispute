/**
 * Whether an error thrown by a server action is Next sending the browser
 * somewhere, rather than something going wrong.
 *
 * A server action that ends in redirect() does so by throwing, and that
 * throw reaches a client component's catch block just like a real failure.
 * Caught and shown, it reads "NEXT_REDIRECT" in red under the button while
 * the page is already on its way elsewhere, which is what people saw. The
 * only right thing to do with it is let it go.
 */
export function isRedirect(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const digest = (error as { digest?: unknown }).digest;
  const message = (error as { message?: unknown }).message;
  return (
    (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) ||
    (typeof message === 'string' && message.startsWith('NEXT_REDIRECT'))
  );
}
