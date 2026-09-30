/* Shop page: the four pieces, each with a price and a pre-order link. */
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
