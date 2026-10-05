/**
 * A cartoon of yourself, built from parts you pick.
 *
 * Nothing here looks at a photo. A person chooses every part, what is saved
 * is the list of choices (`profiles.avatar_style`, 0033), and the face is
 * drawn from that list each time it is shown. The drawings are the
 * Avataaars set by Pablo Stanley, free for personal and commercial use; the
 * code that draws them is DiceBear, MIT, in ./draw so that a page which only
 * shows a cartoon does not download it.
 *
 * Every choice comes from the lists below. Anything else, whether an old
 * choice that has since been taken off a list or something sent by hand, is
 * replaced by the default for that part when the face is drawn, so a stored
 * value can never reach the picture unless it is on a list.
 */

type Choice = { id: string; label: string };

const SKIN: Choice[] = [
  { id: 'ffdbb4', label: 'Light' },
  { id: 'edb98a', label: 'Light to medium' },
  { id: 'd08b5b', label: 'Medium' },
  { id: 'ae5d29', label: 'Medium to dark' },
  { id: '614335', label: 'Dark' },
];

const HAIR: Choice[] = [
  { id: 'none', label: 'No hair' },
  { id: 'shortFlat', label: 'Short and flat' },
  { id: 'shortRound', label: 'Short and round' },
  { id: 'shortWaved', label: 'Short and wavy' },
  { id: 'shortCurly', label: 'Short and curly' },
  { id: 'theCaesar', label: 'Caesar' },
  { id: 'theCaesarAndSidePart', label: 'Side part' },
  { id: 'sides', label: 'Bald on top' },
  { id: 'shavedSides', label: 'Shaved sides' },
  { id: 'frizzle', label: 'Frizzy' },
  { id: 'shaggy', label: 'Shaggy' },
  { id: 'shaggyMullet', label: 'Mullet' },
  { id: 'dreads01', label: 'Short locs' },
  { id: 'dreads02', label: 'Locs' },
  { id: 'dreads', label: 'Long locs' },
  { id: 'fro', label: 'Afro' },
  { id: 'froBand', label: 'Afro with band' },
  { id: 'bob', label: 'Bob' },
  { id: 'bun', label: 'Bun' },
  { id: 'curly', label: 'Curly' },
  { id: 'curvy', label: 'Long and wavy' },
  { id: 'bigHair', label: 'Big hair' },
  { id: 'frida', label: 'Braided crown' },
  { id: 'longButNotTooLong', label: 'Shoulder length' },
  { id: 'miaWallace', label: 'Blunt fringe' },
  { id: 'straight01', label: 'Long and straight' },
  { id: 'straight02', label: 'Long, parted' },
  { id: 'straightAndStrand', label: 'Long with a strand' },
  { id: 'hijab', label: 'Hijab' },
  { id: 'turban', label: 'Turban' },
  { id: 'hat', label: 'Hat' },
  { id: 'winterHat1', label: 'Winter hat' },
  { id: 'winterHat02', label: 'Beanie' },
  { id: 'winterHat03', label: 'Bobble hat' },
  { id: 'winterHat04', label: 'Hat with ears' },
];

const HAIR_COLOUR: Choice[] = [
  { id: '2c1b18', label: 'Black' },
  { id: '4a312c', label: 'Dark brown' },
  { id: '724133', label: 'Brown' },
  { id: 'a55728', label: 'Auburn' },
  { id: 'b58143', label: 'Light brown' },
  { id: 'd6b370', label: 'Blonde' },
  { id: 'c93305', label: 'Red' },
  { id: 'e8e1e1', label: 'Grey' },
  { id: 'ecdcbf', label: 'Platinum' },
  { id: 'f59797', label: 'Pink' },
];

const EYES: Choice[] = [
  { id: 'default', label: 'Open' },
  { id: 'happy', label: 'Happy' },
  { id: 'wink', label: 'Wink' },
  { id: 'squint', label: 'Squint' },
  { id: 'side', label: 'Side glance' },
  { id: 'surprised', label: 'Surprised' },
  { id: 'eyeRoll', label: 'Eye roll' },
  { id: 'hearts', label: 'Hearts' },
  { id: 'closed', label: 'Closed' },
  { id: 'winkWacky', label: 'Cheeky wink' },
];

const EYEBROWS: Choice[] = [
  { id: 'defaultNatural', label: 'Natural' },
  { id: 'flatNatural', label: 'Flat' },
  { id: 'raisedExcitedNatural', label: 'Raised' },
  { id: 'upDownNatural', label: 'One raised' },
  { id: 'sadConcernedNatural', label: 'Concerned' },
  { id: 'frownNatural', label: 'Frown' },
  { id: 'angryNatural', label: 'Cross' },
  { id: 'unibrowNatural', label: 'Joined' },
  { id: 'default', label: 'Thin' },
  { id: 'raisedExcited', label: 'Thin, raised' },
];

const MOUTH: Choice[] = [
  { id: 'smile', label: 'Smile' },
  { id: 'twinkle', label: 'Grin' },
  { id: 'default', label: 'Calm' },
  { id: 'serious', label: 'Serious' },
  { id: 'tongue', label: 'Tongue out' },
  { id: 'concerned', label: 'Worried' },
  { id: 'disbelief', label: 'Disbelief' },
  { id: 'grimace', label: 'Grimace' },
  { id: 'eating', label: 'Eating' },
];

const GLASSES: Choice[] = [
  { id: 'none', label: 'None' },
  { id: 'prescription01', label: 'Reading glasses' },
  { id: 'prescription02', label: 'Thick frames' },
  { id: 'round', label: 'Round' },
  { id: 'kurt', label: 'Tinted' },
  { id: 'wayfarers', label: 'Sunglasses' },
  { id: 'sunglasses', label: 'Shades' },
];

const FACIAL_HAIR: Choice[] = [
  { id: 'none', label: 'None' },
  { id: 'beardLight', label: 'Stubble' },
  { id: 'beardMedium', label: 'Beard' },
  { id: 'beardMajestic', label: 'Full beard' },
  { id: 'moustacheFancy', label: 'Curled moustache' },
  { id: 'moustacheMagnum', label: 'Moustache' },
];

const CLOTHES: Choice[] = [
  { id: 'blazerAndShirt', label: 'Blazer and shirt' },
  { id: 'blazerAndSweater', label: 'Blazer and jumper' },
  { id: 'collarAndSweater', label: 'Collar and jumper' },
  { id: 'shirtCrewNeck', label: 'T-shirt' },
  { id: 'shirtVNeck', label: 'V-neck' },
  { id: 'shirtScoopNeck', label: 'Scoop neck' },
  { id: 'hoodie', label: 'Hoodie' },
  { id: 'overall', label: 'Overalls' },
];

const COLOUR: Choice[] = [
  { id: '25557c', label: 'Navy' },
  { id: '262e33', label: 'Charcoal' },
  { id: '3c4f5c', label: 'Slate' },
  { id: '929598', label: 'Grey' },
  { id: 'e6e6e6', label: 'Light grey' },
  { id: 'ffffff', label: 'White' },
  { id: '5199e4', label: 'Blue' },
  { id: '65c9ff', label: 'Sky' },
  { id: 'a7ffc4', label: 'Mint' },
  { id: 'ffafb9', label: 'Pink' },
  { id: 'ff5c5c', label: 'Red' },
  { id: 'ffffb1', label: 'Lemon' },
];

const BACKGROUND: Choice[] = [
  { id: 'b1e2ff', label: 'Ice' },
  { id: 'a7ffc4', label: 'Mint' },
  { id: 'ffafb9', label: 'Pink' },
  { id: 'ffffb1', label: 'Lemon' },
  { id: 'e6e6e6', label: 'Grey' },
  { id: 'ffdeb5', label: 'Peach' },
];

/** The parts, in the order the maker shows them. */
export const CARTOON_PARTS = [
  { key: 'skin', label: 'Skin', kind: 'colour', choices: SKIN },
  { key: 'hair', label: 'Hair', kind: 'shape', choices: HAIR },
  { key: 'hairColour', label: 'Hair colour', kind: 'colour', choices: HAIR_COLOUR },
  { key: 'eyes', label: 'Eyes', kind: 'shape', choices: EYES },
  { key: 'eyebrows', label: 'Eyebrows', kind: 'shape', choices: EYEBROWS },
  { key: 'mouth', label: 'Mouth', kind: 'shape', choices: MOUTH },
  { key: 'glasses', label: 'Glasses', kind: 'shape', choices: GLASSES },
  { key: 'facialHair', label: 'Facial hair', kind: 'shape', choices: FACIAL_HAIR },
  { key: 'clothes', label: 'Clothes', kind: 'shape', choices: CLOTHES },
  { key: 'clothesColour', label: 'Clothes colour', kind: 'colour', choices: COLOUR },
  { key: 'background', label: 'Background', kind: 'colour', choices: BACKGROUND },
] as const;

export type CartoonPart = (typeof CARTOON_PARTS)[number]['key'];
export type CartoonStyle = Record<CartoonPart, string>;

export const DEFAULT_CARTOON: CartoonStyle = {
  skin: 'edb98a',
  hair: 'shortWaved',
  hairColour: '4a312c',
  eyes: 'happy',
  eyebrows: 'defaultNatural',
  mouth: 'smile',
  glasses: 'none',
  facialHair: 'none',
  clothes: 'blazerAndShirt',
  clothesColour: '25557c',
  background: 'b1e2ff',
};

const isOn = (part: CartoonPart, id: unknown): id is string =>
  typeof id === 'string' &&
  CARTOON_PARTS.find((p) => p.key === part)!.choices.some((c) => c.id === id);

/**
 * A stored cartoon, with anything not on a list put back to its default.
 * Null when nothing is stored, or it is not an object at all.
 */
export function readCartoon(raw: unknown): CartoonStyle | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const given = raw as Record<string, unknown>;
  const style = { ...DEFAULT_CARTOON };
  for (const { key } of CARTOON_PARTS) {
    if (isOn(key, given[key])) style[key] = given[key];
  }
  return style;
}

/**
 * A cartoon as somebody has asked to save it: every part present and on
 * its list, and nothing else. Null when anything is off, so the action
 * refuses it rather than saving something other than what was asked for.
 */
export function strictCartoon(raw: unknown): CartoonStyle | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const given = raw as Record<string, unknown>;
  const keys = Object.keys(given);
  if (keys.length !== CARTOON_PARTS.length) return null;
  const style = {} as CartoonStyle;
  for (const { key } of CARTOON_PARTS) {
    if (!isOn(key, given[key])) return null;
    style[key] = given[key];
  }
  return style;
}

/** A random face, for "Surprise me". */
export function randomCartoon(random: () => number = Math.random): CartoonStyle {
  const style = {} as CartoonStyle;
  for (const { key, choices } of CARTOON_PARTS) {
    style[key] = choices[Math.floor(random() * choices.length)].id;
  }
  return style;
}

/**
 * A cartoon as a short code: its choices in part order, joined by hyphens.
 * Every choice is letters and digits, so the code needs no escaping.
 */
export function cartoonCode(style: CartoonStyle): string {
  return CARTOON_PARTS.map(({ key }) => style[key]).join('-');
}

/** The cartoon a code names, or null unless every part is on its list. */
export function cartoonFromCode(code: string): CartoonStyle | null {
  const values = code.split('-');
  if (values.length !== CARTOON_PARTS.length) return null;
  return strictCartoon(Object.fromEntries(CARTOON_PARTS.map(({ key }, i) => [key, values[i]])));
}

/**
 * Where the face is drawn, for an <img> on a page with many of them. The
 * drawing is the same for the same choices forever, so the browser keeps it,
 * and a page of five hundred trainees carries five hundred short addresses
 * rather than five hundred pictures written out in full.
 */
export function cartoonPath(style: CartoonStyle): string {
  return `/cartoon/${cartoonCode(readCartoon(style) ?? DEFAULT_CARTOON)}.svg`;
}
