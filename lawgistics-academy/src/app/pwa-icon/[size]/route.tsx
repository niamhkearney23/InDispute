import { ImageResponse } from 'next/og';
import { markDataUri } from '@/lib/brand-mark';

const SIZES = new Set([180, 192, 512]);

/** The home-screen icon as a PNG: the same mark as the tab icon. */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const size = Number(raw);
  if (!SIZES.has(size)) return new Response('Not found', { status: 404 });
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={markDataUri()} width={size} height={size} alt="" />
    ),
    { width: size, height: size, headers: { 'Cache-Control': 'public, max-age=86400' } },
  );
}
