/* Hush Sleep Shop — catalogue data.
   Pure data, no DOM. Loaded before every other script. */
(function (global) {
  'use strict';

  var CATEGORIES = [
    {
      slug: 'mattresses',
      name: 'Mattresses',
      tagline: 'The foundation. Try one for 100 nights.',
      art: 'mattress'
    },
    {
      slug: 'pillows',
      name: 'Pillows',
      tagline: 'Matched to how you actually sleep.',
      art: 'pillow'
    },
    {
      slug: 'bedding',
      name: 'Sheets & Bedding',
      tagline: 'Natural fibres that breathe all night.',
      art: 'sheets'
    },
    {
      slug: 'duvets-blankets',
      name: 'Duvets & Blankets',
      tagline: 'Warmth you can dial in by season.',
      art: 'duvet'
    },
    {
      slug: 'sleepwear',
      name: 'Sleepwear',
      tagline: 'Soft enough to forget you are wearing it.',
      art: 'sleepwear'
    },
    {
      slug: 'sleep-tech',
      name: 'Sleep Tech',
      tagline: 'Light, sound and timing, handled quietly.',
      art: 'lamp'
    },
    {
      slug: 'extras',
      name: 'Bedroom Extras',
      tagline: 'The small things that finish a room.',
      art: 'bottle'
    }
  ];

  var SIZES_BED = [
    { label: 'Single', delta: -600 },
    { label: 'Double', delta: -300 },
    { label: 'Queen', delta: 0 },
    { label: 'King', delta: 300 }
  ];

  var SIZES_LINEN = [
    { label: 'Single', delta: -60 },
    { label: 'Double', delta: -30 },
    { label: 'Queen', delta: 0 },
    { label: 'King', delta: 40 }
  ];

  var SIZES_APPAREL = [
    { label: 'XS', delta: 0 },
    { label: 'S', delta: 0 },
    { label: 'M', delta: 0 },
    { label: 'L', delta: 0 },
    { label: 'XL', delta: 0 }
  ];

  var PRODUCTS = [
    /* ---------------------------------------------------------- Mattresses */
    {
      id: 'cloudform-hybrid',
      name: 'Cloudform Hybrid Mattress',
      category: 'mattresses',
      price: 1899,
      compareAt: 2199,
      rating: 4.8,
      reviews: 1284,
      badges: ['Best seller'],
      art: 'mattress',
      tone: ['#2b2a57', '#6f7bb0', '#e8c77b'],
      sizes: SIZES_BED,
      sizeLabel: 'Size',
      blurb: 'Pocket springs under three foam layers — supportive without feeling firm.',
      description: [
        'Cloudform pairs 1,200 individually wrapped pocket springs with a graphite-infused comfort layer, so weight is carried where you need it and heat has somewhere to go. The result is a medium feel that most people settle into within a week.',
        'The zoned spring core is firmer under the hips and softer at the shoulders, which keeps side sleepers in line without the sink of an all-foam bed. Assembled in Australia and delivered rolled, so it fits up a stairwell.'
      ],
      features: [
        '1,200 zoned pocket springs for edge-to-edge support',
        'Graphite comfort layer draws heat away from the surface',
        'Removable, washable cover in GOTS-certified cotton',
        'Motion isolation tested for two-person beds'
      ],
      specs: {
        Feel: 'Medium (6 / 10)',
        Height: '28 cm',
        Core: 'Zoned pocket spring + 3-layer foam',
        Trial: '100 nights',
        Warranty: '10 years'
      },
      match: ['side', 'back', 'combo', 'hot', 'aches', 'mattress'],
      tags: ['hybrid', 'medium', 'cooling']
    },
    {
      id: 'deep-rest-memory',
      name: 'Deep Rest Memory Foam Mattress',
      category: 'mattresses',
      price: 1299,
      rating: 4.6,
      reviews: 742,
      badges: [],
      art: 'mattress',
      tone: ['#332b4d', '#8b7fb8', '#f0d9a8'],
      sizes: SIZES_BED,
      sizeLabel: 'Size',
      blurb: 'Slow-response foam that contours closely and stays quiet under movement.',
      description: [
        'Four layers of open-cell memory foam, graded from soft at the surface to dense at the base. It contours slowly around shoulders and hips, which suits people who wake with pressure-point aches.',
        'Because there are no springs, movement travels almost nowhere — the usual choice when one of you is up at 5am and the other is not.'
      ],
      features: [
        'Open-cell foam, CertiPUR certified',
        'Near-total motion isolation',
        'Soft-to-dense four-layer build',
        'Rolled and boxed for easy delivery'
      ],
      specs: {
        Feel: 'Medium-soft (4 / 10)',
        Height: '25 cm',
        Core: '4-layer open-cell memory foam',
        Trial: '100 nights',
        Warranty: '10 years'
      },
      match: ['side', 'aches', 'noise', 'mattress'],
      tags: ['foam', 'soft', 'pressure relief']
    },
    {
      id: 'nimbus-latex',
      name: 'Nimbus Natural Latex Mattress',
      category: 'mattresses',
      price: 2290,
      rating: 4.9,
      reviews: 331,
      badges: ['Natural'],
      art: 'mattress',
      tone: ['#26402f', '#7e9b8a', '#e8c77b'],
      sizes: SIZES_BED,
      sizeLabel: 'Size',
      blurb: 'Responsive Dunlop latex and organic wool. Buoyant rather than sinking.',
      description: [
        'Natural Dunlop latex pushes back gently instead of swallowing you, which makes moving around in the night effortless. Under the cover sits a layer of organic wool that buffers temperature in both directions.',
        'Made from tapped rubber trees and finished without polyurethane foam. Heavier than a boxed foam bed — we carry it in and take the packaging away.'
      ],
      features: [
        '100% natural Dunlop latex core',
        'Organic wool temperature buffer',
        'No polyurethane foam, no fibreglass',
        'White-glove delivery and setup included'
      ],
      specs: {
        Feel: 'Medium-firm (7 / 10)',
        Height: '30 cm',
        Core: 'Natural latex + organic wool',
        Trial: '100 nights',
        Warranty: '15 years'
      },
      match: ['back', 'front', 'hot', 'mattress'],
      tags: ['latex', 'firm', 'natural']
    },

    /* ------------------------------------------------------------- Pillows */
    {
      id: 'contour-cool-pillow',
      name: 'Contour Cool Pillow',
      category: 'pillows',
      price: 129,
      rating: 4.7,
      reviews: 918,
      badges: ['Best seller'],
      art: 'pillow',
      tone: ['#2b2a57', '#8fa5d6', '#f4efe6'],
      blurb: 'A cool-touch cover over shaped foam. Holds its height until morning.',
      description: [
        'Shaped memory foam with a phase-change cover that sheds heat as you settle. It keeps a consistent height through the night rather than flattening by 2am.',
        'The gentle contour cradles the neck without forcing your chin forward, which is where most "supportive" pillows go wrong.'
      ],
      features: [
        'Phase-change cool-touch cover',
        'Ventilated foam core, holds loft',
        'Two heights in the box — 10 cm and 12 cm',
        'Cover machine washable at 40°C'
      ],
      specs: {
        Feel: 'Medium',
        Fill: 'Ventilated memory foam',
        Sizes: 'Standard 48 × 74 cm',
        Trial: '100 nights'
      },
      match: ['side', 'back', 'hot', 'aches', 'pillow'],
      tags: ['cooling', 'supportive']
    },
    {
      id: 'down-cloud-pillow',
      name: 'Down Cloud Pillow',
      category: 'pillows',
      price: 149,
      rating: 4.8,
      reviews: 466,
      badges: [],
      art: 'pillow',
      tone: ['#3a3352', '#c8b8e0', '#fbf7f0'],
      blurb: 'Responsibly sourced down and feather, in a three-chamber build.',
      description: [
        'A soft down outer chamber wrapped around a firmer feather core, so it feels plush at the surface but does not collapse under the weight of your head.',
        'Down is RDS-certified and traceable to farm. Shake it out each morning and it will keep its shape for years.'
      ],
      features: [
        'RDS-certified 80 / 20 down and feather',
        'Three-chamber construction',
        'Cotton cambric shell, down-proof',
        'Refillable — send it back for a top-up'
      ],
      specs: {
        Feel: 'Soft',
        Fill: '80% down / 20% feather',
        Sizes: 'Standard 48 × 74 cm',
        Trial: '100 nights'
      },
      match: ['front', 'combo', 'pillow'],
      tags: ['soft', 'natural']
    },
    {
      id: 'side-sleeper-wedge',
      name: 'Side Sleeper Support Pillow',
      category: 'pillows',
      price: 89,
      rating: 4.5,
      reviews: 273,
      badges: [],
      art: 'pillow',
      tone: ['#264046', '#7fb0ae', '#f2ece1'],
      blurb: 'A taller gusseted pillow that fills the gap between shoulder and ear.',
      description: [
        'Side sleepers need more height than anyone else, and most pillows do not give it. A 14 cm gusset holds the loft steady all night so your neck stays level with your spine.',
        'Fill is shredded latex, which you can remove by the handful until the height is exactly right.'
      ],
      features: [
        '14 cm gusset for high loft',
        'Adjustable shredded latex fill',
        'Breathable bamboo-blend cover',
        'Fully washable cover and inner'
      ],
      specs: {
        Feel: 'Firm',
        Fill: 'Shredded natural latex (adjustable)',
        Sizes: 'Standard 48 × 74 cm',
        Trial: '100 nights'
      },
      match: ['side', 'aches', 'pillow'],
      tags: ['firm', 'adjustable']
    },

    /* ------------------------------------------------------- Sheets/bedding */
    {
      id: 'stonewashed-linen-set',
      name: 'Stonewashed Linen Sheet Set',
      category: 'bedding',
      price: 329,
      compareAt: 379,
      rating: 4.9,
      reviews: 1502,
      badges: ['Best seller'],
      art: 'sheets',
      tone: ['#4a3f52', '#c9a68f', '#f6efe4'],
      sizes: SIZES_LINEN,
      sizeLabel: 'Bed size',
      blurb: 'European flax, washed soft. Cool in summer, warm enough in winter.',
      description: [
        'Long-fibre European flax, stonewashed twice so it arrives soft rather than stiff. Linen moves moisture faster than cotton, which is why it feels cool without ever feeling cold.',
        'Set includes flat sheet, fitted sheet with deep 40 cm corners, and two pillowcases. It softens for years and does not pill.'
      ],
      features: [
        'Certified European flax linen',
        'Deep 40 cm fitted corners',
        'Twice stonewashed, pre-shrunk',
        'Four colourways, all pigment-dyed'
      ],
      specs: {
        Material: '100% French flax linen',
        Weight: '165 gsm',
        Includes: 'Flat, fitted, 2 pillowcases',
        Care: 'Machine wash cold, tumble low'
      },
      match: ['hot', 'bedding'],
      tags: ['linen', 'cooling', 'natural']
    },
    {
      id: 'percale-cotton-set',
      name: 'Long-Staple Percale Sheet Set',
      category: 'bedding',
      price: 219,
      rating: 4.7,
      reviews: 806,
      badges: [],
      art: 'sheets',
      tone: ['#2f3a55', '#9db4d6', '#f8f4ec'],
      sizes: SIZES_LINEN,
      sizeLabel: 'Bed size',
      blurb: 'Crisp hotel-style percale in 400-thread-count long-staple cotton.',
      description: [
        'A tight one-over-one percale weave gives that cool, crisp hand you get in a good hotel. Long-staple cotton means fewer fibre ends, so it stays smooth through hundreds of washes.',
        'Comes pre-washed and ready for the bed — no starchy first night.'
      ],
      features: [
        '400 thread count, single-ply',
        'OEKO-TEX Standard 100 certified',
        'Pre-washed for immediate softness',
        'Envelope-closure pillowcases'
      ],
      specs: {
        Material: '100% long-staple cotton',
        Weave: 'Percale, 400 TC',
        Includes: 'Flat, fitted, 2 pillowcases',
        Care: 'Machine wash warm'
      },
      match: ['hot', 'bedding'],
      tags: ['cotton', 'crisp']
    },
    {
      id: 'silk-pillowcase-pair',
      name: 'Mulberry Silk Pillowcase Pair',
      category: 'bedding',
      price: 79,
      rating: 4.6,
      reviews: 612,
      badges: [],
      art: 'sheets',
      tone: ['#4b3550', '#d7a7bd', '#faf1ea'],
      blurb: '22-momme silk — kinder to hair and skin than cotton.',
      description: [
        'Grade 6A mulberry silk at 22 momme, heavy enough to drape properly and last. Silk absorbs far less moisture than cotton, so overnight skincare stays where you put it.',
        'Hidden zip closure means the pillow stays in place while you move.'
      ],
      features: [
        '22-momme grade 6A mulberry silk',
        'Hidden zip, no flapping envelope',
        'OEKO-TEX certified dyes',
        'Pair of standard cases'
      ],
      specs: {
        Material: '100% mulberry silk',
        Weight: '22 momme',
        Includes: '2 standard pillowcases',
        Care: 'Cold gentle wash, air dry'
      },
      match: ['bedding'],
      tags: ['silk', 'luxury']
    },

    /* -------------------------------------------------- Duvets and blankets */
    {
      id: 'all-season-down-duvet',
      name: 'All-Season Down Duvet',
      category: 'duvets-blankets',
      price: 459,
      rating: 4.8,
      reviews: 389,
      badges: ['Two duvets in one'],
      art: 'duvet',
      tone: ['#2a3352', '#96a8d0', '#f7f2e8'],
      sizes: SIZES_LINEN,
      sizeLabel: 'Bed size',
      blurb: 'A light summer duvet and a mid-weight one, clipped together for winter.',
      description: [
        'Two duvets that snap together: 2.5 tog on its own for summer, 7 tog for the shoulder seasons, and 9.5 tog combined for the coldest nights.',
        'Filled with RDS-certified 700-loft down in baffle-box chambers, so nothing migrates into the corners.'
      ],
      features: [
        'Three warmth levels from one purchase',
        '700-loft RDS-certified down',
        'Baffle-box chambers stop cold spots',
        'Cotton sateen shell, down-proof'
      ],
      specs: {
        Warmth: '2.5 / 7 / 9.5 tog',
        Fill: '700-loft white duck down',
        Shell: '300 TC cotton sateen',
        Care: 'Professional clean'
      },
      match: ['cold', 'bedding'],
      tags: ['down', 'seasonal']
    },
    {
      id: 'wool-duvet',
      name: 'Australian Wool Duvet',
      category: 'duvets-blankets',
      price: 389,
      rating: 4.7,
      reviews: 254,
      badges: ['Made locally'],
      art: 'duvet',
      tone: ['#3d3527', '#c4a875', '#f6f0e4'],
      sizes: SIZES_LINEN,
      sizeLabel: 'Bed size',
      blurb: 'Wool regulates humidity, so it works in a hot room and a cold one.',
      description: [
        'Australian wool moves moisture vapour away from the bed instead of trapping it, which is why a wool duvet feels right across a much wider temperature range than down.',
        'Traceable to New England, NSW growers and made up in Melbourne.'
      ],
      features: [
        '100% Australian wool fill, traceable',
        'Naturally temperature-regulating',
        'Cotton japara casing',
        'Machine washable on wool cycle'
      ],
      specs: {
        Warmth: '350 gsm, all-season',
        Fill: '100% Australian wool',
        Shell: 'Cotton japara',
        Care: 'Wool cycle, cold'
      },
      match: ['hot', 'cold', 'bedding'],
      tags: ['wool', 'natural']
    },
    {
      id: 'weighted-blanket-7kg',
      name: 'Weighted Blanket, 7 kg',
      category: 'duvets-blankets',
      price: 249,
      rating: 4.6,
      reviews: 1043,
      badges: [],
      art: 'blanket',
      tone: ['#2f2a4a', '#7d74ad', '#ead7b6'],
      blurb: 'Even, quiet pressure for minds that will not switch off.',
      description: [
        'Glass microbeads in small stitched pockets spread weight evenly instead of pooling at your feet. The steady pressure gives most people something to focus on other than tomorrow.',
        'Choose roughly 10% of your body weight. The 7 kg suits 60–80 kg; a 9 kg is available on request.'
      ],
      features: [
        'Silent glass microbead fill',
        '12 cm quilted pockets, no pooling',
        'Removable bamboo-cotton cover',
        'Also in 5 kg and 9 kg'
      ],
      specs: {
        Weight: '7 kg',
        Size: '150 × 200 cm',
        Fill: 'Glass microbeads',
        Care: 'Cover machine washable'
      },
      match: ['mind', 'noise'],
      tags: ['calming', 'weighted']
    },
    {
      id: 'merino-throw',
      name: 'Merino Bed Throw',
      category: 'duvets-blankets',
      price: 189,
      rating: 4.8,
      reviews: 187,
      badges: [],
      art: 'blanket',
      tone: ['#43323a', '#c58f86', '#f7efe6'],
      blurb: 'A fine-knit merino layer for the end of the bed.',
      description: [
        'Woven from 19.5-micron merino, soft enough to sit against skin and warm without bulk. It reads as a finishing layer but does real work on a cold night.',
        'Hand-finished fringe, and it only gets better after a wash.'
      ],
      features: [
        '19.5-micron Australian merino',
        'Light enough to travel with',
        'Hand-knotted fringe',
        'Three neutral colourways'
      ],
      specs: {
        Material: '100% merino wool',
        Size: '130 × 180 cm',
        Weight: '900 g',
        Care: 'Wool cycle or dry clean'
      },
      match: ['cold'],
      tags: ['wool', 'throw']
    },

    /* ----------------------------------------------------------- Sleepwear */
    {
      id: 'brushed-cotton-pyjamas',
      name: 'Brushed Cotton Pyjama Set',
      category: 'sleepwear',
      price: 159,
      rating: 4.7,
      reviews: 421,
      badges: [],
      art: 'sleepwear',
      tone: ['#2c3a4e', '#8fb0c4', '#f6f1e7'],
      sizes: SIZES_APPAREL,
      sizeLabel: 'Size',
      blurb: 'Double-brushed cotton twill with a relaxed cut and no waistband dig.',
      description: [
        'Cotton twill brushed on both sides for a soft, dry hand. The trousers sit on a covered elastic waist with a drawcord, and the shirt has a proper camp collar rather than a stiff one.',
        'Cut generously through the hip so nothing binds when you turn over.'
      ],
      features: [
        'Double-brushed 100% cotton twill',
        'Covered elastic waist with drawcord',
        'Shell buttons, flat-felled seams',
        'Sizes XS to XL, unisex fit'
      ],
      specs: {
        Material: '100% brushed cotton',
        Fit: 'Relaxed, unisex',
        Includes: 'Shirt and trousers',
        Care: 'Machine wash warm'
      },
      match: ['cold'],
      tags: ['cotton', 'cosy']
    },
    {
      id: 'bamboo-sleep-tee',
      name: 'Bamboo Sleep Tee',
      category: 'sleepwear',
      price: 69,
      rating: 4.5,
      reviews: 298,
      badges: [],
      art: 'sleepwear',
      tone: ['#25423a', '#89b6a3', '#f4f1e6'],
      sizes: SIZES_APPAREL,
      sizeLabel: 'Size',
      blurb: 'Cool, drapey bamboo viscose for people who overheat in cotton.',
      description: [
        'Bamboo viscose sits cooler against skin than cotton and moves with you rather than twisting. The hem is cut long enough to stay put through the night.',
        'Closed-loop lyocell process, so the solvents are captured and reused.'
      ],
      features: [
        'Closed-loop bamboo viscose',
        'Cool-to-touch, quick drying',
        'Longline hem, side vents',
        'Sizes XS to XL, unisex fit'
      ],
      specs: {
        Material: '95% bamboo viscose / 5% elastane',
        Fit: 'Relaxed, unisex',
        Includes: 'Single tee',
        Care: 'Machine wash cold'
      },
      match: ['hot'],
      tags: ['cooling', 'bamboo']
    },

    /* ---------------------------------------------------------- Sleep tech */
    {
      id: 'sunrise-alarm-lamp',
      name: 'Sunrise Alarm Lamp',
      category: 'sleep-tech',
      price: 189,
      compareAt: 219,
      rating: 4.7,
      reviews: 655,
      badges: ['Staff pick'],
      art: 'lamp',
      tone: ['#2a2547', '#e0a55c', '#fbe6c0'],
      blurb: 'Wakes you with 30 minutes of light instead of a noise at full volume.',
      description: [
        'Light ramps from a deep amber to a bright warm white over half an hour, which nudges you out of deep sleep before the alarm ever sounds. There is a wind-down mode that runs the same curve backwards at night.',
        'No app required — everything is set on the dial. It will not send you a notification, ever.'
      ],
      features: [
        '30-minute sunrise and sunset curves',
        'Amber-only night light, no blue',
        'Physical dial, no app or account',
        'Six low-volume wake sounds'
      ],
      specs: {
        Power: 'USB-C, 12 W',
        Light: '2000–4000 K, 300 lm',
        Size: '17 cm diameter',
        Warranty: '2 years'
      },
      match: ['light', 'mind', 'tech'],
      tags: ['light', 'waking']
    },
    {
      id: 'white-noise-machine',
      name: 'White Noise Machine',
      category: 'sleep-tech',
      price: 129,
      rating: 4.6,
      reviews: 874,
      badges: [],
      art: 'sound',
      tone: ['#26304a', '#7f9ec4', '#eae3d3'],
      blurb: 'A real fan-driven hush, not a short audio loop you start to notice.',
      description: [
        'Sound is produced mechanically by an internal fan, so there is no loop point for your brain to latch onto at 3am. The tone and volume adjust with two rings on the body.',
        'Useful for street noise, thin walls and light-sleeping housemates alike.'
      ],
      features: [
        'Mechanical fan, no looping audio',
        'Adjustable tone and volume rings',
        'Draws 3 W, safe to run all night',
        'Travel case included'
      ],
      specs: {
        Power: 'Mains, 3 W',
        Output: '45–75 dB',
        Size: '12 cm diameter',
        Warranty: '2 years'
      },
      match: ['noise', 'mind', 'tech'],
      tags: ['sound', 'masking']
    },
    {
      id: 'silk-sleep-mask',
      name: 'Silk Sleep Mask',
      category: 'sleep-tech',
      price: 49,
      rating: 4.8,
      reviews: 1120,
      badges: ['Best seller'],
      art: 'mask',
      tone: ['#33294d', '#a68fd0', '#f5ecdd'],
      blurb: 'Contoured cups that block light without pressing on your eyes.',
      description: [
        'Moulded cups sit around the eye socket rather than on the lid, so you can blink and there is no pressure on the lashes. Blocks essentially all light, including a streetlight through thin curtains.',
        'Mulberry silk outer, adjustable strap that does not catch in hair.'
      ],
      features: [
        'Contoured cups, zero lid pressure',
        '22-momme mulberry silk face',
        'Snag-free adjustable strap',
        'Folds flat for travel'
      ],
      specs: {
        Material: 'Mulberry silk, moulded foam',
        Weight: '38 g',
        Fit: 'Adjustable 50–68 cm',
        Care: 'Hand wash'
      },
      match: ['light', 'tech'],
      tags: ['light blocking', 'travel']
    },

    /* ------------------------------------------------------------- Extras */
    {
      id: 'lavender-pillow-mist',
      name: 'Lavender Pillow Mist',
      category: 'extras',
      price: 34,
      rating: 4.4,
      reviews: 507,
      badges: [],
      art: 'bottle',
      tone: ['#3a3358', '#b0a2dd', '#f4eee2'],
      blurb: 'Tasmanian lavender and vetiver, two sprays before you turn the light off.',
      description: [
        'Steam-distilled Tasmanian lavender with vetiver and a little cedarwood. Alcohol-free, so it will not dry out linen or leave a mark.',
        'A scent cue is a small thing, but repeated nightly it becomes a reliable signal that the day is over.'
      ],
      features: [
        'Tasmanian lavender, steam distilled',
        'Alcohol-free, safe on linen',
        '100 ml recycled glass bottle',
        'No synthetic fragrance'
      ],
      specs: {
        Volume: '100 ml',
        Scent: 'Lavender, vetiver, cedarwood',
        Base: 'Distilled water, no alcohol',
        Made: 'Australia'
      },
      match: ['mind'],
      tags: ['scent', 'ritual']
    },
    {
      id: 'blackout-curtain',
      name: 'Blackout Curtain Panel',
      category: 'extras',
      price: 149,
      rating: 4.5,
      reviews: 218,
      badges: [],
      art: 'curtain',
      tone: ['#232842', '#6f7fa8', '#ece5d6'],
      blurb: 'Triple-weave panel that takes a bright morning down to near dark.',
      description: [
        'A triple-weave fabric with a dense inner layer blocks around 99% of light without the plastic backing that makes cheap blackout curtains crinkle.',
        'It also dampens outside noise noticeably and holds heat in during winter.'
      ],
      features: [
        'Triple weave, ~99% light block',
        'No plastic or foam backing',
        'Reduces street noise and draughts',
        'Rod pocket and hidden tab top'
      ],
      specs: {
        Size: '140 × 230 cm panel',
        Material: 'Triple-weave polyester',
        Header: 'Rod pocket / hidden tab',
        Care: 'Machine wash cold'
      },
      match: ['light', 'noise'],
      tags: ['light blocking', 'room']
    },
    {
      id: 'bedside-diffuser',
      name: 'Bedside Diffuser',
      category: 'extras',
      price: 99,
      rating: 4.3,
      reviews: 164,
      badges: [],
      art: 'bottle',
      tone: ['#2b3b3a', '#89b3ad', '#f2ece0'],
      blurb: 'Runs silent for eight hours and shuts itself off before morning.',
      description: [
        'Ultrasonic diffusion with no pump noise, a 300 ml tank and an eight-hour timer that switches off on its own. The night light is amber and dims to nothing.',
        'Ceramic shell rather than gloss plastic, so it looks like an object rather than an appliance.'
      ],
      features: [
        'Genuinely silent operation',
        '300 ml tank, 8-hour runtime',
        'Auto shut-off when empty',
        'Glazed ceramic shell'
      ],
      specs: {
        Capacity: '300 ml',
        Runtime: 'Up to 8 hours',
        Power: 'USB-C',
        Warranty: '2 years'
      },
      match: ['mind'],
      tags: ['scent', 'quiet']
    }
  ];

  var CONFIG = {
    brand: 'Hush',
    currency: 'AUD',
    locale: 'en-AU',
    freeShippingFrom: 99,
    shippingFlat: 12,
    promoCodes: { SLEEPWELL: 0.1, FIRSTNIGHT: 0.15 }
  };

  global.HUSH_CATEGORIES = CATEGORIES;
  global.HUSH_PRODUCTS = PRODUCTS;
  global.HUSH_CONFIG = CONFIG;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CATEGORIES: CATEGORIES, PRODUCTS: PRODUCTS, CONFIG: CONFIG };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
