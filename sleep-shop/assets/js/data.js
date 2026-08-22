/* Sleep Shop — catalogue data.
   One product: the Signature Sleep Box. The eight pieces inside it are content,
   not separate SKUs — the whole proposition is that you don't assemble the gift.
   Pure data, no DOM. Loaded before every other script. */
(function (global) {
  'use strict';

  var CONFIG = {
    brand: 'Sleep Shop',
    place: 'Melbourne',
    currency: 'AUD',
    locale: 'en-AU',
    /* Standard delivery is free on every box; express is the only paid option. */
    expressFee: 12,
    giftMessageLimit: 220,
    promoCodes: { FIRSTRUN: 0.1 },
    email: 'hello@sleepshop.example',
    phone: '(03) 9000 0000',
    address: 'By appointment, Fitzroy VIC 3065'
  };

  /* The five grounds from the brand plan. Every illustration sits on one of
     them — consistent grounds are what hold the look together. */
  var GROUNDS = {
    cocoa: { bg: '#3B2318', ink: '#F2E9DC', soft: '#7A5641' },
    rose: { bg: '#7A4A52', ink: '#F6E9E6', soft: '#A8848A' },
    powder: { bg: '#AFC9DF', ink: '#2E4257', soft: '#6F8FAC' },
    cream: { bg: '#F2E9DC', ink: '#3B2318', soft: '#C4AE97' },
    stripe: { bg: '#F2E9DC', ink: '#3B2318', soft: '#C4AE97', striped: true }
  };

  var BOX = {
    id: 'signature-sleep-box',
    name: 'The Signature Sleep Box',
    price: 149,
    art: 'box-closed',
    ground: 'powder',
    line: 'Eight pieces, one ritual',
    blurb: 'Eight pieces, chosen so you do not have to assemble a gift yourself.',
    description: [
      'One box, packed by hand in Melbourne. Silk for the eye mask and pillowcase, a scrunchie cut from the same run, socks knitted from merino, and four smaller things that make the last half hour of a day feel deliberate.',
      'It arrives tied, with your message written on the card by hand before the lid goes on. Nothing inside is branded with our name — it is a gift, not an advertisement.'
    ],
    /* Ribbon is the only choice to make, and it costs nothing either way. */
    ribbons: [
      { label: 'Clay rose', swatch: '#7A4A52' },
      { label: 'Powder blue', swatch: '#AFC9DF' }
    ],
    /* Set `photo` on any of these and the drawing is replaced site-wide.
       Paths are relative to the site root, e.g. 'photos/box-closed.jpg'. */
    photo: '',
    shots: [
      { art: 'box-closed', ground: 'powder', photo: '', label: 'The box, tied' },
      { art: 'box-open', ground: 'cream', photo: '', label: 'The box, open' },
      { art: 'card', ground: 'cocoa', photo: '', label: 'The card, written by hand' }
    ],
    specs: {
      Contains: 'Eight pieces',
      Box: '320 × 240 × 90 mm, rigid, reusable',
      Card: 'Letterpress, handwritten to your message',
      Packed: 'By hand in Melbourne',
      Delivery: 'Free Australia-wide'
    }
  };

  /* The eight pieces, in the order they sit in the box. */
  var CONTENTS = [
    {
      id: 'eye-mask',
      name: 'Silk eye mask',
      material: '22-momme mulberry silk',
      art: 'mask',
      ground: 'cocoa',
      photo: '',
      blurb: 'Weighted along the nose so it sits without pressing, on a soft elastic that does not catch in hair.',
      detail: 'Cut from the same 22-momme silk as the pillowcase and finished with a covered elastic. The seam is on the outside, so nothing rests against your eyelid.'
    },
    {
      id: 'pillowcase',
      name: 'Silk pillowcase',
      material: '22-momme mulberry silk, standard',
      art: 'pillowcase',
      ground: 'powder',
      photo: '',
      blurb: 'Grade 6A silk with a hidden zip, heavy enough to drape properly and hold its colour.',
      detail: 'Standard 48 × 74 cm with a hidden zip closure. Silk holds far less moisture than cotton, which is why anything you put on your face at night stays on your face.'
    },
    {
      id: 'scrunchie',
      name: 'Matching scrunchie',
      material: 'Offcut silk, same run',
      art: 'scrunchie',
      ground: 'cream',
      photo: '',
      blurb: 'Cut from the offcuts of the pillowcase run, so the colour is an exact match.',
      detail: 'Made from what would otherwise be waste. Gentle enough to sleep in, and the reason the box looks considered rather than assembled.'
    },
    {
      id: 'bed-socks',
      name: 'Merino bed socks',
      material: '19.5-micron Australian merino',
      art: 'socks',
      ground: 'rose',
      photo: '',
      blurb: 'Fine-knit merino with a loose cuff that does not leave a mark on the ankle.',
      detail: 'Knitted in Melbourne from 19.5-micron merino. Warm without the bulk of a boot sock, and the cuff is ribbed loosely on purpose.'
    },
    {
      id: 'pillow-mist',
      name: 'Pillow mist',
      material: 'Tasmanian lavender, 100 ml',
      art: 'bottle',
      ground: 'cocoa',
      photo: '',
      blurb: 'Steam-distilled Tasmanian lavender with vetiver and cedarwood. Alcohol-free, so it will not mark linen.',
      detail: 'Two sprays on the pillow before the light goes off. Alcohol-free and unbleached, in a recycled glass bottle with a fine atomiser.'
    },
    {
      id: 'tea',
      name: 'Evening tea',
      material: 'Chamomile, lemon balm, rose — 30 g',
      art: 'tea',
      ground: 'stripe',
      photo: '',
      blurb: 'A loose leaf blend of chamomile, lemon balm and rose petal. Caffeine free.',
      detail: 'Blended for us in Collingwood. Thirty grams is roughly fifteen cups, in a tin that fits the box and outlives it.'
    },
    {
      id: 'candle',
      name: 'Beeswax candle',
      material: 'Pure beeswax, 40 hours',
      art: 'candle',
      ground: 'powder',
      photo: '',
      blurb: 'Poured beeswax with a cotton wick. Unscented, so it does not argue with the mist.',
      detail: 'Forty hours of burn time. Unscented deliberately — there is already lavender in the box, and two scents in one room is one too many.'
    },
    {
      id: 'journal',
      name: 'Bedside journal',
      material: 'Letterpress cover, 96 pages',
      art: 'journal',
      ground: 'cream',
      photo: '',
      blurb: 'Ninety-six unlined pages, sewn flat so it stays open on a bedside table.',
      detail: 'Section-sewn so it lies flat, with a letterpress cover on cotton board. Unlined, because a ruled page asks you to be tidy at midnight.'
    }
  ];

  var OCCASIONS = [
    {
      title: 'A birthday you remembered late',
      body: 'Order by 2pm on a weekday and it leaves Melbourne the same afternoon. The card is written by hand, so it does not read as an emergency.'
    },
    {
      title: 'A thank you that is not wine',
      body: 'For the person who fed your cat, covered your shift, or drove you to the airport at 5am.'
    },
    {
      title: 'Someone having a hard month',
      body: 'When you want to send something and everything you can think of feels either too much or too little.'
    }
  ];

  var STEPS = [
    { title: 'Choose the box and a ribbon', body: 'Clay rose or powder blue. There is one box, so this is the only decision.' },
    { title: 'Write your message', body: 'Up to 220 characters at checkout. We write it on the card by hand.' },
    { title: 'We pack it and tie it', body: 'By hand in Melbourne, usually the same working day.' },
    { title: 'It arrives ready to give', body: 'No invoice in the box, no pricing on the outside. Send it straight to them.' }
  ];

  global.SLEEP_CONFIG = CONFIG;
  global.SLEEP_GROUNDS = GROUNDS;
  global.SLEEP_BOX = BOX;
  global.SLEEP_CONTENTS = CONTENTS;
  global.SLEEP_OCCASIONS = OCCASIONS;
  global.SLEEP_STEPS = STEPS;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      CONFIG: CONFIG,
      GROUNDS: GROUNDS,
      BOX: BOX,
      CONTENTS: CONTENTS,
      OCCASIONS: OCCASIONS,
      STEPS: STEPS
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
