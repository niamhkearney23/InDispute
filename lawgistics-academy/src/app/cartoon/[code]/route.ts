import { cartoonFromCode } from '@/lib/avatar/cartoon';
import { cartoonSvg } from '@/lib/avatar/draw';

/**
 * A cartoon face, drawn from the choices in its address (cartoonPath).
 *
 * Public on purpose, and needs no session: the address is the whole of what
 * is drawn, it reads nothing from the database, and it only ever draws
 * choices from the lists in the code. Anything else is not found. The same
 * address always draws the same face, so it is cached for good.
 */
export function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  return params.then(({ code }) => {
    const style = cartoonFromCode(code.replace(/\.svg$/, ''));
    if (!style) return new Response('Not found', { status: 404 });
    return new Response(cartoonSvg(style), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
        // Its content security policy is set in next.config.ts, which
        // would override one set here.
        'X-Content-Type-Options': 'nosniff',
      },
    });
  });
}
