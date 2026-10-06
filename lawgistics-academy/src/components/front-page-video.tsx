'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The explainer at the top of the front page: 32 seconds, silent, looping.
 * Its source is `video/front-page/index.html`, rendered with HyperFrames.
 *
 * It plays by itself, muted, unless the visitor's device asks for reduced
 * motion, in which case it waits on its still until they press play. Anything
 * that moves for longer than five seconds needs a way to stop it, so there is
 * always a pause button; full screen is for reading it on a phone. The video
 * has no words of its own that a screen reader could reach, so the same
 * story is written out underneath for them.
 */
export function FrontPageVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) return;
    // Autoplay can be refused (low power mode, data saver); the still stays.
    el.play().catch(() => {});
  }, []);

  const toggle = () => {
    const el = video.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  const fullScreen = () => {
    const el = video.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    // iPhone Safari only lets the video itself go full screen.
    else el.webkitEnterFullscreen?.();
  };

  return (
    <figure className="relative">
      <video
        ref={video}
        className="block aspect-square w-full rounded-xl bg-navy"
        src="/video/front-page.mp4"
        poster="/video/front-page-poster.jpg"
        muted
        loop
        playsInline
        preload="metadata"
        aria-describedby="front-page-video-story"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className="absolute right-3 bottom-3 flex gap-2">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex min-h-11 items-center rounded-md bg-navy/85 px-3.5 text-sm font-medium text-cream ring-1 ring-cream/25 backdrop-blur hover:bg-navy"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={fullScreen}
          className="inline-flex min-h-11 items-center rounded-md bg-navy/85 px-3.5 text-sm font-medium text-cream ring-1 ring-cream/25 backdrop-blur hover:bg-navy"
        >
          Full screen
        </button>
      </div>
      <figcaption id="front-page-video-story" className="sr-only">
        A 32 second video with no sound. An example matter lands: a statutory demand for
        Harimau Fabrication Sdn Bhd, with 45 minutes on the clock. The four tasks are ticked off
        one by one: read the file, identify the procedure, draft the advice, record your
        explanation. A lawyer marks it Good. Then the trainee programme: every working morning
        from 7 to 11am, four rounds of ten questions, Kuala Lumpur time. Then the score, which
        starts at 100% and comes down only with a wrong answer. It ends: learn to practise law
        before you have to practise it.
      </figcaption>
    </figure>
  );
}
