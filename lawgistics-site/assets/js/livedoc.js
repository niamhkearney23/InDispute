/* ==========================================================================
   Lawgistics — the hero document fills itself in
   The headline promises "you just fill it in", so the hero performs it:
   a real Malaysian clause with the blanks typed in, one at a time, then the
   page turns to the next document. Pauses when off-screen or on a hidden tab,
   and shows a completed document outright when reduced motion is requested.
   ========================================================================== */

(function () {
  'use strict';

  var DOCS = [
    {
      title: 'Employment Contract',
      tag: 'Employment &amp; HR',
      // Text between the slots; slots[i] sits after parts[i].
      parts: [
        'This Agreement is made on ',
        ' between ',
        ' (the Company) and ',
        ' (the Employee), who is appointed as ',
        ' at a salary of ',
        ' per month, subject to EPF, SOCSO and EIS.'
      ],
      slots: ['1 September 2026', 'Harbour Cafe Sdn Bhd', 'Aina Zulkifli', 'Cafe Manager', 'RM 4,200']
    },
    {
      title: 'Letter of Demand',
      tag: 'Debt recovery',
      parts: [
        'We act for ',
        '. The sum of ',
        ' remains due from you in respect of ',
        '. TAKE NOTICE that payment in full is demanded within ',
        ' of this letter, failing which we shall commence proceedings without further reference to you.'
      ],
      slots: ['Nair Digital Sdn Bhd', 'RM 12,500.00', 'invoices INV-1041 and INV-1052', '14 days']
    },
    {
      title: 'Tenancy Agreement',
      tag: 'Property',
      parts: [
        'The Landlord lets and the Tenant takes the premises at ',
        ' for a term of ',
        ' commencing ',
        ', at a rent of ',
        ' per month, with a security deposit of ',
        '.'
      ],
      slots: ['12 Jalan Bangsar, Kuala Lumpur', '12 months', '1 October 2026', 'RM 6,500', 'RM 13,000']
    }
  ];

  var TYPE_MS = 34;        // per character
  var BETWEEN_SLOTS = 260; // pause before the next blank
  var HOLD_MS = 2600;      // how long a finished document rests
  var TURN_MS = 460;       // fade between documents

  function init() {
    var card = document.querySelector('[data-livedoc]');
    if (!card) return;

    var titleEl = card.querySelector('[data-ld-title]');
    var tagEl = card.querySelector('[data-ld-tag]');
    var bodyEl = card.querySelector('[data-ld-body]');
    var footEl = card.querySelector('[data-ld-foot]');

    var reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var i = 0;          // which document
    var timers = [];
    var running = false;
    var started = false;
    var visible = true;

    function clearTimers() {
      timers.forEach(clearTimeout);
      timers = [];
    }
    function wait(ms) {
      return new Promise(function (resolve) { timers.push(setTimeout(resolve, ms)); });
    }

    /* Lay the document out with empty blanks. */
    function layout(doc, filled) {
      titleEl.textContent = doc.title;
      tagEl.innerHTML = doc.tag;
      bodyEl.innerHTML = '';
      doc.parts.forEach(function (part, n) {
        bodyEl.appendChild(document.createTextNode(part));
        if (n < doc.slots.length) {
          var slot = document.createElement('span');
          slot.className = 'ld-slot' + (filled ? ' is-done' : '');
          slot.textContent = filled ? doc.slots[n] : '';
          slot.setAttribute('data-slot', String(n));
          bodyEl.appendChild(slot);
        }
      });
      footEl.classList.toggle('is-on', !!filled);
    }

    function typeInto(slot, text) {
      return new Promise(function (resolve) {
        slot.classList.add('is-active');
        var caret = document.createElement('span');
        caret.className = 'ld-caret';
        slot.appendChild(caret);

        var n = 0;
        (function step() {
          if (!running) return resolve();
          if (n >= text.length) {
            caret.remove();
            slot.classList.remove('is-active');
            slot.classList.add('is-done');
            return resolve();
          }
          caret.insertAdjacentText('beforebegin', text.charAt(n));
          n += 1;
          timers.push(setTimeout(step, TYPE_MS));
        })();
      });
    }

    async function playOne(doc) {
      layout(doc, false);   // clear the blanks, then fill them in
      await wait(520);
      for (var n = 0; n < doc.slots.length; n++) {
        if (!running) return;
        var slot = bodyEl.querySelector('[data-slot="' + n + '"]');
        await typeInto(slot, doc.slots[n]);
        await wait(BETWEEN_SLOTS);
      }
      if (!running) return;
      footEl.classList.add('is-on');
      await wait(HOLD_MS);
    }

    async function loop() {
      while (running) {
        await playOne(DOCS[i]);
        if (!running) return;
        card.classList.add('is-turning');
        await wait(TURN_MS);
        i = (i + 1) % DOCS.length;
        card.classList.remove('is-turning');
      }
    }

    function start() {
      if (running || reduced) return;
      running = true;
      started = true;
      loop();
    }
    function stop() {
      running = false;
      clearTimers();
    }

    // Reduced motion, or no support: show a finished document and stop there.
    if (reduced) {
      layout(DOCS[0], true);
      return;
    }

    // Default to a FINISHED document. If the animation never runs — no
    // IntersectionObserver, a background tab, a JS failure — the hero still
    // reads as a completed contract rather than a page of empty blanks.
    layout(DOCS[0], true);

    // Only animate while the card is on screen and the tab is active.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !document.hidden) start(); else stop();
      }, { threshold: 0.25 }).observe(card);
      // Safety net: if the observer never reports back (some embedded and
      // headless contexts never do), start anyway rather than sit idle.
      setTimeout(function () { if (!started && !document.hidden) start(); }, 1200);
    } else {
      start();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (visible) start();
    });
  }

  window.LG_LIVEDOC_DOCS = DOCS;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
