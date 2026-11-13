import type { Brand, Profile } from "./auth";

// Everything a browser sends is shaped here before it touches the database.
// The studio renders whatever is stored as markup, so a field that is allowed to
// hold anything is a field that can hold an attack. These lists are closed:
// anything not named is dropped, and every string has a ceiling.

const HEX = /^#[0-9a-fA-F]{6}$/;
const SERIFS = ["default", "Lora", "Cormorant Garamond", "Fraunces"];
const SANS = ["default", "Inter", "Manrope", "Work Sans"];
const STYLES = ["editorial", "bold", "minimal", "block", "swiss", "mono", "press", "stack"];

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\u0000/g, "").slice(0, max) : "");

export function cleanBrand(input: unknown): Brand {
  const b = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out: Brand = {};
  for (const k of ["cream", "navy", "accent"] as const) {
    if (typeof b[k] === "string" && HEX.test(b[k] as string)) out[k] = (b[k] as string).toLowerCase();
  }
  out.serif = SERIFS.includes(b.serif as string) ? (b.serif as string) : "default";
  out.sans = SANS.includes(b.sans as string) ? (b.sans as string) : "default";
  out.style = STYLES.includes(b.style as string) ? (b.style as string) : "editorial";
  out.disclaimer = str(b.disclaimer, 90).trim();
  return out;
}

export function cleanProfile(input: unknown): Profile {
  const p = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  return {
    role: str(p.role, 34).trim(),
    field: str(p.field, 80).trim(),
    audience: str(p.audience, 80).trim(),
    voice: str(p.voice, 4000),
  };
}

export function cleanName(v: unknown): string {
  return str(v, 60).replace(/\s+/g, " ").trim();
}

const SLIDE_STRINGS: Record<string, number> = {
  layout: 20,
  motif: 20,
  ground: 10,
  size: 4,
  anchor: 8,
  align: 8,
  tag: 3,
  kicker: 200,
  cite: 400,
  statement: 600,
  sub: 600,
  body: 3000,
  learn: 600,
  photoKind: 10,
  photoMode: 10,
};
const SLIDE_FLAGS = ["dark", "swipe", "citeIsReal", "ownKicker"];
const MAX_PHOTO = 1_800_000;

export function cleanSlides(input: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > 12) return null;
  const out: Record<string, unknown>[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return null;
    const s = raw as Record<string, unknown>;
    const slide: Record<string, unknown> = {};
    for (const [k, max] of Object.entries(SLIDE_STRINGS)) slide[k] = str(s[k], max);
    for (const k of SLIDE_FLAGS) slide[k] = !!s[k];
    // a stored photo is shown in an <img>, so it must be an inline image and nothing else
    if (typeof s.photo === "string" && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s.photo)) {
      if (s.photo.length > MAX_PHOTO) return null;
      slide.photo = s.photo;
    }
    out.push(slide);
  }
  return out;
}
