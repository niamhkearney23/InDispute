import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/guard';
import { Wordmark } from '@/components/ui';

/** Auth-gated and per-request. Never prerender anything under /admin. */
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-rule bg-paper-sunk">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <div className="flex items-baseline gap-3">
            <Link href="/admin" className="-mx-1 rounded-[5px] px-1 py-2">
              <Wordmark compact />
            </Link>
            <span className="eyebrow">Admin</span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/admin"
              className="rounded-[5px] px-2.5 py-2 whitespace-nowrap text-slate hover:bg-paper hover:text-ink"
            >
              Questions
            </Link>
            <Link
              href="/admin/review"
              className="rounded-[5px] px-2.5 py-2 whitespace-nowrap text-slate hover:bg-paper hover:text-ink"
            >
              Verify
            </Link>
            <Link
              href="/admin/facts"
              className="rounded-[5px] px-2.5 py-2 whitespace-nowrap text-slate hover:bg-paper hover:text-ink"
            >
              Daily brief
            </Link>
            <Link
              href="/dashboard"
              className="rounded-[5px] px-2.5 py-2 whitespace-nowrap text-slate hover:bg-paper hover:text-ink"
            >
              Back to app
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
