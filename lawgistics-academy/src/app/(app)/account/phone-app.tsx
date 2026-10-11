'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button, Notice } from '@/components/ui';
import { forgetDevice, saveDevice } from './actions';

/**
 * Putting the academy on a phone's home screen, and turning notifications on
 * or off for that phone.
 *
 * What a phone can do depends on the phone, so this asks the browser rather
 * than guessing. An iPhone only allows notifications for an app opened from
 * the home screen (iOS 16.4 and later), so on an iPhone in Safari it says to
 * add it first. Android offers its own install button, which is shown here
 * when the browser hands it over.
 */

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

type Phone = {
  iphone: boolean;
  installed: boolean;
  pushSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
};

/** The server's key, as the browser wants it: bytes, not base64url text. */
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = base64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64url.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * The phone's push service (Apple's or Google's) answers subscribing in a
 * second or two. On a network that blocks it, it never answers at all, and
 * the button would say "Turning on…" for ever, so it gives up after this.
 */
const SUBSCRIBE_TIMEOUT_MS = 30_000;

class NoAnswer extends Error {}

function withinTime<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new NoAnswer()), ms)),
  ]);
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.getRegistration('/');
  return registration ? registration.pushManager.getSubscription() : null;
}

export function PhoneApp({ publicKey }: { publicKey: string | null }) {
  const [phone, setPhone] = useState<Phone | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [message, setMessage] = useState<{ tone: 'neutral' | 'warn'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const ua = navigator.userAgent;
    // iPadOS reports itself as a Mac; a Mac with a touch screen is an iPad.
    const iphone = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const installed =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

    currentSubscription()
      .catch(() => null)
      .then((subscription) =>
        setPhone({
          iphone,
          installed,
          pushSupported,
          permission: 'Notification' in window ? Notification.permission : 'unsupported',
          subscribed: subscription !== null,
        }),
      );

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function turnOn() {
    if (!publicKey) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setPhone((p) => (p ? { ...p, permission } : p));
          setMessage({
            tone: 'warn',
            text: 'Notifications were not allowed. You can allow them later in your phone’s settings for this app.',
          });
          return;
        }
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;
        const subscription =
          (await registration.pushManager.getSubscription()) ??
          (await withinTime(
            registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: keyBytes(publicKey),
            }),
            SUBSCRIBE_TIMEOUT_MS,
          ));
        const result = await saveDevice(JSON.stringify(subscription.toJSON()));
        if (result.error) {
          // Not saved means the server cannot reach it, so do not leave the
          // phone believing it will hear anything.
          await subscription.unsubscribe().catch(() => undefined);
          setMessage({ tone: 'warn', text: result.error });
          return;
        }
        setPhone((p) => (p ? { ...p, permission, subscribed: true } : p));
        setMessage({ tone: 'neutral', text: result.ok ?? 'Notifications are on for this phone.' });
      } catch (error) {
        setMessage({
          tone: 'warn',
          text:
            error instanceof NoAnswer
              ? 'This phone’s notification service did not answer. A work or school Wi-Fi sometimes blocks it: try again on mobile data.'
              : 'Notifications could not be turned on. Please try again.',
        });
      }
    });
  }

  function turnOff() {
    setMessage(null);
    startTransition(async () => {
      try {
        const subscription = await currentSubscription();
        if (subscription) {
          const result = await forgetDevice(subscription.endpoint);
          await subscription.unsubscribe().catch(() => undefined);
          if (result.error) {
            setMessage({ tone: 'warn', text: result.error });
            return;
          }
        }
        setPhone((p) => (p ? { ...p, subscribed: false } : p));
        setMessage({ tone: 'neutral', text: 'Notifications are off for this phone.' });
      } catch {
        setMessage({ tone: 'warn', text: 'That could not be turned off. Please try again.' });
      }
    });
  }

  function install() {
    if (!installPrompt) return;
    installPrompt.prompt().then(() => setInstallPrompt(null)).catch(() => setInstallPrompt(null));
  }

  // Nothing is known about the phone until the page is in the browser.
  if (!phone) return <p className="text-sm text-slate">Checking this phone…</p>;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-sm font-semibold">On your home screen</p>
        {phone.installed ? (
          <p className="text-sm text-slate">The academy is on this phone’s home screen. Open it from there.</p>
        ) : phone.iphone ? (
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate">
            <li>Open this page in Safari.</li>
            <li>Tap the Share button: the square with an arrow pointing up.</li>
            <li>Scroll down and tap Add to Home Screen, then Add.</li>
            <li>Open the academy from your home screen, and come back to this page to turn on notifications.</li>
          </ol>
        ) : installPrompt ? (
          <Button type="button" variant="outline" size="sm" onClick={install}>
            Put it on your home screen
          </Button>
        ) : (
          <p className="text-sm text-slate">
            In Chrome, open the menu (the three dots) and choose Install app or Add to Home screen.
          </p>
        )}
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold">Notifications</p>
        <p className="mb-3 text-sm text-slate">
          A reminder a few minutes before each of your rounds, if you are on rounds, and a notice when a coach
          marks your work or puts up something new.
        </p>
        {!publicKey ? (
          <p className="text-sm text-slate">Notifications are not switched on for this academy yet.</p>
        ) : phone.iphone && !phone.installed ? (
          <p className="text-sm text-slate">
            On an iPhone, notifications work once the academy is on your home screen. Add it first, using the
            steps above.
          </p>
        ) : !phone.pushSupported ? (
          <p className="text-sm text-slate">This browser cannot show notifications.</p>
        ) : phone.permission === 'denied' ? (
          <p className="text-sm text-slate">
            Notifications are blocked for the academy in this phone’s settings. Allow them there, then come back.
          </p>
        ) : phone.subscribed ? (
          <Button type="button" variant="outline" size="sm" onClick={turnOff} disabled={pending}>
            {pending ? 'Turning off…' : 'Turn notifications off on this phone'}
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={turnOn} disabled={pending}>
            {pending ? 'Turning on…' : 'Turn notifications on for this phone'}
          </Button>
        )}
      </div>

      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
    </div>
  );
}
