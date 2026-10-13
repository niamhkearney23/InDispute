/* Home page: the art, what is inside the box, and the rail of pieces. All of
   it reads from data.js, so a renamed piece or a new price lands here too. */
(function (global) {
  'use strict';

  var doc = global.document;
  var UI = global.SleepUI;
  var Art = global.SleepArt;
  var Store = global.SleepStore;
  var BOX = global.SLEEP_BOX;
  var CONTENTS = global.SLEEP_BOX_CONTENTS();
  var PRODUCTS = global.SLEEP_PRODUCTS;
  var esc = UI.escapeHtml;
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 6l6 6-6 6"/></svg>';

  function fill(selector, html) {
    var el = doc.querySelector(selector);
    if (el) el.innerHTML = html;
  }

  function contents() {
    return CONTENTS.map(function (p) {
      return '<li><strong>' + esc(p.name) + '</strong><span>' + esc(p.material) + '</span></li>';
    }).join('') + (BOX.always || []).map(function (extra) {
      return '<li><strong>' + esc(extra.name) + '</strong><span>In every box</span></li>';
    }).join('');
  }

  function piece(p) {
    return '<article class="h-piece">' +
      '<div class="h-piece__art">' + Art.render(p) + '</div>' +
      '<div class="h-piece__copy">' +
        '<h3>' + esc(p.name) + '</h3>' +
        '<p>' + esc(p.material) + '</p>' +
        '<div class="h-piece__buy">' +
          '<span class="h-price-sm">' + Store.money(p.price) + '</span>' +
          '<a class="h-link" data-preorder="' + esc(p.id) + '" href="shop.html">Pre-order ' + ARROW + '</a>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function init() {
    fill('[data-hero-art]', Art.render(BOX, { ground: 'powder', label: BOX.name }));
    fill('[data-box-art]', Art.render({ art: 'box-open', ground: 'cream', name: 'The box, open, tissue folded back' }));
    fill('[data-box-list]', contents());
    fill('[data-pieces]', PRODUCTS.map(piece).join(''));
    fill('[data-ritual-art]', Art.render({ art: 'lamp', ground: 'cocoa', name: 'A bedside lamp, on, with a closed journal beneath it' }));
    /* The piece links were drawn after the shared chrome ran, so point them
       at Stripe now. */
    UI.wirePreorder(doc.querySelector('[data-pieces]'));
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
