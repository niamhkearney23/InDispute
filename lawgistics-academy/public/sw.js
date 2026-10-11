/*
 * The academy's service worker. Three jobs, and deliberately nothing else.
 *
 * 1. Show a notification when the server sends one (round reminders, marked
 *    work, new work), and open the right page when it is tapped.
 * 2. Show a calm offline page when there is no connection, instead of the
 *    browser's own error. Nothing is trained offline: answers are timed and
 *    marked on the server, so there is nothing useful to keep.
 * 3. Nothing is cached apart from that one page. Every other page carries
 *    somebody's own record, and a phone that kept copies of them would show
 *    yesterday's rounds, or one person's page to whoever signs in next.
 */

const OFFLINE = '/offline.html';
const CACHE = 'academy-offline-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(new Request(OFFLINE, { cache: 'reload' })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Pages only, and only when the network fails. Everything else goes straight
// to the network as if there were no service worker at all.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE).then((page) => page || Response.error())),
  );
});

/** A path inside the app, or the dashboard: a notification never opens another site. */
function insidePath(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? url : '/dashboard';
}

self.addEventListener('push', (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = {};
  }
  const title = typeof message.title === 'string' && message.title ? message.title : 'The academy';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof message.body === 'string' ? message.body : '',
      tag: typeof message.tag === 'string' ? message.tag : undefined,
      icon: '/app-icon/192',
      badge: '/app-icon/192',
      data: { url: insidePath(message.url) },
    }),
  );
});

// Tapping a notification brings the app forward on the page it is about,
// reusing a window already open rather than starting another.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(insidePath(event.notification.data && event.notification.data.url), self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          // A window this worker does not control yet cannot be navigated;
          // open a fresh one rather than doing nothing.
          return client
            .navigate(target)
            .then((c) => (c || client).focus())
            .catch(() => self.clients.openWindow(target));
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
