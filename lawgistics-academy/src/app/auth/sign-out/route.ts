import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { siteOrigin } from '@/lib/site-origin';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  // The site's own address when the deployment names one: behind a proxy
  // other than Vercel's, the request's origin can be localhost.
  return NextResponse.redirect(new URL('/', siteOrigin(request.nextUrl.origin)), { status: 303 });
}
