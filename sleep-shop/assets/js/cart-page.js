/* Cart page: editable line items, promo code, and a demo checkout. */
(function (global) {
  'use strict';

  var doc = global.document;
  var UI = global.HushUI;
  var Art = global.HushArt;
  var Store = global.HushStore;
  var CONFIG = global.HUSH_CONFIG;

  var promo = '';
  var promoMessage = '';
  var placed = null;

  function host() {
    return doc.querySelector('[data-cart-page]');
  }

  /* The page re-renders whenever the cart changes, which would otherwise wipe
     anything already typed into the checkout form. Carry it across by hand. */
  var FORM_FIELDS = ['name', 'email', 'address', 'suburb', 'state', 'postcode', 'notes'];
  var draft = {};

  function captureDraft() {
    var form = doc.querySelector('[data-checkout]');
    if (!form) return;
    FORM_FIELDS.forEach(function (key) {
      if (form.elements[key]) draft[key] = form.elements[key].value;
    });
  }

  function restoreDraft(focusId) {
    var form = doc.querySelector('[data-checkout]');
    if (form) {
      FORM_FIELDS.forEach(function (key) {
        if (form.elements[key] && draft[key] != null) form.elements[key].value = draft[key];
      });
    }
    if (focusId) {
      var again = doc.getElementById(focusId);
      if (again) again.focus();
    }
  }

  function render() {
    if (placed) return renderConfirmation();

    captureDraft();
    var active = doc.activeElement;
    var focusId = active && active.id && host().contains(active) ? active.id : null;

    var summary = Store.summary(promo);
    if (!summary.count) return renderEmpty();

    host().innerHTML =
      '<div class="cart-layout">' +
        '<div>' +
          '<h2 class="visually-hidden">Items in your cart</h2>' +
          '<div>' + summary.lines.map(row).join('') + '</div>' +
          checkoutForm() +
        '</div>' +
        '<aside class="cart-summary">' + summaryCard(summary) + '</aside>' +
      '</div>';

    restoreDraft(focusId);
  }

  function renderEmpty() {
    host().innerHTML =
      '<div class="empty" style="margin-block:3rem">' +
        '<p><strong>Your cart is empty.</strong></p>' +
        '<p class="small">Start with the fit quiz if you are not sure what you need.</p>' +
        '<div class="cluster" style="justify-content:center">' +
          '<a class="btn" href="shop.html">Browse the shop</a>' +
          '<a class="btn btn--ghost" href="quiz.html">Take the quiz</a>' +
        '</div>' +
      '</div>';
  }

  function row(line) {
    var p = line.product;
    return '<div class="line-item" style="grid-template-columns:110px minmax(0,1fr)">' +
      '<div class="line-item__media">' + Art.render(p, { label: '' }) + '</div>' +
      '<div>' +
        '<div class="line-item__title"><a href="product.html?id=' + p.id + '">' +
          UI.escapeHtml(p.name) + '</a></div>' +
        (line.variant ? '<div class="line-item__meta">' + UI.escapeHtml(line.variant) + '</div>' : '') +
        '<div class="line-item__meta">' + Store.money(line.unitPrice) + ' each</div>' +
        '<div class="line-item__row">' +
          '<div class="qty">' +
            '<button type="button" data-cart-dec data-id="' + p.id + '" data-variant="' +
              UI.escapeHtml(line.variant || '') + '" aria-label="Decrease quantity">−</button>' +
            '<span>' + line.qty + '</span>' +
            '<button type="button" data-cart-inc data-id="' + p.id + '" data-variant="' +
              UI.escapeHtml(line.variant || '') + '" aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<strong>' + Store.money(line.lineTotal) + '</strong>' +
        '</div>' +
        '<div class="line-item__row">' +
          '<button class="link-danger" type="button" data-cart-remove data-id="' + p.id +
            '" data-variant="' + UI.escapeHtml(line.variant || '') + '">Remove</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function summaryCard(summary) {
    var shipRow = summary.shipping
      ? Store.money(summary.shipping)
      : '<span style="color:var(--sage)">Free</span>';

    return '<div class="card">' +
      '<h2 style="font-size:1.3rem">Order summary</h2>' +
      '<div class="promo-row">' +
        '<label class="visually-hidden" for="promo">Promo code</label>' +
        '<input id="promo" type="text" placeholder="Promo code" value="' + UI.escapeHtml(promo) + '" data-promo-input>' +
        '<button class="btn btn--ghost" type="button" data-promo-apply>Apply</button>' +
      '</div>' +
      (promoMessage ? '<p class="small" data-promo-msg>' + promoMessage + '</p>' : '') +
      '<div class="totals">' +
        '<div><span>Subtotal</span><span>' + Store.money(summary.subtotal) + '</span></div>' +
        (summary.discount
          ? '<div><span>Discount (' + Math.round(summary.discountRate * 100) + '%)</span><span>−' +
            Store.money(summary.discount) + '</span></div>'
          : '') +
        '<div><span>Delivery</span><span>' + shipRow + '</span></div>' +
        '<div class="totals__grand"><span>Total</span><span>' + Store.money(summary.total) + '</span></div>' +
      '</div>' +
      (summary.freeShippingRemaining
        ? '<p class="small muted" style="margin-top:.8rem">Add ' +
          Store.money(summary.freeShippingRemaining) + ' for free delivery.</p>'
        : '') +
      '<button class="btn btn--block btn--lg" type="submit" form="checkout" style="margin-top:1.2rem">' +
        'Place order · ' + Store.money(summary.total) +
      '</button>' +
      '<p class="tiny muted center" style="margin-top:.8rem">No payment is taken. Try code ' +
        '<strong>SLEEPWELL</strong> for 10% off.</p>' +
    '</div>';
  }

  function checkoutForm() {
    return '<form class="card" id="checkout" style="margin-top:2rem" novalidate data-checkout>' +
      '<h2 style="font-size:1.3rem">Delivery details</h2>' +
      '<div class="form-grid form-grid--2">' +
        field('name', 'Full name', 'text', 'name') +
        field('email', 'Email', 'email', 'email') +
        field('address', 'Street address', 'text', 'street-address') +
        field('suburb', 'Suburb', 'text', 'address-level2') +
        selectField('state', 'State', ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']) +
        field('postcode', 'Postcode', 'text', 'postal-code') +
      '</div>' +
      '<div class="form-field" style="margin-top:1.1rem">' +
        '<label for="notes">Delivery notes <span class="hint">(optional)</span></label>' +
        '<textarea id="notes" name="notes" placeholder="Buzzer is broken — call on arrival. Second floor, no lift."></textarea>' +
      '</div>' +
      '<p class="callout" style="margin-top:1.2rem">Ordering a mattress? We will call to arrange a ' +
        'two-hour window and take your old one away at the same time.</p>' +
    '</form>';
  }

  function field(id, label, type, autocomplete) {
    return '<div class="form-field">' +
      '<label for="' + id + '">' + label + '</label>' +
      '<input id="' + id + '" name="' + id + '" type="' + type + '" autocomplete="' + autocomplete + '" required>' +
      '<p class="form-error" data-error-for="' + id + '"></p>' +
    '</div>';
  }

  function selectField(id, label, options) {
    return '<div class="form-field">' +
      '<label for="' + id + '">' + label + '</label>' +
      '<select id="' + id + '" name="' + id + '" required>' +
        '<option value="">Choose…</option>' +
        options.map(function (o) { return '<option>' + o + '</option>'; }).join('') +
      '</select>' +
      '<p class="form-error" data-error-for="' + id + '"></p>' +
    '</div>';
  }

  /* ---------------------------------------------------------- validation */

  var RULES = {
    name: function (v) { return v.length >= 2 || 'Please enter your name.'; },
    email: function (v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'That email does not look right.';
    },
    address: function (v) { return v.length >= 4 || 'Please enter a street address.'; },
    suburb: function (v) { return v.length >= 2 || 'Please enter a suburb.'; },
    state: function (v) { return !!v || 'Choose a state.'; },
    postcode: function (v) { return /^\d{4}$/.test(v) || 'Australian postcodes are four digits.'; }
  };

  function validate(form) {
    var ok = true;
    var first = null;
    Object.keys(RULES).forEach(function (key) {
      var input = form.elements[key];
      var result = RULES[key](String(input.value || '').trim());
      var slot = form.querySelector('[data-error-for="' + key + '"]');
      if (result === true) {
        slot.textContent = '';
        input.removeAttribute('aria-invalid');
      } else {
        slot.textContent = result;
        input.setAttribute('aria-invalid', 'true');
        ok = false;
        if (!first) first = input;
      }
    });
    if (first) first.focus();
    return ok;
  }

  /* -------------------------------------------------------- confirmation */

  function renderConfirmation() {
    var order = placed;
    host().innerHTML =
      '<div class="cart-layout">' +
        '<div class="card">' +
          '<p class="eyebrow">Order confirmed</p>' +
          '<h2>Thanks, ' + UI.escapeHtml(order.name.split(' ')[0]) + '.</h2>' +
          '<p class="lead">Your reference is <strong>' + order.reference + '</strong>. In a real shop ' +
            'a confirmation would now be on its way to ' + UI.escapeHtml(order.email) + '.</p>' +
          '<p class="muted">Nothing was charged and nothing will be shipped — this storefront is a ' +
            'demonstration. Your cart has been emptied so you can try the flow again.</p>' +
          '<table class="spec-table" style="margin-top:1.5rem"><tbody>' +
            order.lines.map(function (line) {
              return '<tr><th scope="row">' + UI.escapeHtml(line.name) +
                (line.variant ? ' <span class="muted">(' + UI.escapeHtml(line.variant) + ')</span>' : '') +
                ' × ' + line.qty + '</th><td>' + Store.money(line.total) + '</td></tr>';
            }).join('') +
            '<tr><th scope="row"><strong>Total paid</strong></th><td><strong>' +
              Store.money(order.total) + '</strong></td></tr>' +
          '</tbody></table>' +
          '<div class="cluster mt-2">' +
            '<a class="btn" href="shop.html">Keep browsing</a>' +
            '<a class="btn btn--ghost" href="guides.html">Read a sleep guide</a>' +
          '</div>' +
        '</div>' +
        '<aside class="cart-summary card">' +
          '<h3>What would happen next</h3>' +
          '<ol class="steps" style="margin-top:1rem">' +
            '<li><strong>Confirmation email</strong><span>Immediately, with your reference.</span></li>' +
            '<li><strong>A call about delivery</strong><span>Within one working day for anything large.</span></li>' +
            '<li><strong>Your 100 nights start</strong><span>From the day it arrives, not the day you order.</span></li>' +
          '</ol>' +
        '</aside>' +
      '</div>';
  }

  /* --------------------------------------------------------------- events */

  function bind() {
    host().addEventListener('click', function (event) {
      var el = event.target.closest('[data-promo-apply]');
      if (!el) return;
      var value = doc.querySelector('[data-promo-input]').value.trim();
      var rate = Store.promoRate(value);
      if (rate) {
        promo = value.toUpperCase();
        promoMessage = '<span style="color:var(--sage)">' + promo + ' applied — ' +
          Math.round(rate * 100) + '% off.</span>';
      } else {
        promo = '';
        promoMessage = '<span style="color:var(--danger)">That code is not recognised.</span>';
      }
      render();
    });

    host().addEventListener('submit', function (event) {
      var form = event.target.closest('[data-checkout]');
      if (!form) return;
      event.preventDefault();
      if (!validate(form)) return;

      var summary = Store.summary(promo);
      placed = {
        reference: 'HSH-' + String(Date.now()).slice(-6),
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        total: summary.total,
        lines: summary.lines.map(function (line) {
          return {
            name: line.product.name,
            variant: line.variant,
            qty: line.qty,
            total: line.lineTotal
          };
        })
      };
      Store.clear();
      promo = '';
      promoMessage = '';
      render();
      global.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* Quantity changes come through the shared cart handler in ui.js. */
    Store.subscribe(function () {
      if (!placed) render();
    });
  }

  function init() {
    bind();
    render();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
