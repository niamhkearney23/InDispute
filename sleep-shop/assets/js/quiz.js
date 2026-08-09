/* Fit quiz: four questions, then three ranked suggestions with the reasoning shown. */
(function (global) {
  'use strict';

  var doc = global.document;
  var UI = global.HushUI;
  var Store = global.HushStore;
  var PRODUCTS = global.HUSH_PRODUCTS;

  var QUESTIONS = [
    {
      key: 'position',
      title: 'How do you usually end up sleeping?',
      note: 'Not how you start — how you wake up.',
      options: [
        { tag: 'side', label: 'On my side', note: 'Needs height under the neck and give at the shoulder' },
        { tag: 'back', label: 'On my back', note: 'Wants support through the lower back' },
        { tag: 'front', label: 'On my front', note: 'Usually needs a flatter pillow than you think' },
        { tag: 'combo', label: 'All over the place', note: 'A responsive surface matters more than firmness' }
      ]
    },
    {
      key: 'problem',
      title: 'What gets in the way most?',
      note: 'Pick the one that costs you the most sleep.',
      options: [
        { tag: 'hot', label: 'I wake up hot', note: 'Usually a materials problem, not a mattress one' },
        { tag: 'aches', label: 'Aches — neck, shoulder or back', note: 'Often the pillow before the bed' },
        { tag: 'noise', label: 'Noise', note: 'Housemates, traffic, a partner who is up early' },
        { tag: 'light', label: 'Light', note: 'Streetlights, early sun, a bright hallway' },
        { tag: 'mind', label: 'A mind that will not stop', note: 'Routine and pressure help more than gear' }
      ]
    },
    {
      key: 'intent',
      title: 'What are you actually shopping for?',
      note: 'Be honest — "just looking" is a valid answer, pick the closest.',
      options: [
        { tag: 'mattress', label: 'A new mattress', note: 'The big one. 100 nights to change your mind' },
        { tag: 'pillow', label: 'A better pillow', note: 'The cheapest fix for most sleep complaints' },
        { tag: 'bedding', label: 'Sheets, duvet or blankets', note: 'Where temperature is usually won or lost' },
        { tag: 'comforts', label: 'Small things that help', note: 'Light, sound, scent, a mask' }
      ]
    },
    {
      key: 'budget',
      title: 'Roughly what do you want to spend?',
      note: 'We will not push you past it.',
      options: [
        { tag: 'under-150', label: 'Under $150', note: 'There is plenty that works down here' },
        { tag: 'to-500', label: 'Up to $500', note: 'Bedding, tech and the best pillows' },
        { tag: 'to-1500', label: 'Up to $1,500', note: 'Includes a mattress' },
        { tag: 'open', label: 'Whatever gets it right', note: 'We will still tell you if the cheap one is better' }
      ]
    }
  ];

  var INTENT_CATEGORIES = {
    mattress: ['mattresses'],
    pillow: ['pillows'],
    bedding: ['bedding', 'duvets-blankets'],
    comforts: ['sleep-tech', 'extras']
  };

  var BUDGET_CEILING = {
    'under-150': 150,
    'to-500': 500,
    'to-1500': 1500,
    open: Infinity
  };

  var REASONS = {
    side: 'suits side sleepers',
    back: 'holds the lower back',
    front: 'works for front sleepers',
    combo: 'responsive if you move a lot',
    hot: 'built to shed heat',
    aches: 'aimed at pressure and aches',
    noise: 'helps with noise',
    light: 'blocks light',
    mind: 'part of a wind-down',
    cold: 'adds warmth'
  };

  var step = 0;
  var answers = {};

  function host() {
    return doc.querySelector('[data-quiz]');
  }

  /* ------------------------------------------------------------- scoring */

  function answerTags() {
    return [answers.position, answers.problem].filter(Boolean);
  }

  function score(product) {
    var value = product.rating * 0.4;
    var tags = answerTags();
    var matched = (product.match || []).filter(function (tag) {
      return tags.indexOf(tag) !== -1;
    });
    value += matched.length * 2.5;

    var wanted = INTENT_CATEGORIES[answers.intent] || [];
    if (wanted.indexOf(product.category) !== -1) value += 3.5;

    var ceiling = BUDGET_CEILING[answers.budget] || Infinity;
    var price = Store.priceRange(product).min;
    if (price > ceiling) value -= 7;
    else if (price > ceiling * 0.75) value -= 0.5;

    if ((product.badges || []).length) value += 0.4;
    return { product: product, value: value, matched: matched };
  }

  function results() {
    return PRODUCTS.map(score)
      .sort(function (a, b) { return b.value - a.value; })
      .slice(0, 3);
  }

  function reasonFor(entry) {
    var parts = entry.matched.map(function (tag) { return REASONS[tag]; }).filter(Boolean);
    var wanted = INTENT_CATEGORIES[answers.intent] || [];
    if (wanted.indexOf(entry.product.category) !== -1) {
      parts.unshift('what you came for');
    }
    if (!parts.length) parts.push('a safe pick whatever else changes');
    var text = parts.join(', ');
    return text.charAt(0).toUpperCase() + text.slice(1) + '.';
  }

  /* ----------------------------------------------------------- rendering */

  function progress() {
    return '<div class="quiz__progress" aria-hidden="true">' +
      QUESTIONS.map(function (q, i) {
        return '<span class="' + (i <= step ? 'is-done' : '') + '"></span>';
      }).join('') +
    '</div>';
  }

  function renderQuestion() {
    var q = QUESTIONS[step];
    var chosen = answers[q.key];

    host().innerHTML =
      progress() +
      '<p class="eyebrow">Question ' + (step + 1) + ' of ' + QUESTIONS.length + '</p>' +
      '<h2 class="quiz__question">' + q.title + '</h2>' +
      '<p class="muted" style="margin-top:-1rem;margin-bottom:1.6rem">' + q.note + '</p>' +
      '<div class="choices" role="group" aria-label="' + q.title + '">' +
        q.options.map(function (opt, i) {
          return '<button class="choice" type="button" data-choice="' + opt.tag + '" aria-pressed="' +
            (chosen === opt.tag) + '">' +
            '<span class="choice__key" aria-hidden="true">' + 'ABCDE'[i] + '</span>' +
            '<span><strong>' + opt.label + '</strong><span>' + opt.note + '</span></span>' +
          '</button>';
        }).join('') +
      '</div>' +
      '<div class="quiz__nav">' +
        (step > 0
          ? '<button class="btn btn--ghost" type="button" data-back>Back</button>'
          : '<a class="btn btn--ghost" href="shop.html">Skip, just browse</a>') +
        '<button class="btn" type="button" data-next' + (chosen ? '' : ' disabled') + '>' +
          (step === QUESTIONS.length - 1 ? 'See my results' : 'Next') +
        '</button>' +
      '</div>';
  }

  function renderResults() {
    var picks = results();
    var cheapest = picks.slice().sort(function (a, b) {
      return Store.priceRange(a.product).min - Store.priceRange(b.product).min;
    })[0];

    host().innerHTML =
      '<div style="max-width:none">' +
        '<p class="eyebrow">Your results</p>' +
        '<h2>Three things, and why</h2>' +
        '<p class="lead">Based on: ' + describeAnswers() + '. If the cheapest one below sounds ' +
          'like it would do, start there — you can always come back.</p>' +
        '<div class="grid grid--3 quiz-picks" style="margin-top:2.5rem">' +
          picks.map(function (entry) {
            return '<div class="quiz-pick">' +
              UI.productCard(entry.product) +
              '<p class="small muted"><strong>Why:</strong> ' +
                reasonFor(entry) + '</p>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div class="card" style="margin-top:2.5rem">' +
          '<h3>Start small if you can</h3>' +
          '<p class="muted">Of these, <a href="product.html?id=' + cheapest.product.id + '">' +
            UI.escapeHtml(cheapest.product.name) + '</a> is the least expensive at ' +
            Store.money(Store.priceRange(cheapest.product).min) +
            '. A surprising number of sleep problems are solved by the cheapest item on the list, ' +
            'and we would rather you found that out now.</p>' +
          '<div class="cluster mt-2">' +
            '<button class="btn" type="button" data-restart>Start again</button>' +
            '<a class="btn btn--ghost" href="shop.html">Browse everything</a>' +
            '<a class="btn btn--quiet" href="contact.html">Ask a person instead</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function describeAnswers() {
    var q1 = optionLabel(0, answers.position);
    var q2 = optionLabel(1, answers.problem);
    var q3 = optionLabel(2, answers.intent);
    /* Keep the labels as written — lowercasing them mangles "I wake up hot". */
    return [q1, q2, q3].filter(Boolean).join(' · ');
  }

  function optionLabel(index, tag) {
    var found = QUESTIONS[index].options.filter(function (o) { return o.tag === tag; })[0];
    return found ? found.label : '';
  }

  /* -------------------------------------------------------------- events */

  function bind() {
    host().addEventListener('click', function (event) {
      var el = event.target.closest('[data-choice], [data-next], [data-back], [data-restart]');
      if (!el) return;

      if (el.hasAttribute('data-choice')) {
        answers[QUESTIONS[step].key] = el.getAttribute('data-choice');
        renderQuestion();
        /* Auto-advance feels good here — the questions are short. */
        if (step < QUESTIONS.length - 1) {
          global.setTimeout(function () {
            step += 1;
            renderQuestion();
          }, 220);
        }
        return;
      }
      if (el.hasAttribute('data-next')) {
        if (step === QUESTIONS.length - 1) return renderResults();
        step += 1;
        return renderQuestion();
      }
      if (el.hasAttribute('data-back')) {
        step = Math.max(0, step - 1);
        return renderQuestion();
      }
      if (el.hasAttribute('data-restart')) {
        step = 0;
        answers = {};
        return renderQuestion();
      }
    });

    /* A/B/C/D/E keys pick an answer without reaching for the mouse. */
    doc.addEventListener('keydown', function (event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      var tag = (event.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      var index = 'abcde'.indexOf(String(event.key).toLowerCase());
      if (index === -1) return;
      var buttons = host().querySelectorAll('[data-choice]');
      if (buttons[index]) buttons[index].click();
    });
  }

  function init() {
    bind();
    renderQuestion();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
