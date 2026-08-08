import { parseFirmBody } from '@/lib/firm/content';

/**
 * The firm's words on a page.
 *
 * Every string here goes in as a React child, so it is escaped rather than
 * parsed. Whoever writes the firm's policy is trusted to write a policy, which
 * is not the same as being trusted to put markup on a page that every member of
 * staff is required to open.
 */
export function FirmBody({ body }: { body: string }) {
  const blocks = parseFirmBody(body);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.kind === 'heading') {
          return (
            <h2 key={index} className="pt-2 text-xl first:pt-0">
              {block.text}
            </h2>
          );
        }

        if (block.kind === 'list') {
          return (
            <ul key={index} className="space-y-2 pl-1">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex gap-3 text-[1.0625rem] leading-relaxed">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-burgundy" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="text-[1.0625rem] leading-relaxed">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
