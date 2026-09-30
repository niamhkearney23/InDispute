/* Sleep Shop — pricing and ribbon helpers.
   No DOM access here, so the same file runs under node in tests/.

   There is no cart: a real order is a pre-order, made off-site through a
   Stripe Payment Link (see assets/js/ui.js, preorderCta). What is left here
   is what the pages still need before that hand-off — the box's ribbon
   choice, which changes what the page shows, and money formatting, used
   wherever a price is printed. */
(function (global) {
  'use strict';

  var config = global.SLEEP_CONFIG || {};
  var box = global.SLEEP_BOX || {};

  function ribbons() {
    return (box.ribbons || []).map(function (r) { return r.label; });
  }

  function defaultRibbon() {
    return ribbons()[0] || null;
  }

  function money(value) {
    var n = Math.round(value * 100) / 100;
    var whole = n % 1 === 0;
    try {
      return new Intl.NumberFormat(config.locale || 'en-AU', {
        style: 'currency',
        currency: config.currency || 'AUD',
        minimumFractionDigits: whole ? 0 : 2,
        maximumFractionDigits: whole ? 0 : 2
      }).format(n);
    } catch (err) {
      return '$' + n.toFixed(whole ? 0 : 2);
    }
  }

  var Store = {
    ribbons: ribbons,
    defaultRibbon: defaultRibbon,
    money: money
  };

  global.SleepStore = Store;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Store;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
