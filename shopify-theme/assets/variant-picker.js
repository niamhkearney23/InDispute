/* Colour picker for the mask products.

   Dawn's own picker is built around option dropdowns and section rendering.
   Masks have one option and a handful of values, so a set of radios that
   swaps the variant id and the price is smaller, faster and does not need a
   round trip to the server on every change. */
(function () {
  'use strict';

  function money(cents, format) {
    var amount = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
    var withCommas = amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (format || '${{amount}}').replace(/\{\{\s*amount[^}]*\}\}/, withCommas);
  }

  function wire(root) {
    var data = root.querySelector('[data-variants]');
    if (!data) return;

    var variants;
    try {
      variants = JSON.parse(data.textContent);
    } catch (err) {
      return; /* Leave the form on its default variant rather than breaking it. */
    }

    var idField = root.querySelector('input[name="id"]');
    var priceOut = root.querySelector('[data-variant-price]');
    var button = root.querySelector('[data-atc]');
    var label = root.querySelector('[data-variant-label]');
    var format = root.getAttribute('data-money-format');

    function select(variant) {
      idField.value = variant.id;
      if (priceOut) priceOut.textContent = money(variant.price, format);
      if (label) label.textContent = variant.title;

      var instalment = root.querySelector('[data-instalment]');
      if (instalment) instalment.textContent = money(Math.round(variant.price / 4), format);

      if (button) {
        button.disabled = !variant.available;
        button.textContent = variant.available
          ? button.getAttribute('data-label-available') + ' ' + money(variant.price, format)
          : button.getAttribute('data-label-sold');
      }
    }

    root.addEventListener('change', function (event) {
      if (!event.target.matches('[name="variant-option"]')) return;
      var chosen = variants.filter(function (v) {
        return String(v.id) === event.target.value;
      })[0];
      if (chosen) select(chosen);
    });
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-variant-root]'), wire);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
