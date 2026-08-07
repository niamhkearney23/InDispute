/**
 * Which hosts a lesson video may be framed from.
 *
 * An iframe src is somebody else's page running inside this one, so the
 * question is not whether a URL looks safe but whether we chose the host. Hence
 * an allowlist rather than a sanitiser.
 *
 * Kept out of the player component so it is a plain function: importable by a
 * test without dragging React and the Next router in behind it.
 */
const EMBED_HOSTS = new Set([
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'www.youtube.com',
  'youtube.com',
  'player.vimeo.com',
]);

export function isEmbeddable(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && EMBED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}
