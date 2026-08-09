/* Contact form: client-side validation and a demo confirmation. */
(function (global) {
  'use strict';

  var doc = global.document;

  var RULES = {
    name: function (v) { return v.length >= 2 || 'Please tell us your name.'; },
    email: function (v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'That email does not look right.';
    },
    message: function (v) {
      return v.length >= 12 || 'A sentence or two helps — what is going wrong?';
    }
  };

  function init() {
    var form = doc.querySelector('[data-contact]');
    if (!form) return;
    var status = doc.querySelector('[data-contact-status]');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
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

      if (!ok) {
        status.textContent = '';
        if (first) first.focus();
        return;
      }

      var name = form.elements.name.value.trim().split(' ')[0];
      status.style.color = 'var(--sage)';
      status.textContent = 'Thanks ' + name + ' — in a live shop this would be with us now, and ' +
        'answered the same day. Nothing was actually sent.';
      form.reset();
    });
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
