/* Cart page: editable boxes and messages, delivery choice, and a demo checkout. */
(function (global) {
  'use strict';

  var doc = global.document;
  var UI = global.SleepUI;
  var Art = global.SleepArt;
  var Store = global.SleepStore;
  var CONFIG = global.SLEEP_CONFIG;
  var BOX = global.SLEEP_BOX;

  var promo = '';
  var promoMessage = '';
  var express = false;
  var editing = null; /* key of the line whose message is open for editing */
  var placed = null;

  function host() {
    return doc.querySelector('[data-cart-page]');
  }

  function keyOf(line) {
    return line.ribbon + '|' + line.message;
  }

  /* The page re-renders whenever the cart changes, which would otherwise wipe
     anything already typed into the checkout form. Carry it across by hand. */
  var FORM_FIELDS = ['name', 'email', 'recipient', 'address', 'suburb', 'state', 'postcode', 'notes'];
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

  /* ----------------------------------------------------------- rendering */

  function render() {
    if (placed) return renderConfirmation();

    captureDraft();
    var active = doc.activeElement;
    var focusId = active && active.id && host().contains(active) ? active.id : null;

    var summary = Store.summary({ promo: promo, express: express });
    if (!summary.count) return renderEmpty();

    host().innerHTML =
      '<div class="cart-layout">' +
        '<div>' +
          '<h2 class="visually-hidden">Boxes in your cart</h2>' +
          '<div>' + summary.lines.map(row).join('') + '</div>' +
          deliveryBlock() +
          checkoutForm() +
        '</div>' +
        '<aside class="cart-summary">' + summaryCard(summary) + '</aside>' +
      '</div>';

    restoreDraft(focusId);
  }

  function renderEmpty() {
    host().innerHTML =
      '<div class="empty" style="margin-block:3rem">' +
        '<p class="script" style="font-size:1.5rem">Nothing in the cart</p>' +
        '<p class="small">One box, eight pieces, ' + Store.money(BOX.price) + '.</p>' +
        '<div class="cluster" style="justify-content:center">' +
          '<a class="btn" href="box.html">See the box</a>' +
          '<a class="btn btn--ghost" href="inside.html">What is inside</a>' +
        '</div>' +
      '</div>';
  }

  function row(line) {
    var key = keyOf(line);
    var attrs = 'data-ribbon="' + UI.escapeHtml(line.ribbon) + '" data-message="' +
      UI.escapeHtml(line.message) + '"';
    var open = editing === key;

    return '<div class="line-item" style="grid-template-columns:110px minmax(0,1fr)">' +
      '<div class="line-item__media">' +
        Art.render(BOX, { ground: UI.groundForRibbon(line.ribbon), label: '' }) +
      '</div>' +
      '<div>' +
        '<div class="line-item__title">' + UI.escapeHtml(BOX.name) + '</div>' +
        '<div class="line-item__meta">' + UI.escapeHtml(line.ribbon) + ' ribbon &middot; ' +
          Store.money(line.unitPrice) + ' each</div>' +

        (open ? messageEditor(line, attrs) : messageView(line, attrs)) +

        '<div class="line-item__row">' +
          '<div class="qty">' +
            '<button type="button" data-cart-dec ' + attrs + ' aria-label="Decrease quantity">&minus;</button>' +
            '<span>' + line.qty + '</span>' +
            '<button type="button" data-cart-inc ' + attrs + ' aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<strong>' + Store.money(line.lineTotal) + '</strong>' +
        '</div>' +
        '<div class="line-item__row">' +
          '<button class="link-quiet" type="button" data-cart-remove ' + attrs + '>Remove</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function messageView(line, attrs) {
    if (line.message) {
      return '<p class="written">' + UI.escapeHtml(line.message) + '</p>' +
        '<button class="link-quiet" type="button" data-edit-message ' + attrs + '>Edit message</button>';
    }
    return '<p class="small muted" style="margin-top:.4rem">No card message on this box.</p>' +
      '<button class="link-quiet" type="button" data-edit-message ' + attrs + '>Add a message</button>';
  }

  function messageEditor(line, attrs) {
    return '<div class="msg-field" style="margin-top:.6rem">' +
      '<label class="label" for="edit-msg">Written by hand on the card</label>' +
      '<textarea id="edit-msg" data-message-input maxlength="' + CONFIG.giftMessageLimit + '">' +
        UI.escapeHtml(line.message) + '</textarea>' +
      '<div class="cluster">' +
        '<button class="btn" type="button" data-save-message ' + attrs + '>Save message</button>' +
        '<button class="link-quiet" type="button" data-cancel-message>Cancel</button>' +
      '</div>' +
    '</div>';
  }

  function deliveryBlock() {
    return '<div class="card mt-2">' +
      '<p class="eyebrow">Delivery</p>' +
      '<div class="choice-row">' +
        '<label><input type="radio" name="shipping" value="standard" data-ship="standard"' +
          (express ? '' : ' checked') + '>' +
          '<span><strong>Standard, free</strong>' +
          'Two to four working days to metro, up to eight regional.</span></label>' +
        '<label><input type="radio" name="shipping" value="express" data-ship="express"' +
          (express ? ' checked' : '') + '>' +
          '<span><strong>Express, ' + Store.money(CONFIG.expressFee) + '</strong>' +
          'Next working day to most metro addresses if ordered before 2pm.</span></label>' +
      '</div>' +
    '</div>';
  }

  function summaryCard(summary) {
    return '<div class="card">' +
      '<p class="eyebrow">Order summary</p>' +
      '<h2 class="mt-0" style="font-size:1.3rem">' +
        summary.count + (summary.count === 1 ? ' box' : ' boxes') + '</h2>' +
      '<div class="promo-row">' +
        '<label class="visually-hidden" for="promo">Promo code</label>' +
        '<input id="promo" type="text" placeholder="Promo code" value="' +
          UI.escapeHtml(promo) + '" data-promo-input>' +
        '<button class="btn btn--ghost" type="button" data-promo-apply>Apply</button>' +
      '</div>' +
      (promoMessage ? '<p class="small" data-promo-msg>' + promoMessage + '</p>' : '') +
      '<div class="totals">' +
        '<div><span>Subtotal</span><span>' + Store.money(summary.subtotal) + '</span></div>' +
        (summary.discount
          ? '<div><span>Discount (' + Math.round(summary.discountRate * 100) + '%)</span><span>&minus;' +
            Store.money(summary.discount) + '</span></div>'
          : '') +
        '<div><span>Delivery</span><span>' +
          (summary.shipping ? Store.money(summary.shipping) : 'Free') + '</span></div>' +
        '<div class="totals__grand"><span>Total</span><span>' + Store.money(summary.total) + '</span></div>' +
      '</div>' +
      '<p class="small muted mt-1">' +
        (summary.written
          ? summary.written + ' of ' + summary.lines.length +
            (summary.lines.length === 1 ? ' box has' : ' boxes have') + ' a handwritten card.'
          : 'No card messages yet — you can add one to any box above.') +
      '</p>' +
      '<button class="btn btn--block btn--lg mt-1" type="submit" form="checkout">Place order</button>' +
      '<p class="tiny muted center mt-1">No payment is taken.</p>' +
    '</div>';
  }

  function checkoutForm() {
    return '<form class="card mt-2" id="checkout" novalidate data-checkout>' +
      '<p class="eyebrow">Where is it going?</p>' +
      '<h2 class="mt-0" style="font-size:1.3rem">Delivery details</h2>' +
      '<p class="small muted">Send it straight to them — there is no invoice in the box and no ' +
        'pricing on the outside.</p>' +
      '<div class="form-grid form-grid--2 mt-1">' +
        field('name', 'Your name', 'text', 'name') +
        field('email', 'Your email', 'email', 'email') +
        field('recipient', 'Sending it to', 'text', 'off') +
        field('address', 'Street address', 'text', 'street-address') +
        field('suburb', 'Suburb', 'text', 'address-level2') +
        selectField('state', 'State', ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']) +
        field('postcode', 'Postcode', 'text', 'postal-code') +
      '</div>' +
      '<div class="form-field mt-1">' +
        '<label for="notes">Delivery notes <span class="hint">(optional)</span></label>' +
        '<textarea id="notes" name="notes" placeholder="Leave in the porch, out of the sun. No buzzer."></textarea>' +
      '</div>' +
      '<p class="callout mt-1">The message on the card is set per box, above. This is where the ' +
        'parcel goes.</p>' +
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
    recipient: function (v) { return v.length >= 2 || 'Who is it going to?'; },
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
          '<h2>Thank you, ' + UI.escapeHtml(order.name.split(' ')[0]) + '.</h2>' +
          '<p class="lede">Your reference is <strong>' + order.reference + '</strong>. In a real ' +
            'shop a confirmation would now be on its way to ' + UI.escapeHtml(order.email) + '.</p>' +
          '<p class="muted small">Nothing was charged and nothing will be shipped — this storefront ' +
            'is a demonstration. Your cart has been emptied so you can try the flow again.</p>' +
          '<table class="spec-table mt-2"><tbody>' +
            order.lines.map(function (line) {
              return '<tr><th scope="row">' + line.qty + ' × ' + UI.escapeHtml(BOX.name) +
                '<br><span class="tiny">' + UI.escapeHtml(line.ribbon) + ' ribbon</span></th>' +
                '<td>' + Store.money(line.total) +
                (line.message
                  ? '<p class="written" style="margin-top:.5rem">' + UI.escapeHtml(line.message) + '</p>'
                  : '') +
                '</td></tr>';
            }).join('') +
            '<tr><th scope="row">Total</th><td>' + Store.money(order.total) + '</td></tr>' +
          '</tbody></table>' +
          '<div class="cluster mt-2">' +
            '<a class="btn" href="index.html">Back to the shop</a>' +
            '<a class="btn btn--ghost" href="inside.html">What is inside</a>' +
          '</div>' +
        '</div>' +
        '<aside class="cart-summary card">' +
          '<p class="eyebrow">What happens next</p>' +
          '<ol class="steps mt-1">' +
            '<li><strong>We write the card</strong><span>By hand, before anything goes in the box.</span></li>' +
            '<li><strong>It is packed and tied</strong><span>On the bench in Fitzroy, usually the same day.</span></li>' +
            '<li><strong>It goes to ' + UI.escapeHtml(order.recipient) + '</strong>' +
              '<span>' + (order.express ? 'Express' : 'Standard') + ' delivery, tracking by email.</span></li>' +
          '</ol>' +
        '</aside>' +
      '</div>';
  }

  /* --------------------------------------------------------------- events */

  function bind() {
    host().addEventListener('click', function (event) {
      var el = event.target.closest('[data-promo-apply], [data-edit-message], ' +
        '[data-save-message], [data-cancel-message]');
      if (!el) return;

      if (el.hasAttribute('data-promo-apply')) {
        var value = doc.querySelector('[data-promo-input]').value.trim();
        var rate = Store.promoRate(value);
        if (rate) {
          promo = value.toUpperCase();
          promoMessage = '<span style="color:var(--ink)">' + promo + ' applied — ' +
            Math.round(rate * 100) + '% off.</span>';
        } else {
          promo = '';
          promoMessage = '<span style="color:var(--oxblood)">That code is not recognised.</span>';
        }
        return render();
      }

      if (el.hasAttribute('data-edit-message')) {
        editing = el.getAttribute('data-ribbon') + '|' + (el.getAttribute('data-message') || '');
        render();
        var field = doc.querySelector('[data-message-input]');
        if (field) field.focus();
        return;
      }

      if (el.hasAttribute('data-cancel-message')) {
        editing = null;
        return render();
      }

      if (el.hasAttribute('data-save-message')) {
        var next = doc.querySelector('[data-message-input]').value;
        editing = null;
        Store.setMessage(el.getAttribute('data-ribbon'), el.getAttribute('data-message') || '', next);
        UI.toast('Message saved');
        return;
      }
    });

    host().addEventListener('change', function (event) {
      if (!event.target.hasAttribute('data-ship')) return;
      express = event.target.getAttribute('data-ship') === 'express';
      render();
    });

    host().addEventListener('submit', function (event) {
      var form = event.target.closest('[data-checkout]');
      if (!form) return;
      event.preventDefault();
      if (!validate(form)) return;

      var summary = Store.summary({ promo: promo, express: express });
      placed = {
        reference: 'SS-' + String(Date.now()).slice(-6),
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        recipient: form.elements.recipient.value.trim(),
        express: summary.express,
        total: summary.total,
        lines: summary.lines.map(function (line) {
          return {
            ribbon: line.ribbon,
            message: line.message,
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
