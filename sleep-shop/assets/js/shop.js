/* Shop page: the four pieces with prices. Adding to cart is handled by the
   shared [data-shop-add] handler in ui.js. */
(function (global) {
  'use strict';

  var doc = global.document;
  var UI = global.SleepUI;
  var PRODUCTS = global.SLEEP_PRODUCTS;

  function init() {
    var grid = doc.querySelector('[data-shop-grid]');
    if (grid) grid.innerHTML = PRODUCTS.map(UI.productCard).join('');
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
