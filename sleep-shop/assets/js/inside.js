/* The "what is inside" page: one section per piece, alternating sides. */
(function (global) {
  'use strict';

  var doc = global.document;
  var UI = global.SleepUI;
  var Art = global.SleepArt;
  var CONTENTS = global.SLEEP_BOX_CONTENTS();

  function section(piece, index) {
    var art = '<div class="split__art">' + Art.render(piece) + '</div>';
    var copy = '<div class="prose measure">' +
      '<p class="eyebrow">' + String(index + 1).padStart(2, '0') + ' / ' +
        UI.escapeHtml(piece.material) + '</p>' +
      '<h2 class="mt-0" style="color:var(--ink)">' + UI.escapeHtml(piece.name) + '</h2>' +
      '<p>' + UI.escapeHtml(piece.blurb) + '</p>' +
      '<p>' + UI.escapeHtml(piece.detail) + '</p>' +
    '</div>';

    return '<section class="section' + (index % 2 ? ' section--alt' : '') + '">' +
      '<div class="wrap split">' + (index % 2 ? art + copy : copy + art) + '</div>' +
    '</section>';
  }

  function init() {
    var host = doc.querySelector('[data-pieces-detail]');
    if (host) host.innerHTML = CONTENTS.map(section).join('');
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
