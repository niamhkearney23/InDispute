import { appIcon } from '@/lib/app-icon';

/**
 * The icons the manifest names: 192 and 512 pixels for Android's home screen
 * and install prompt, and a maskable 512 that Android crops to its own shape.
 * Drawn once at build time from the brand, which is fixed per deployment.
 */
const VARIANTS = {
  '192': () => appIcon(192),
  '512': () => appIcon(512),
  maskable: () => appIcon(512, 'maskable'),
} as const;

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  const draw = VARIANTS[variant as keyof typeof VARIANTS];
  if (!draw) return new Response('Not found', { status: 404 });
  return draw();
}
