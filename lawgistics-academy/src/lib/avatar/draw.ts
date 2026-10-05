import { createAvatar } from '@dicebear/core';
import * as avataaars from '@dicebear/avataaars';
import { DEFAULT_CARTOON, readCartoon, type CartoonStyle } from './cartoon';

/**
 * Drawing a cartoon. Kept apart from the lists in ./cartoon, which every
 * page that shows a face needs, so the drawing library goes only where a
 * face is actually drawn: the maker in the browser, and /cartoon on the
 * server.
 */

/** The face as an SVG data URI, for the maker's live previews. */
export function cartoonDataUri(style: CartoonStyle): string {
  return drawCartoon(style).toDataUri();
}

/** The face as SVG text, for the route that serves cartoonPath. */
export function cartoonSvg(style: CartoonStyle): string {
  return drawCartoon(style).toString();
}

function drawCartoon(style: CartoonStyle) {
  const s = readCartoon(style) ?? DEFAULT_CARTOON;
  const hair = s.hair === 'none' ? [] : [s.hair];
  return createAvatar(avataaars, {
    seed: 'cartoon',
    backgroundColor: [s.background],
    skinColor: [s.skin],
    top: hair.length ? hair : ['shortFlat'],
    topProbability: hair.length ? 100 : 0,
    hairColor: [s.hairColour],
    // A head covering takes the clothes colour, so it can be chosen.
    hatColor: [s.clothesColour],
    eyes: [s.eyes],
    eyebrows: [s.eyebrows],
    mouth: [s.mouth],
    accessories: s.glasses === 'none' ? ['round'] : [s.glasses],
    accessoriesProbability: s.glasses === 'none' ? 0 : 100,
    accessoriesColor: ['262e33'],
    facialHair: s.facialHair === 'none' ? ['beardLight'] : [s.facialHair],
    facialHairProbability: s.facialHair === 'none' ? 0 : 100,
    facialHairColor: [s.hairColour],
    clothing: [s.clothes],
    clothesColor: [s.clothesColour],
  } as Parameters<typeof createAvatar<typeof avataaars>>[1]);
}
