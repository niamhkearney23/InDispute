/* Gifting page: the steps come from data.js so they cannot drift from checkout. */
(function (global) {
  'use strict';

  var doc = global.document;
  var UI = global.SleepUI;
  var Art = global.SleepArt;

  function init() {
    var steps = doc.querySelector('[data-gift-steps]');
    if (steps) {
      steps.innerHTML = global.SLEEP_STEPS.map(function (step) {
        return '<li><strong>' + UI.escapeHtml(step.title) + '</strong>' +
          '<span>' + UI.escapeHtml(step.body) + '</span></li>';
      }).join('');
    }
    var art = doc.querySelector('[data-gift-card-art]');
    if (art) art.innerHTML = Art.render({ art: 'card', ground: 'powder', name: 'A card being written' });
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
