/* Live character counter for the printed gift card message.
   The limit is a physical one: the card is printed, so going over is not a
   soft warning. maxlength does the enforcing, this only reports. */
(function () {
  'use strict';

  function wire(field) {
    var limit = Number(field.getAttribute('maxlength')) || 250;
    var counter = document.getElementById(field.getAttribute('aria-describedby'));
    if (!counter) return;

    function update() {
      var used = field.value.length;
      var left = limit - used;
      counter.textContent = left === 1 ? '1 character left' : left + ' characters left';
      counter.setAttribute('data-state', left === 0 ? 'full' : left <= 25 ? 'close' : 'roomy');
    }

    field.addEventListener('input', update);
    update();
  }

  function init() {
    var fields = document.querySelectorAll('[data-gift-message]');
    Array.prototype.forEach.call(fields, wire);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
