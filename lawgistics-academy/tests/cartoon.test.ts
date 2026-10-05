import { test } from 'node:test';
import assert from 'node:assert/strict';
import { schema } from '@dicebear/avataaars';
import {
  CARTOON_PARTS,
  DEFAULT_CARTOON,
  cartoonDataUri,
  randomCartoon,
  readCartoon,
  strictCartoon,
} from '../src/lib/avatar/cartoon';

// Where each part of ours is drawn from in the drawing library.
// Colours are any six-digit hex there, so only the shapes have a list.
const LIBRARY: Record<string, string> = {
  hair: 'top',
  eyes: 'eyes',
  eyebrows: 'eyebrows',
  mouth: 'mouth',
  glasses: 'accessories',
  facialHair: 'facialHair',
  clothes: 'clothing',
};

test('every choice is one the drawing library can draw', () => {
  const props = schema.properties as Record<string, { items?: { enum?: string[] } }>;
  for (const part of CARTOON_PARTS) {
    if (part.kind === 'colour') {
      for (const c of part.choices) assert.match(c.id, /^[0-9a-f]{6}$/, `${part.key}: ${c.id}`);
      continue;
    }
    const name = LIBRARY[part.key];
    const known = props[name]?.items?.enum ?? [];
    for (const c of part.choices) {
      if (c.id === 'none') continue;
      assert.ok(known.includes(c.id), `${part.key}: ${c.id} is not in the library's ${name}`);
    }
  }
});

test('every choice passes the database rule for a stored cartoon', () => {
  // profiles_avatar_style_shape in 0033.
  for (const part of CARTOON_PARTS) {
    assert.match(part.key, /^[A-Za-z0-9]{1,40}$/);
    for (const c of part.choices) assert.match(c.id, /^[A-Za-z0-9]{1,40}$/, `${part.key}: ${c.id}`);
  }
  assert.ok(JSON.stringify(DEFAULT_CARTOON).length < 1024);
});

test('the default and every random face are saveable as they stand', () => {
  assert.deepEqual(strictCartoon(DEFAULT_CARTOON), DEFAULT_CARTOON);
  let seed = 1;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 50; i++) {
    const face = randomCartoon(random);
    assert.deepEqual(strictCartoon(face), face);
  }
});

test('saving refuses anything other than a full set of listed choices', () => {
  assert.equal(strictCartoon(null), null);
  assert.equal(strictCartoon('bob'), null);
  assert.equal(strictCartoon([DEFAULT_CARTOON]), null);
  assert.equal(strictCartoon({ ...DEFAULT_CARTOON, hair: '<svg onload=alert(1)>' }), null);
  assert.equal(strictCartoon({ ...DEFAULT_CARTOON, hair: 'notAStyle' }), null);
  assert.equal(strictCartoon({ ...DEFAULT_CARTOON, extra: 'bob' }), null);
  const missing: Record<string, string> = { ...DEFAULT_CARTOON };
  delete missing.mouth;
  assert.equal(strictCartoon(missing), null);
});

test('drawing puts anything off a list back to its default', () => {
  assert.equal(readCartoon(null), null);
  assert.equal(readCartoon('x'), null);
  const read = readCartoon({ hair: 'bob', eyes: 'javascript:alert(1)', skin: 5 });
  assert.deepEqual(read, { ...DEFAULT_CARTOON, hair: 'bob' });
});

test('a face is drawn as an SVG image', () => {
  const uri = cartoonDataUri({ ...DEFAULT_CARTOON, hair: 'hijab', glasses: 'round' });
  assert.match(uri, /^data:image\/svg\+xml;utf8,%3Csvg/);
  assert.notEqual(uri, cartoonDataUri(DEFAULT_CARTOON));
  // No hair, no glasses, no facial hair: drawn, not an error.
  assert.match(cartoonDataUri({ ...DEFAULT_CARTOON, hair: 'none' }), /^data:image\/svg/);
});
