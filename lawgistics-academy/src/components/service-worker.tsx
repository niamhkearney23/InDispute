'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker (public/sw.js) once the page has loaded, so a
 * phone can install the academy and receive notifications.
 *
 * Production only. In development a service worker outlives the code it was
 * registered by and makes a stale page look like a bug in whatever was just
 * changed.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // No service worker means no install and no notifications, and the
      // academy works exactly as it does in a browser tab. Nothing to report.
    });
  }, []);
  return null;
}
