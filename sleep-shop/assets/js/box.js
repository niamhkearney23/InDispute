/* The box page: ribbon, quantity, gift message, add to cart. */
(function (global) {
  'use strict';

  var doc = global.document;
  var UI = global.SleepUI;
  var Art = global.SleepArt;
  var Store = global.SleepStore;
  var BOX = global.SLEEP_BOX;
  var CONTENTS = global.SLEEP_BOX_CONTENTS();
  var LIMIT = global.SLEEP_CONFIG.giftMessageLimit;

  /* Three views of the same box: tied, open, and the card that goes in it.
     Declared in data.js so photo paths all live in one place. */
  var SHOTS = BOX.shots;

  var ribbon = Store.defaultRibbon();
  var qty = 1;
  var shot = 0;

  function fill(selector, html) {
    var el = doc.querySelector(selector);
    if (el) el.innerHTML = html;
  }

  function renderMedia() {
    /* The ribbon choice changes the ground of the main shot, so the page
       responds to the only decision there is to make. */
    var main = SHOTS[shot];
    var ground = shot === 0 ? UI.groundForRibbon(ribbon) : main.ground;
    fill('[data-main-art]', Art.render(
      { art: main.art, ground: ground, name: main.label, photo: main.photo }));

    fill('[data-thumbs]', SHOTS.map(function (s, i) {
      var g = i === 0 ? UI.groundForRibbon(ribbon) : s.ground;
      return '<button type="button" data-shot="' + i + '" aria-pressed="' + (i === shot) + '" ' +
        'aria-label="View ' + UI.escapeHtml(s.label) + '">' +
        Art.render({ art: s.art, ground: g, name: s.label, photo: s.photo }, { label: '' }) +
      '</button>';
    }).join(''));
  }

  function renderBuy() {
    var used = doc.querySelector('[data-message]') ? doc.querySelector('[data-message]').value : '';

    fill('[data-buy]',
      '<div class="field-group">' +
        '<span class="label">Ribbon</span>' +
        '<div class="ribbons">' +
          (BOX.ribbons || []).map(function (r) {
            return '<button type="button" data-ribbon-pick="' + UI.escapeHtml(r.label) + '" ' +
              'aria-pressed="' + (r.label === ribbon) + '">' +
              '<i style="background:' + r.swatch + '"></i>' + UI.escapeHtml(r.label) +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<div class="field-group msg-field">' +
        '<label class="label" for="gift-message">Your message, written by hand <span class="label--mark">optional</span></label>' +
        '<textarea id="gift-message" data-message maxlength="' + LIMIT + '" ' +
          'placeholder="Happy birthday. Go to bed early for once. — R"></textarea>' +
        '<span class="msg-count" data-message-count></span>' +
      '</div>' +

      '<div class="field-group">' +
        '<span class="label">Quantity</span>' +
        '<div class="qty">' +
          '<button type="button" data-qty-dec aria-label="Decrease quantity">&minus;</button>' +
          '<span data-qty>' + qty + '</span>' +
          '<button type="button" data-qty-inc aria-label="Increase quantity">+</button>' +
        '</div>' +
      '</div>' +

      '<div class="buy-row">' +
        '<button class="btn btn--lg" type="button" data-add>Add to cart &middot; ' +
          '<span data-total>' + Store.money(BOX.price * qty) + '</span></button>' +
        '<a class="btn btn--ghost btn--lg" href="gifting.html">How gifting works</a>' +
      '</div>' +
      '<p class="callout mt-1">Free delivery Australia-wide. Ordered before 2pm on a weekday, it ' +
        'leaves Melbourne the same afternoon.</p>');

    if (used) doc.querySelector('[data-message]').value = used;
    renderCount();
  }

  function renderCount() {
    var field = doc.querySelector('[data-message]');
    var out = doc.querySelector('[data-message-count]');
    if (!field || !out) return;
    var left = LIMIT - field.value.length;
    out.textContent = left + ' characters left';
    out.classList.toggle('is-full', left <= 0);
  }

  function renderStatic() {
    fill('[data-contents-list]',
      '<ul style="margin:0;padding-left:1.1rem">' +
        CONTENTS.map(function (piece) {
          return '<li style="margin-bottom:.4rem"><strong style="font-weight:400">' +
            UI.escapeHtml(piece.name) + '</strong> — ' + UI.escapeHtml(piece.material) + '</li>';
        }).join('') +
        (BOX.always || []).map(function (extra) {
          return '<li style="margin-bottom:.4rem"><strong style="font-weight:400">' +
            UI.escapeHtml(extra.name) + '</strong> — in every box</li>';
        }).join('') +
      '</ul>');

    fill('[data-specs]', Object.keys(BOX.specs).map(function (key) {
      return '<tr><th scope="row">' + UI.escapeHtml(key) + '</th><td>' +
        UI.escapeHtml(BOX.specs[key]) + '</td></tr>';
    }).join(''));

    fill('[data-box-pieces]', CONTENTS.map(UI.pieceCard).join(''));
  }

  function bind() {
    doc.addEventListener('click', function (event) {
      var el = event.target.closest('[data-ribbon-pick], [data-shot], [data-qty-inc], [data-qty-dec], [data-add]');
      if (!el) return;

      if (el.hasAttribute('data-ribbon-pick')) {
        ribbon = el.getAttribute('data-ribbon-pick');
        doc.querySelectorAll('[data-ribbon-pick]').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b.getAttribute('data-ribbon-pick') === ribbon));
        });
        return renderMedia();
      }
      if (el.hasAttribute('data-shot')) {
        shot = Number(el.getAttribute('data-shot'));
        return renderMedia();
      }
      if (el.hasAttribute('data-qty-inc') || el.hasAttribute('data-qty-dec')) {
        qty = el.hasAttribute('data-qty-inc') ? Math.min(20, qty + 1) : Math.max(1, qty - 1);
        doc.querySelector('[data-qty]').textContent = qty;
        doc.querySelector('[data-total]').textContent = Store.money(BOX.price * qty);
        return;
      }
      if (el.hasAttribute('data-add')) {
        var message = doc.querySelector('[data-message]').value;
        Store.add(BOX.id, ribbon, message, qty);
        UI.toast(qty > 1 ? qty + ' boxes added' : 'Box added to cart');
        UI.openCart();
        /* Reset the message so the next box does not inherit the last one's. */
        doc.querySelector('[data-message]').value = '';
        qty = 1;
        doc.querySelector('[data-qty]').textContent = qty;
        doc.querySelector('[data-total]').textContent = Store.money(BOX.price);
        renderCount();
      }
    });

    doc.addEventListener('input', function (event) {
      if (event.target.hasAttribute('data-message')) renderCount();
    });
  }

  function init() {
    renderMedia();
    renderBuy();
    renderStatic();
    bind();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
