/* Home page: hero art, the nine-tile grid, the eight pieces, steps, occasions. */
(function (global) {
  'use strict';

  var doc = global.document;
  var UI = global.SleepUI;
  var Art = global.SleepArt;
  var BOX = global.SLEEP_BOX;
  var CONTENTS = global.SLEEP_CONTENTS;

  function fill(selector, html) {
    var el = doc.querySelector(selector);
    if (el) el.innerHTML = html;
  }

  /* The nine-tile rhythm from the brand plan: every third tile is type-led and
     no two tiles on the same ground touch. */
  var TILES = [
    { art: 'box-closed', ground: 'powder', label: 'The box, tied' },
    { type: 'cocoa', kind: 'script', text: 'Rest is the greatest gift', tag: 'The line' },
    { art: 'pillowcase', ground: 'cream', label: 'Silk, folded in thirds' },

    { type: 'stripe', kind: 'display', text: 'Eight pieces, one ritual', tag: 'The box' },
    { art: 'mask', ground: 'cocoa', label: 'Silk eye mask' },
    { type: 'oxblood', kind: 'script', text: 'Written by hand', tag: 'The card' },

    { art: 'socks', ground: 'oxblood', label: 'Merino bed socks' },
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
    fill('[data-pieces-grid]', CONTENTS.map(UI.pieceCard).join(''));
    fill('[data-card-art]', Art.render({ art: 'card', ground: 'cocoa', name: 'A card being written by hand' }));
    fill('[data-studio-art]', Art.render({ art: 'ribbon', ground: 'cream', name: 'A ribbon, loose' }));

    fill('[data-steps]', global.SLEEP_STEPS.map(function (step) {
      return '<li><strong>' + UI.escapeHtml(step.title) + '</strong>' +
        '<span>' + UI.escapeHtml(step.body) + '</span></li>';
    }).join(''));

    fill('[data-occasions]', global.SLEEP_OCCASIONS.map(function (item) {
      return '<div class="card"><h3>' + UI.escapeHtml(item.title) + '</h3>' +
        '<p class="muted small">' + UI.escapeHtml(item.body) + '</p></div>';
    }).join(''));

    signup();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
