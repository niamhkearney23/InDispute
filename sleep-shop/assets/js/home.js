/* Home page: hero art, the nine-tile grid, the bedside grid, the ritual art. */
(function (global) {
  'use strict';

  var doc = global.document;
  var UI = global.SleepUI;
  var Art = global.SleepArt;
  var BOX = global.SLEEP_BOX;
  var PRODUCTS = global.SLEEP_PRODUCTS;

  function fill(selector, html) {
    var el = doc.querySelector(selector);
    if (el) el.innerHTML = html;
  }

  /* The nine-tile rhythm from the brand plan: every third tile is type-led and
     no two tiles on the same ground touch. */
  var TILES = [
    { art: 'box-closed', ground: 'powder', label: 'The box, tied' },
    { type: 'cocoa', kind: 'script', text: 'Give the gift of sleep', tag: 'The line' },
    { art: 'pillowcase', ground: 'cream', label: 'Silk, folded in thirds' },

    { type: 'stripe', kind: 'display', text: 'Instead of flowers', tag: 'The box' },
    { art: 'mask', ground: 'cocoa', label: 'Silk sleep mask' },
    { type: 'rose', kind: 'script', text: 'Written by hand', tag: 'The card' },

    { art: 'wrap', ground: 'rose', label: 'Lavender sleep wrap' },
    { type: 'powder', kind: 'display', text: 'Packed in Melbourne', tag: 'The studio' },
    { art: 'box-open', ground: 'cream', label: 'Lid off, tissue open' }
  ];

  function tile(spec) {
    if (spec.art) {
      return Art.render({ art: spec.art, ground: spec.ground, name: spec.label });
    }
    var body = spec.kind === 'script'
      ? '<span class="script">' + UI.escapeHtml(spec.text) + '</span>'
      : '<b>' + UI.escapeHtml(spec.text) + '</b>';
    return '<div class="tile-type t-' + spec.type + '">' +
      '<u>' + UI.escapeHtml(spec.tag) + '</u>' + body +
    '</div>';
  }

  function signup() {
    var form = doc.querySelector('[data-signup]');
    var msg = doc.querySelector('[data-signup-msg]');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var value = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        msg.style.color = '';
        msg.textContent = 'That email does not look right — check it and try again.';
        input.focus();
        return;
      }
      msg.style.color = 'var(--ink-soft)';
      msg.textContent = 'Thank you. Nothing is actually sent — this storefront is a demonstration.';
      form.reset();
    });
  }

  function init() {
    fill('[data-hero-art]', Art.render(BOX, { ground: 'powder', label: BOX.name }));
    fill('[data-tile-grid]', TILES.map(tile).join(''));
    fill('[data-box-art]', Art.render({ art: 'box-open', ground: 'cream', name: 'The box, open, tissue folded back' }));
    fill('[data-products-grid]', PRODUCTS.map(UI.productCard).join(''));
    fill('[data-ritual-art]', Art.render({ art: 'lamp', ground: 'powder', name: 'A bedside lamp, on, with a closed journal beneath it' }));
    signup();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
