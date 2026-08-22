/* Sleep Shop — artwork.
   Every image on the site is generated SVG on one of the five brand grounds:
   cocoa, rose, powder, cream, stripe. Square, because the whole visual
   system is built around square tiles.

   No moons, no icons — soft product shapes on saturated grounds, per the
   brand plan. Consistent grounds are what make the set look composed. */
(function (global) {
  'use strict';

  var uid = 0;

  function nextId() {
    uid += 1;
    return 's' + uid;
  }

  function grounds() {
    return global.SLEEP_GROUNDS || {};
  }

  /* Object colours are chosen against the ground: powder blue is the product
     colour on light grounds, cream on dark ones. */
  function palette(name) {
    var g = grounds()[name] || grounds().powder || { bg: '#AFC9DF', ink: '#2E4257', soft: '#6F8FAC' };
    var light = name === 'cream' || name === 'stripe';
    return {
      bg: g.bg,
      ink: g.ink,
      soft: g.soft,
      striped: !!g.striped,
      obj: light ? '#AFC9DF' : '#F2E9DC',
      shade: light ? '#8FB0CC' : '#D9C9B4',
      deep: light ? '#6F8FAC' : '#B9A488'
    };
  }

  /* A soft contact shadow. Kept close to the object and low in opacity —
     further away it reads as a second shape rather than a shadow. */
  function shadow(c, cx, cy, rx) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + (rx * 0.1).toFixed(0) +
      '" fill="' + c.ink + '" opacity=".09"/>';
  }

  var SCENES = {
    /* The hero: closed box, ribbon tied, seen from above. */
    'box-closed': function (c) {
      /* Seen from directly above, so there is no cast shadow — just a soft
         edge under the box. */
      return '<ellipse cx="200" cy="306" rx="126" ry="10" fill="' + c.ink + '" opacity=".07"/>' +
        '<rect x="66" y="86" width="268" height="216" rx="10" fill="' + c.obj + '"/>' +
        '<rect x="66" y="86" width="268" height="216" rx="10" fill="none" stroke="' + c.deep + '" stroke-opacity=".35"/>' +
        '<rect x="66" y="262" width="268" height="40" rx="10" fill="' + c.shade + '" opacity=".55"/>' +
        ribbonCross(c) +
        bow(c, 200, 150);
    },

    /* Lid off, tissue open, one piece lifted clear. */
    'box-open': function (c) {
      return shadow(c, 200, 318, 130) +
        /* Lid, propped behind. */
        '<rect x="206" y="76" width="150" height="104" rx="8" fill="' + c.shade + '" ' +
          'transform="rotate(-9 281 128)"/>' +
        '<rect x="206" y="76" width="150" height="104" rx="8" fill="none" stroke="' + c.deep +
          '" stroke-opacity=".35" transform="rotate(-9 281 128)"/>' +
        /* Tissue, folded back over the rim — two soft points, nothing fussy. */
        '<path d="M104 182l52-44 30 44z" fill="' + c.obj + '" opacity=".55"/>' +
        '<path d="M196 182l46-38 34 38z" fill="' + c.obj + '" opacity=".4"/>' +
        /* Box body. */
        '<path d="M70 186h260v106c0 12-9 22-21 22H91c-12 0-21-10-21-22z" fill="' + c.obj + '"/>' +
        '<rect x="70" y="176" width="260" height="20" rx="6" fill="' + c.shade + '"/>' +
        /* Two pieces sitting in it. */
        '<rect x="98" y="212" width="86" height="66" rx="8" fill="' + c.shade + '"/>' +
        '<circle cx="252" cy="246" r="34" fill="' + c.shade + '" opacity=".75"/>' +
        '<circle cx="252" cy="246" r="15" fill="' + c.obj + '"/>' +
        '<path d="M70 186h260" stroke="' + c.deep + '" stroke-opacity=".3" stroke-width="2"/>';
    },

    mask: function (c) {
      return shadow(c, 200, 266, 112) +
        '<path d="M96 148h208c16 0 26 12 23 28l-8 40c-4 20-16 30-38 30h-46c-12 0-19-5-29-15-10 10-17 15-29 15H131c-22 0-34-10-38-30l-8-40c-3-16 7-28 23-28z" fill="' + c.obj + '"/>' +
        '<path d="M74 172c-20 5-33 16-38 32M326 172c20 5 33 16 38 32" stroke="' + c.obj +
          '" stroke-width="6" fill="none" stroke-linecap="round" opacity=".85"/>' +
        '<path d="M132 196c10-11 26-11 36 0M232 196c10-11 26-11 36 0" stroke="' + c.deep +
          '" stroke-opacity=".45" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
    },

    /* Silk folded in thirds, raking side light. */
    pillowcase: function (c) {
      return shadow(c, 200, 310, 122) +
        '<rect x="72" y="104" width="256" height="196" rx="8" fill="' + c.obj + '"/>' +
        '<path d="M72 168h256M72 236h256" stroke="' + c.deep + '" stroke-opacity=".3" stroke-width="2.5"/>' +
        '<path d="M72 168c64 18 128 18 192 0 22-6 44-10 64-10" fill="none" stroke="' + c.shade + '" stroke-width="10" opacity=".55"/>' +
        '<path d="M110 104v196M290 104v196" stroke="' + c.deep + '" stroke-opacity=".14" stroke-width="2"/>' +
        '<path d="M72 104c60 26 124 34 256 12" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="8"/>';
    },

    scrunchie: function (c) {
      var ridges = '';
      for (var i = 0; i < 16; i++) {
        var a = (i / 16) * Math.PI * 2;
        var x1 = 200 + Math.cos(a) * 62;
        var y1 = 208 + Math.sin(a) * 62;
        var x2 = 200 + Math.cos(a) * 104;
        var y2 = 208 + Math.sin(a) * 104;
        ridges += '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1) +
          '" stroke="' + c.deep + '" stroke-opacity=".28" stroke-width="4" stroke-linecap="round"/>';
      }
      return shadow(c, 200, 318, 100) +
        '<circle cx="200" cy="208" r="104" fill="' + c.obj + '"/>' +
        '<circle cx="200" cy="208" r="62" fill="' + c.bg + '"/>' +
        ridges +
        '<circle cx="200" cy="208" r="62" fill="none" stroke="' + c.shade + '" stroke-width="3" opacity=".6"/>';
    },

    socks: function (c) {
      var sock = function (x, flip) {
        return '<g transform="translate(' + x + ',0)' + (flip ? ' scale(-1,1) translate(-120,0)' : '') + '">' +
          '<path d="M22 108h58c8 0 12 4 12 12v74c0 26 22 30 22 56 0 24-20 40-44 40s-44-16-44-40c0-30 8-38 8-64v-66c0-8 4-12 12-12z" fill="' + c.obj + '"/>' +
          '<path d="M22 132h92" stroke="' + c.deep + '" stroke-opacity=".35" stroke-width="4"/>' +
          '<path d="M40 168v56M62 168v56M84 168v56" stroke="' + c.deep + '" stroke-opacity=".18" stroke-width="3"/>' +
          '</g>';
      };
      return shadow(c, 200, 302, 112) + sock(58, false) + sock(214, true);
    },

    bottle: function (c) {
      var mist = '';
      for (var i = 0; i < 8; i++) {
        var t = i / 7;
        mist += '<circle cx="' + (232 + t * 78).toFixed(1) + '" cy="' + (96 - Math.sin(t * 2.2) * 34).toFixed(1) +
          '" r="' + (2.5 + (i % 3) * 1.6).toFixed(1) + '" fill="' + c.obj + '" opacity="' + (0.55 - t * 0.35).toFixed(2) + '"/>';
      }
      return shadow(c, 200, 308, 82) + mist +
        '<rect x="206" y="98" width="42" height="14" rx="4" fill="' + c.shade + '"/>' +
        '<rect x="170" y="90" width="40" height="34" rx="6" fill="' + c.shade + '"/>' +
        '<rect x="178" y="124" width="24" height="22" fill="' + c.deep + '" opacity=".55"/>' +
        '<path d="M136 162c0-10 8-18 18-18h92c10 0 18 8 18 18v112c0 14-11 24-25 24h-78c-14 0-25-10-25-24z" fill="' + c.obj + '"/>' +
        '<rect x="160" y="192" width="80" height="56" rx="6" fill="' + c.bg + '" opacity=".5"/>' +
        '<path d="M154 162c30 10 62 10 92 0" stroke="#fff" stroke-opacity=".3" stroke-width="6" fill="none"/>';
    },

    tea: function (c) {
      var leaves = '';
      for (var i = 0; i < 5; i++) {
        var x = 118 + i * 42;
        var y = 300 + (i % 2 ? 10 : 0);
        leaves += '<ellipse cx="' + x + '" cy="' + y + '" rx="13" ry="7" fill="' + c.obj +
          '" opacity=".7" transform="rotate(' + (i * 34 - 40) + ' ' + x + ' ' + y + ')"/>';
      }
      return shadow(c, 200, 292, 92) +
        '<rect x="112" y="128" width="176" height="152" rx="14" fill="' + c.obj + '"/>' +
        '<rect x="104" y="112" width="192" height="34" rx="12" fill="' + c.shade + '"/>' +
        '<rect x="140" y="176" width="120" height="66" rx="6" fill="' + c.bg + '" opacity=".45"/>' +
        '<path d="M112 200h176" stroke="' + c.deep + '" stroke-opacity=".18" stroke-width="2"/>' +
        leaves;
    },

    candle: function (c) {
      return shadow(c, 200, 312, 62) +
        '<rect x="146" y="128" width="108" height="180" rx="10" fill="' + c.obj + '"/>' +
        '<ellipse cx="200" cy="128" rx="54" ry="14" fill="' + c.shade + '"/>' +
        '<ellipse cx="200" cy="128" rx="34" ry="8" fill="' + c.deep + '" opacity=".35"/>' +
        '<path d="M200 122v-26" stroke="' + c.ink + '" stroke-opacity=".65" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M158 150c0 60 0 100 0 150" stroke="#fff" stroke-opacity=".28" stroke-width="7"/>';
    },

    journal: function (c) {
      return shadow(c, 200, 300, 110) +
        '<rect x="92" y="104" width="216" height="196" rx="6" fill="' + c.shade + '" opacity=".7"/>' +
        '<rect x="84" y="96" width="216" height="196" rx="6" fill="' + c.obj + '"/>' +
        '<path d="M110 96v196" stroke="' + c.deep + '" stroke-opacity=".4" stroke-width="3"/>' +
        '<rect x="150" y="158" width="108" height="4" rx="2" fill="' + c.deep + '" opacity=".3"/>' +
        '<rect x="150" y="178" width="76" height="4" rx="2" fill="' + c.deep + '" opacity=".22"/>' +
        '<rect x="236" y="96" width="18" height="196" fill="' + c.bg + '" opacity=".35"/>';
    },

    /* The card, being written — the most persuasive image in the set. */
    card: function (c) {
      return shadow(c, 200, 304, 128) +
        '<rect x="70" y="132" width="260" height="164" rx="6" fill="' + c.obj + '"/>' +
        '<path d="M104 186h150M104 214h176M104 242h122" stroke="' + c.deep +
          '" stroke-opacity=".38" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M104 268c26-8 52-8 74 0" stroke="' + c.deep +
          '" stroke-opacity=".26" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path d="M246 262l84-96c6-7 16-8 22-2s6 16-1 23l-84 95-27 12z" fill="' + c.shade + '"/>' +
        '<path d="M240 294l6-32 21 19z" fill="' + c.ink + '" opacity=".7"/>';
    },

    ribbon: function (c) {
      return '<path d="M60 210c56-46 108 46 164 0s90-42 116-6" stroke="' + c.obj +
          '" stroke-width="26" fill="none" stroke-linecap="round"/>' +
        '<path d="M60 210c56-46 108 46 164 0s90-42 116-6" stroke="' + c.shade +
          '" stroke-width="6" fill="none" stroke-linecap="round" opacity=".5"/>' +
        bow(c, 200, 128);
    }
  };

  function ribbonCross(c) {
    return '<rect x="182" y="86" width="36" height="216" fill="' + c.shade + '"/>' +
      '<rect x="66" y="176" width="268" height="36" fill="' + c.shade + '"/>' +
      '<rect x="182" y="86" width="36" height="216" fill="' + c.deep + '" opacity=".2"/>';
  }

  function bow(c, cx, cy) {
    return '<g transform="translate(' + cx + ',' + cy + ')">' +
      '<path d="M-6 0C-30-28-72-24-72 2c0 20 34 26 66 8z" fill="' + c.shade + '"/>' +
      '<path d="M6 0C30-28 72-24 72 2c0 20-34 26-66 8z" fill="' + c.shade + '"/>' +
      '<path d="M-6 0C-30 28-46 52-38 60c8 8 26-12 38-44z" fill="' + c.deep + '" opacity=".55"/>' +
      '<path d="M6 0C30 28 46 52 38 60c-8 8-26-12-38-44z" fill="' + c.deep + '" opacity=".55"/>' +
      '<circle cx="0" cy="4" r="13" fill="' + c.obj + '"/></g>';
  }

  /* item: { art, ground, name, photo }  — everything in data.js has these.

     Set `photo` on anything in data.js and a real photograph replaces the
     drawing in every place that image appears. Nothing else has to change:
     the illustrations are placeholders holding the exact crop the shoot
     needs to fill (square, subject centred, generous margin). */
  function render(item, options) {
    var opts = options || {};
    var thing = item || {};
    var photo = opts.photo || thing.photo;
    if (photo) {
      return '<img class="art art--photo" src="' + escapeAttr(photo) + '" alt="' +
        escapeAttr(opts.label != null ? opts.label : (thing.name || '')) +
        '" loading="lazy" decoding="async" width="1200" height="1200">';
    }
    var c = palette(opts.ground || thing.ground || 'powder');
    var scene = SCENES[opts.art || thing.art] || SCENES['box-closed'];
    var id = nextId();
    var label = opts.label != null ? opts.label : (thing.name || 'Sleep Shop');

    return '' +
      '<svg class="art" viewBox="0 0 400 400" role="img" ' +
      'aria-label="' + escapeAttr(label) + '" preserveAspectRatio="xMidYMid slice">' +
      '<defs><radialGradient id="lit' + id + '" cx="50%" cy="58%" r="58%">' +
      '<stop offset="0%" stop-color="#ffffff" stop-opacity="' + (c.striped ? '.5' : '.28') + '"/>' +
      '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>' +
      '</radialGradient>' +
      (c.striped ? stripePattern(id, c) : '') +
      '</defs>' +
      '<rect width="400" height="400" fill="' + (c.striped ? 'url(#stripe' + id + ')' : c.bg) + '"/>' +
      '<rect width="400" height="400" fill="url(#lit' + id + ')"/>' +
      scene(c) +
      '</svg>';
  }

  function stripePattern(id, c) {
    return '<pattern id="stripe' + id + '" width="36" height="36" patternUnits="userSpaceOnUse">' +
      '<rect width="36" height="36" fill="' + c.bg + '"/>' +
      '<rect width="18" height="36" fill="#E6DACA"/></pattern>';
  }

  /* A flat ground with no object on it, for section backdrops. */
  function ground(name, label) {
    var c = palette(name);
    var id = nextId();
    return '<svg class="art" viewBox="0 0 400 400" role="img" aria-label="' + escapeAttr(label || '') + '" ' +
      'preserveAspectRatio="xMidYMid slice"><defs>' +
      (c.striped ? stripePattern(id, c) : '') +
      '<radialGradient id="lit' + id + '" cx="50%" cy="55%" r="60%">' +
      '<stop offset="0%" stop-color="#ffffff" stop-opacity=".3"/>' +
      '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="400" height="400" fill="' + (c.striped ? 'url(#stripe' + id + ')' : c.bg) + '"/>' +
      '<rect width="400" height="400" fill="url(#lit' + id + ')"/></svg>';
  }

  function escapeAttr(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  global.SleepArt = { render: render, ground: ground, scenes: Object.keys(SCENES) };
})(typeof globalThis !== 'undefined' ? globalThis : this);
