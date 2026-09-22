import Link from 'next/link';
import { Pill } from '@/components/ui';
import type { WorkPost } from '@/lib/work/service';

/**
 * What a coach has hung under a session or a homework day: something to
 * read, or a task that goes with it. Each links to its own page, which is
 * where the file is opened and where a task is claimed and handed in, so
 * there is one place a file is ever signed for.
 */
export function Materials({ posts }: { posts: WorkPost[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="mt-4 border-t border-rule pt-3">
      <p className="eyebrow mb-2">From your coach</p>
      <ul className="space-y-1">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              href={`/work/${post.id}`}
              className="-mx-1 inline-flex min-h-11 flex-wrap items-center gap-2 rounded-[5px] px-1 text-sm hover:bg-paper-sunk"
            >
              <Pill tone={post.kind === 'task' ? 'accent' : 'neutral'}>
                {post.kind === 'task' ? 'Task' : post.fileName ? 'File' : 'Link'}
              </Pill>
              <span className="text-burgundy underline underline-offset-2">{post.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
