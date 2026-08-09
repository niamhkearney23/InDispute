/* Hush Sleep Shop — product artwork.
   Every image on the site is generated SVG: no binary assets, no network
   requests, and each product gets its own palette from `product.tone`. */
(function (global) {
  'use strict';

  var uid = 0;

  function nextId() {
    uid += 1;
    return 'h' + uid;
  }

  /* Tiny helpers so scenes stay readable. */
  function stars(count, seedOffset) {
    var out = '';
    for (var i = 0; i < count; i++) {
      /* Deterministic pseudo-scatter — same product always draws the same sky. */
      var s = Math.sin((i + 1) * 12.9898 + seedOffset) * 43758.5453;
      var x = Math.abs(s % 1) * 400;
      var t = Math.sin((i + 1) * 78.233 + seedOffset) * 12543.123;
      var y = Math.abs(t % 1) * 120;
      var r = 0.8 + Math.abs(s % 1) * 1.2;
      out += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) +
        '" r="' + r.toFixed(1) + '" fill="#fff" opacity="' +
        (0.25 + Math.abs(t % 1) * 0.5).toFixed(2) + '"/>';
    }
    return out;
  }

  var SCENES = {
    mattress: function (c) {
      return '' +
        '<rect x="52" y="196" width="296" height="14" rx="7" fill="' + c[0] + '" opacity=".55"/>' +
        '<rect x="70" y="210" width="16" height="34" rx="5" fill="' + c[0] + '" opacity=".7"/>' +
        '<rect x="314" y="210" width="16" height="34" rx="5" fill="' + c[0] + '" opacity=".7"/>' +
        '<rect x="60" y="150" width="280" height="48" rx="16" fill="' + c[2] + '"/>' +
        '<rect x="60" y="176" width="280" height="22" rx="11" fill="' + c[1] + '" opacity=".45"/>' +
        '<path d="M60 166h280" stroke="' + c[0] + '" stroke-opacity=".22" stroke-width="1.5"/>' +
        '<g fill="' + c[0] + '" fill-opacity=".3">' +
        '<circle cx="110" cy="160" r="2.6"/><circle cx="160" cy="160" r="2.6"/>' +
        '<circle cx="210" cy="160" r="2.6"/><circle cx="260" cy="160" r="2.6"/>' +
        '<circle cx="310" cy="160" r="2.6"/></g>' +
        '<path d="M96 150c0-16 12-24 34-24s34 8 34 24z" fill="#fff" fill-opacity=".82"/>' +
        '<path d="M186 150c0-13 10-20 28-20s28 7 28 20z" fill="#fff" fill-opacity=".55"/>';
    },

    pillow: function (c) {
      return '' +
        '<path d="M92 96c0-14 16-22 108-22s108 8 108 22 6 60 0 74-30 22-108 22-102-8-108-22-6-60 0-74z" fill="' + c[2] + '"/>' +
        '<path d="M120 118c26-10 134-10 160 0" stroke="' + c[1] + '" stroke-opacity=".55" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M120 172c26 10 134 10 160 0" stroke="' + c[1] + '" stroke-opacity=".4" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M92 170c40 14 176 14 216 0" stroke="' + c[0] + '" stroke-opacity=".14" stroke-width="2" fill="none"/>' +
        '<ellipse cx="200" cy="218" rx="118" ry="12" fill="' + c[0] + '" opacity=".28"/>';
    },

    sheets: function (c) {
      var bar = function (y, w, fill, op) {
        return '<rect x="' + (200 - w / 2) + '" y="' + y + '" width="' + w +
          '" height="34" rx="10" fill="' + fill + '" opacity="' + op + '"/>';
      };
      return '' +
        bar(96, 196, c[1], '.75') +
        bar(132, 214, c[2], '1') +
        bar(168, 228, c[1], '.9') +
        bar(204, 208, c[2], '.8') +
        '<path d="M124 132v34M276 132v34" stroke="' + c[0] + '" stroke-opacity=".18" stroke-width="2"/>' +
        '<path d="M118 168v34M282 168v34" stroke="' + c[0] + '" stroke-opacity=".14" stroke-width="2"/>' +
        '<circle cx="200" cy="150" r="7" fill="' + c[0] + '" opacity=".18"/>';
    },

    duvet: function (c) {
      var grid = '';
      for (var x = 0; x < 5; x++) {
        grid += '<path d="M' + (100 + x * 40) + ' 118v104" stroke="' + c[0] +
          '" stroke-opacity=".16" stroke-width="1.5"/>';
      }
      for (var y = 0; y < 3; y++) {
        grid += '<path d="M76 ' + (150 + y * 34) + 'h248" stroke="' + c[0] +
          '" stroke-opacity=".16" stroke-width="1.5"/>';
      }
      return '' +
        '<path d="M76 130c24-18 52-18 76 0s52 18 76 0 52-18 76 0v92c0 8-6 14-14 14H90c-8 0-14-6-14-14z" fill="' + c[2] + '"/>' +
        grid +
        '<g fill="' + c[1] + '" fill-opacity=".5">' +
        '<circle cx="120" cy="168" r="3"/><circle cx="200" cy="168" r="3"/><circle cx="280" cy="168" r="3"/>' +
        '<circle cx="160" cy="202" r="3"/><circle cx="240" cy="202" r="3"/></g>' +
        '<ellipse cx="200" cy="244" rx="132" ry="10" fill="' + c[0] + '" opacity=".25"/>';
    },

    blanket: function (c) {
      var knit = '';
      for (var r = 0; r < 5; r++) {
        for (var k = 0; k < 9; k++) {
          knit += '<rect x="' + (96 + k * 24) + '" y="' + (118 + r * 22) +
            '" width="16" height="14" rx="7" fill="' + c[1] + '" fill-opacity=".35"/>';
        }
      }
      var fringe = '';
      for (var f = 0; f < 12; f++) {
        fringe += '<path d="M' + (98 + f * 18) + ' 228v16" stroke="' + c[1] +
          '" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>';
      }
      return '' +
        '<rect x="88" y="108" width="224" height="120" rx="12" fill="' + c[2] + '"/>' +
        knit + fringe +
        '<rect x="88" y="108" width="224" height="120" rx="12" fill="none" stroke="' + c[0] + '" stroke-opacity=".18" stroke-width="2"/>';
    },

    sleepwear: function (c) {
      return '' +
        '<path d="M150 92l30-12h40l30 12 22 30-24 16-6-12v84c0 6-5 10-10 10h-64c-6 0-10-4-10-10v-84l-6 12-24-16z" fill="' + c[2] + '"/>' +
        '<path d="M180 80c0 12 9 20 20 20s20-8 20-20" stroke="' + c[0] + '" stroke-opacity=".3" stroke-width="2.5" fill="none"/>' +
        '<path d="M200 100v120" stroke="' + c[0] + '" stroke-opacity=".18" stroke-width="2"/>' +
        '<g fill="' + c[1] + '" fill-opacity=".7"><circle cx="200" cy="128" r="3.4"/><circle cx="200" cy="158" r="3.4"/><circle cx="200" cy="188" r="3.4"/></g>' +
        '<path d="M262 138l18-8" stroke="' + c[1] + '" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>' +
        '<ellipse cx="200" cy="236" rx="86" ry="9" fill="' + c[0] + '" opacity=".25"/>';
    },

    lamp: function (c, id) {
      return '' +
        '<circle cx="200" cy="150" r="94" fill="url(#glow' + id + ')"/>' +
        '<path d="M144 158a56 56 0 0 1 112 0z" fill="' + c[2] + '"/>' +
        '<rect x="144" y="158" width="112" height="10" rx="5" fill="' + c[1] + '"/>' +
        '<rect x="190" y="168" width="20" height="42" rx="6" fill="' + c[1] + '" opacity=".8"/>' +
        '<rect x="160" y="210" width="80" height="14" rx="7" fill="' + c[0] + '" opacity=".65"/>' +
        '<g stroke="' + c[2] + '" stroke-width="3" stroke-linecap="round" opacity=".8">' +
        '<path d="M112 118l-16-10"/><path d="M288 118l16-10"/><path d="M200 74V56"/></g>';
    },

    sound: function (c) {
      var arcs = '';
      for (var i = 0; i < 4; i++) {
        var r = 44 + i * 22;
        arcs += '<path d="M200 ' + (166 - r) + 'a' + r + ' ' + r + ' 0 0 1 0 ' + r * 2 +
          '" stroke="' + c[1] + '" stroke-opacity="' + (0.62 - i * 0.13).toFixed(2) +
          '" stroke-width="3" fill="none" stroke-linecap="round"/>';
        arcs += '<path d="M200 ' + (166 - r) + 'a' + r + ' ' + r + ' 0 0 0 0 ' + r * 2 +
          '" stroke="' + c[1] + '" stroke-opacity="' + (0.62 - i * 0.13).toFixed(2) +
          '" stroke-width="3" fill="none" stroke-linecap="round"/>';
      }
      return arcs +
        '<circle cx="200" cy="166" r="34" fill="' + c[2] + '"/>' +
        '<circle cx="200" cy="166" r="18" fill="' + c[0] + '" opacity=".35"/>' +
        '<circle cx="200" cy="166" r="6" fill="' + c[2] + '"/>';
    },

    mask: function (c) {
      return '' +
        '<path d="M118 128h164c14 0 22 10 20 24l-6 34c-3 16-14 24-32 24h-40c-10 0-16-4-24-12-8 8-14 12-24 12h-40c-18 0-29-8-32-24l-6-34c-2-14 6-24 20-24z" fill="' + c[2] + '"/>' +
        '<path d="M92 150c-18 4-30 14-34 28M308 150c18 4 30 14 34 28" stroke="' + c[1] + '" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<path d="M146 174c8-10 22-10 30 0M224 174c8-10 22-10 30 0" stroke="' + c[0] + '" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="200" cy="228" rx="96" ry="10" fill="' + c[0] + '" opacity=".25"/>';
    },

    bottle: function (c) {
      var mist = '';
      for (var i = 0; i < 7; i++) {
        var angle = -0.9 + i * 0.3;
        mist += '<circle cx="' + (250 + Math.cos(angle) * (30 + i * 8)).toFixed(1) +
          '" cy="' + (104 - Math.sin(angle) * (18 + i * 5)).toFixed(1) +
          '" r="' + (2 + (i % 3)) + '" fill="' + c[1] + '" opacity="' + (0.6 - i * 0.06).toFixed(2) + '"/>';
      }
      return mist +
        '<rect x="212" y="92" width="34" height="16" rx="5" fill="' + c[1] + '"/>' +
        '<rect x="188" y="86" width="30" height="30" rx="6" fill="' + c[0] + '" opacity=".75"/>' +
        '<rect x="192" y="116" width="22" height="18" fill="' + c[1] + '" opacity=".7"/>' +
        '<path d="M164 140c0-8 6-14 14-14h44c8 0 14 6 14 14v72c0 10-8 18-18 18h-36c-10 0-18-8-18-18z" fill="' + c[2] + '"/>' +
        '<rect x="176" y="160" width="48" height="36" rx="6" fill="' + c[0] + '" opacity=".22"/>' +
        '<ellipse cx="200" cy="238" rx="60" ry="8" fill="' + c[0] + '" opacity=".25"/>';
    },

    curtain: function (c, id) {
      var folds = '';
      for (var i = 0; i < 6; i++) {
        var x = 118 + i * 28;
        folds += '<path d="M' + x + ' 84c8 46 8 92 0 144" stroke="' + c[0] +
          '" stroke-opacity=".18" stroke-width="2" fill="none"/>';
      }
      return '' +
        '<rect x="140" y="60" width="120" height="150" rx="8" fill="url(#glow' + id + ')" opacity=".9"/>' +
        '<rect x="104" y="76" width="192" height="152" rx="10" fill="' + c[2] + '"/>' +
        folds +
        '<rect x="96" y="70" width="208" height="12" rx="6" fill="' + c[1] + '"/>' +
        '<ellipse cx="200" cy="236" rx="112" ry="10" fill="' + c[0] + '" opacity=".25"/>';
    }
  };

  /* Renders the illustration for a product (or any {art, tone} pair). */
  function render(product, options) {
    var opts = options || {};
    var tone = (product && product.tone) || ['#2b2a57', '#8fa5d6', '#f2ece1'];
    var kind = (product && product.art) || 'pillow';
    var scene = SCENES[kind] || SCENES.pillow;
    var id = nextId();
    var label = opts.label || (product && product.name) || 'Product illustration';

    return '' +
      '<svg class="art art--' + kind + '" viewBox="0 0 400 300" role="img" ' +
      'aria-label="' + escapeAttr(label) + '" preserveAspectRatio="xMidYMid slice">' +
      '<defs>' +
      '<linearGradient id="bg' + id + '" x1="0" y1="0" x2="0.4" y2="1">' +
      '<stop offset="0%" stop-color="' + tone[0] + '"/>' +
      '<stop offset="100%" stop-color="' + mix(tone[0], tone[1], 0.55) + '"/>' +
      '</linearGradient>' +
      '<radialGradient id="glow' + id + '" cx="50%" cy="45%" r="55%">' +
      '<stop offset="0%" stop-color="' + tone[2] + '" stop-opacity=".85"/>' +
      '<stop offset="100%" stop-color="' + tone[2] + '" stop-opacity="0"/>' +
      '</radialGradient>' +
      '</defs>' +
      '<rect width="400" height="300" fill="url(#bg' + id + ')"/>' +
      stars(14, kind.length) +
      '<circle cx="336" cy="56" r="22" fill="' + tone[2] + '" opacity=".35"/>' +
      '<circle cx="328" cy="50" r="22" fill="url(#bg' + id + ')"/>' +
      scene(tone, id) +
      '</svg>';
  }

  /* Hero night sky, used once on the home page. */
  function heroSky() {
    var id = nextId();
    return '' +
      '<svg class="sky" viewBox="0 0 1200 520" aria-hidden="true" preserveAspectRatio="xMidYMid slice">' +
      '<defs><radialGradient id="moon' + id + '" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#f6e3b8" stop-opacity=".9"/>' +
      '<stop offset="100%" stop-color="#f6e3b8" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<g class="sky__stars">' + skyStars(70) + '</g>' +
      '<circle cx="980" cy="130" r="130" fill="url(#moon' + id + ')"/>' +
      '<circle cx="980" cy="130" r="46" fill="#f7e6bd" opacity=".92"/>' +
      '<circle cx="963" cy="121" r="46" fill="#151433" opacity=".0"/>' +
      '<path d="M0 430c140-46 250-14 380 6s232 4 340-32 300-30 480 26v90H0z" fill="#0e0d24" opacity=".55"/>' +
      '<path d="M0 470c160-36 270-6 400 12s250-2 356-30 284-22 444 30v38H0z" fill="#0b0a1c" opacity=".75"/>' +
      '</svg>';
  }

  function skyStars(count) {
    var out = '';
    for (var i = 0; i < count; i++) {
      var s = Math.abs(Math.sin((i + 1) * 91.7) % 1);
      var t = Math.abs(Math.cos((i + 1) * 43.3) % 1);
      var r = (0.6 + s * 1.6).toFixed(1);
      out += '<circle class="twinkle" style="--d:' + (i % 9) + 's" cx="' +
        (s * 1200).toFixed(0) + '" cy="' + (t * 380).toFixed(0) + '" r="' + r +
        '" fill="#fff" opacity="' + (0.2 + t * 0.6).toFixed(2) + '"/>';
    }
    return out;
  }

  /* ------------------------------------------------------------ utilities */

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16)
    ];
  }

  function mix(a, b, amount) {
    var ca = hexToRgb(a);
    var cb = hexToRgb(b);
    var out = ca.map(function (v, i) {
      return Math.round(v + (cb[i] - v) * amount);
    });
    return '#' + out.map(function (v) {
      return ('0' + v.toString(16)).slice(-2);
    }).join('');
  }

  function escapeAttr(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  global.HushArt = { render: render, heroSky: heroSky, mix: mix };
})(typeof globalThis !== 'undefined' ? globalThis : this);
