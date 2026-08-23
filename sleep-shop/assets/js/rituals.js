/* Rituals page: the articles are written in the HTML, where words belong.
   This only fills the "shop this ritual" rows from the catalogue, so a price
   change never has to touch an article. */
(function (global) {
  'use strict';

  var doc = global.document;
  var UI = global.SleepUI;
  var find = global.SLEEP_FIND;

  function init() {
    doc.querySelectorAll('[data-ritual-shop]').forEach(function (row) {
      var products = row.getAttribute('data-ritual-shop').split(',')
        .map(function (id) { return find(id.trim()); })
        .filter(Boolean);
      row.innerHTML = products.map(UI.productCard).join('');
    });
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
