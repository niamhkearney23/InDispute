"use client";

import { useEffect, useRef, useState } from "react";
import { SLIDES } from "./slides";

/* ---------------------------------------------------------------------------
   Colour derivation, the same arithmetic the studio uses, so a palette chosen
   here produces exactly the tokens the product would produce from the same
   three colours. Nothing is hand-tuned.
--------------------------------------------------------------------------- */

function hexToRgb(h: string) {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const to = (x: number) => Math.round(x).toString(16).padStart(2, "0");
  return `#${to(r1 + (r2 - r1) * (1 - t))}${to(g1 + (g2 - g1) * (1 - t))}${to(b1 + (b2 - b1) * (1 - t))}`;
}

export type Palette = { name: string; cream: string; navy: string; accent: string };

export const PALETTES: Palette[] = [
  { name: "Plum", cream: "#F2EFE9", navy: "#241320", accent: "#6B2450" },
  { name: "Ink", cream: "#EFEEEA", navy: "#16181A", accent: "#2E3338" },
  { name: "Forest", cream: "#EAEFEA", navy: "#0F1C15", accent: "#2F6B43" },
  { name: "Oxblood", cream: "#F4EEEA", navy: "#241414", accent: "#8A2E25" },
  { name: "Steel", cream: "#EDE7DC", navy: "#171D2B", accent: "#3A5697" },
  { name: "Sand", cream: "#F5EFE2", navy: "#2B2416", accent: "#A6782C" },
];

export function tokensFor(p: Palette): Record<string, string> {
  const { cream, navy, accent } = p;
  return {
    "--t-cream": cream,
    "--t-navy": navy,
    "--t-ink-cream": navy,
    "--t-ink-navy": cream,
    "--t-kicker-cream": mix(navy, cream, 0.55),
    "--t-kicker-navy": mix(cream, navy, 0.55),
    "--t-body-cream": mix(navy, cream, 0.88),
    "--t-body-navy": mix(cream, navy, 0.82),
    "--t-sub-cream": mix(navy, cream, 0.7),
    "--t-sub-navy": mix(cream, navy, 0.78),
    "--t-muted-cream": mix(navy, cream, 0.4),
    "--t-muted-navy": mix(cream, navy, 0.4),
    "--t-accent": accent,
    "--t-accent-navy": mix(accent, "#ffffff", 0.68),
    "--t-ink-accent": cream,
    "--t-kicker-accent": mix(cream, accent, 0.72),
    "--t-body-accent": mix(cream, accent, 0.9),
    "--t-muted-accent": mix(cream, accent, 0.62),
  };
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/* ---------------------------------------------------------------------------
   The deck. A carousel is a sequence, and a page of still thumbnails never
   shows that. This plays it.
--------------------------------------------------------------------------- */

export function Deck() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (paused || reduced) return;
    const t = setTimeout(() => setI((n) => (n + 1) % SLIDES.length), 3400);
    return () => clearTimeout(t);
  }, [i, paused, reduced]);

  return (
    <div
      className="deck"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="deckframe">
        {SLIDES.map((s, n) => (
          <div key={s.key} className={"deckslide" + (n === i ? " on" : "")} aria-hidden={n !== i}>
            {s.node}
          </div>
        ))}
      </div>
      <div className="deckbar">
        <p className="decklabel">{SLIDES[i].label}</p>
        <div className="deckdots" role="tablist" aria-label="Slides">
          {SLIDES.map((s, n) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={n === i}
              aria-label={`Slide ${n + 1}: ${s.label}`}
              className={n === i ? "on" : ""}
              onClick={() => setI(n)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   The brand switcher. The whole pitch is "one firm brand, applied everywhere".
   A sentence claims that. This proves it, on the page, in one tap: the tokens
   land on the .firms element and every slide above and below re-skins at once.
--------------------------------------------------------------------------- */

export function BrandControl() {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement | null>(null);

  function apply(n: number) {
    setActive(n);
    const host = root.current?.closest(".firms") as HTMLElement | null;
    if (!host) return;
    const t = tokensFor(PALETTES[n]);
    for (const [k, v] of Object.entries(t)) host.style.setProperty(k, v);
  }

  return (
    <div className="brandbarf" ref={root}>
      <p className="brandbarf-label">See it in another firm&rsquo;s brand</p>
      <div className="swatches">
        {PALETTES.map((p, n) => (
          <button
            key={p.name}
            type="button"
            className={"swatch" + (n === active ? " on" : "")}
            onClick={() => apply(n)}
            aria-pressed={n === active}
          >
            <span className="chips" aria-hidden="true">
              <i style={{ background: p.cream }} />
              <i style={{ background: p.accent }} />
              <i style={{ background: p.navy }} />
            </span>
            {p.name}
          </button>
        ))}
      </div>
      <p className="brandbarf-note">
        Every slide on this page just changed. That is the same switch a firm sets once.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Reveal on scroll. Content is visible by default and this only ever adds
   motion, so a page with no JS, or a reader who asked for less movement, still
   sees everything.
--------------------------------------------------------------------------- */

export function RevealScript() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window) || !targets.length) return;
    targets.forEach((el) => el.classList.add("willreveal"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
