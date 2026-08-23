/* Sleep Shop — catalogue data.
   Three pathways: the Gift of Sleep Box, the four pieces sold on their own,
   and the rituals section that connects the two. Pure data, no DOM. Loaded
   before every other script.

   Prices on the individual pieces are placeholders to be confirmed before
   launch. The box price is the one from the brief. */
(function (global) {
  'use strict';

  var CONFIG = {
    brand: 'Sleep Shop',
    tagline: 'Give the gift of sleep.',
    place: 'Melbourne',
    currency: 'AUD',
    locale: 'en-AU',
    /* Standard delivery is free on everything; express is the only paid option. */
    expressFee: 12,
    giftMessageLimit: 220,
    promoCodes: { FIRSTRUN: 0.1 },
    email: 'hello@sleepshop.example',
    phone: '(03) 9000 0000',
    address: 'By appointment, Fitzroy VIC 3065'
  };

  /* The five grounds, locked as palette B. Cream and linen dominate the site
     itself; cocoa anchors it; clay rose belongs to gifting and powder blue to
     the rituals. Not every colour everywhere. */
  var GROUNDS = {
    cocoa: { bg: '#3B2318', ink: '#F2E9DC', soft: '#7A5641' },
    rose: { bg: '#7A4A52', ink: '#F6E9E6', soft: '#A8848A' },
    powder: { bg: '#AFC9DF', ink: '#2E4257', soft: '#6F8FAC' },
    cream: { bg: '#F2E9DC', ink: '#3B2318', soft: '#C4AE97' },
    stripe: { bg: '#F2E9DC', ink: '#3B2318', soft: '#C4AE97', striped: true }
  };

  /* The four pieces. Each one is in the box and on the shelf, which is the
     point: the box is not a bundle of seconds, it is the shop's best things
     put together. */
  var PRODUCTS = [
    {
      id: 'silk-sleep-mask',
      name: 'Silk sleep mask',
      price: 49,
      material: '22-momme mulberry silk',
      art: 'mask',
      ground: 'cocoa',
      photo: '',
      blurb: 'Weighted along the nose so it sits without pressing, on a covered elastic that does not catch in hair.',
      detail: 'Cut from 22-momme, grade 6A mulberry silk, the same run as the pillowcase. The seam is on the outside, so nothing rests against your eyelid.'
    },
    {
      id: 'silk-pillowcase',
      name: 'Silk pillowcase',
      price: 89,
      material: '22-momme mulberry silk, standard',
      art: 'pillowcase',
      ground: 'powder',
      photo: '',
      blurb: 'Grade 6A silk with a hidden zip, heavy enough to drape properly and hold its colour.',
      detail: 'Standard 48 × 74 cm with a hidden zip closure. Silk holds far less moisture than cotton, which is why anything you put on your face at night stays on your face.'
    },
    {
      id: 'am-pm-journal',
      name: 'AM / PM journal',
      price: 39,
      material: 'Letterpress cover, 96 pages',
      art: 'journal',
      ground: 'cream',
      photo: '',
      blurb: 'A page for the end of the day and a page for the start of the next one, sewn flat so it stays open on a bedside table.',
      detail: 'Ninety-six pages, section-sewn so it lies flat. The PM page is for whatever is still in your head; the AM page is three lines before the phone comes on. Unlined, because a ruled page asks you to be tidy at midnight.'
    },
    {
      id: 'lavender-sleep-wrap',
      name: 'Lavender sleep wrap',
      price: 59,
      material: 'Washed linen, Australian lavender',
      art: 'wrap',
      ground: 'rose',
      photo: '',
      blurb: 'A linen wrap filled with lavender flowers and wheat, with a good weight to it. Warm it, or do not.',
      detail: 'Washed linen outside, Australian lavender and wheat inside. It drapes across the shoulders or over the eyes, warmed for a minute or straight off the shelf. The cover unbuttons and washes.'
    }
  ];

  /* The hero product. The contents point back at the pieces above so there is
     one description of each thing on the whole site. */
  var BOX = {
    id: 'gift-of-sleep-box',
    name: 'The Gift of Sleep Box',
    price: 149,
    art: 'box-closed',
    ground: 'powder',
    line: 'Send them sleep',
    blurb: 'The four pieces, a ritual card, and your message on a card written by hand.',
    description: [
      'For the person who needs absolutely nothing except a good night\'s sleep. Four pieces chosen to sit together: a silk mask and pillowcase cut from the same run, a journal for either end of the day, and a lavender wrap with a good weight to it.',
      'A ritual card sits on top of the tissue, and your message goes on a letterpress card, written by hand. It arrives tied, with no invoice inside and no pricing on the outside. Send it straight to them.'
    ],
    contents: ['silk-sleep-mask', 'silk-pillowcase', 'am-pm-journal', 'lavender-sleep-wrap'],
    /* In the box but not on the shelf. */
    always: [
      { name: 'The ritual card', note: 'A short evening ritual, letterpressed. The same one is in every box, and it is the first thing under the lid.' },
      { name: 'Your message', note: 'Up to 220 characters, written by hand on a card that sits on top of the tissue.' }
    ],
    /* Ribbon is the only choice to make, and it costs nothing either way. */
    ribbons: [
      { label: 'Clay rose', swatch: '#7A4A52' },
      { label: 'Powder blue', swatch: '#AFC9DF' }
    ],
    /* Set `photo` on any of these and the drawing is replaced site-wide. */
    photo: '',
    shots: [
      { art: 'box-closed', ground: 'powder', photo: '', label: 'The box, tied' },
      { art: 'box-open', ground: 'cream', photo: '', label: 'The box, open' },
      { art: 'card', ground: 'cocoa', photo: '', label: 'The card, written by hand' }
    ],
    specs: {
      Contains: 'Four pieces and the ritual card',
      Box: '320 × 240 × 90 mm, rigid, reusable',
      Card: 'Letterpress, handwritten to your message',
      Packed: 'By hand in Melbourne',
      Delivery: 'Free Australia-wide'
    }
  };

  /* Where the range goes next, named so the gifting page can say so honestly.
     These are not products and nothing on the site may pretend they are. */
  var OCCASIONS_TO_COME = [
    'For Mum', 'For the burnt-out friend', 'Birthday', 'New Mum',
    'New home', 'Thinking of you', 'Corporate'
  ];

  var STEPS = [
    { title: 'Choose the box and a ribbon', body: 'Clay rose or powder blue. There is one box, so this is the only decision.' },
    { title: 'Write your message', body: 'Up to 220 characters at checkout. We write it on the card by hand.' },
    { title: 'We pack it and tie it', body: 'By hand in Melbourne, usually the same working day.' },
    { title: 'It arrives ready to give', body: 'No invoice in the box, no pricing on the outside. Send it straight to them.' }
  ];

  /* ------------------------------------------------------------- lookups */

  function findProduct(id) {
    if (id === BOX.id) return BOX;
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].id === id) return PRODUCTS[i];
    }
    return null;
  }

  function boxContents() {
    return BOX.contents.map(findProduct).filter(Boolean);
  }

  global.SLEEP_CONFIG = CONFIG;
  global.SLEEP_GROUNDS = GROUNDS;
  global.SLEEP_BOX = BOX;
  global.SLEEP_PRODUCTS = PRODUCTS;
  global.SLEEP_OCCASIONS_TO_COME = OCCASIONS_TO_COME;
  global.SLEEP_STEPS = STEPS;
  global.SLEEP_FIND = findProduct;
  global.SLEEP_BOX_CONTENTS = boxContents;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      CONFIG: CONFIG,
      GROUNDS: GROUNDS,
      BOX: BOX,
      PRODUCTS: PRODUCTS,
      OCCASIONS_TO_COME: OCCASIONS_TO_COME,
      STEPS: STEPS,
      findProduct: findProduct,
      boxContents: boxContents
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
