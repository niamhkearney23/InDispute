/* ==========================================================================
   Lawgistics, Agreement Guide
   A scripted decision-tree chat that finds the right template. Client-side
   only: scenario chips, keyword matching on free text, and recommendation
   cards that deep-link into the document creator.
   ========================================================================== */

(function () {
  'use strict';

  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  var NODES = {
    start: {
      say: 'Hi! I\'m the Agreement Guide. Tell me about your situation and I\'ll point you at the right document, pick a scenario, or type it in your own words.',
      opts: [
        ['I\'m hiring someone', 'hire'],
        ['Sharing confidential info', 'nda'],
        ['A client owes me money', 'debt'],
        ['Doing work for a client', 'recServ'],
        ['Renting premises', 'recRent'],
        ['Website or online store', 'recWeb'],
        ['Book a free 10-min call', 'recCall']
      ]
    },
    hire: {
      say: 'Will they be an employee on payroll, or a freelancer / contractor?',
      opts: [['Employee', 'recEmp'], ['Freelancer / contractor', 'recFree']]
    },
    nda: {
      say: 'Will both sides be sharing information, or mainly just you disclosing?',
      opts: [['Both sides', 'recNdaM'], ['Just us disclosing', 'recNda1']]
    },
    debt: {
      say: 'Where are things up to with the debt?',
      opts: [
        ['Haven\'t sent a formal demand yet', 'recDemand'],
        ['Demand sent, still unpaid', 'recCourt'],
        ['We\'ve agreed to settle', 'recSettle']
      ]
    }
  };

  var RECS = {
    recEmp: { slugs: ['employment-contract', 'offer-letter'], note: 'Start with the Employment Contract; add the Offer Letter if you haven\'t sent one yet.' },
    recFree: { slugs: ['service-agreement'], note: 'A Service Agreement engages them for deliverables without triggering employee obligations. A dedicated Contractor Agreement is on the way.' },
    recNdaM: { slugs: ['nda-mutual'], note: 'Both sides will share, so you want mutual obligations.' },
    recNda1: { slugs: ['nda-one-way'], note: 'A one-way NDA keeps it simple when only you disclose.' },
    recDemand: { slugs: ['letter-of-demand'], note: 'A Letter of Demand is the cheapest formal step, it resolves a surprising number of debts on its own.' },
    recCourt: { slugs: ['court-pack-debt-recovery'], note: 'Time to escalate. The Court Pack interviews you like a lawyer would and drafts the full Magistrates Court filing set, writ, statement of claim, witness statement, chronology, and an indexed bundle of your documents.' },
    recSettle: { slugs: ['settlement-agreement'], note: 'Record the deal in full and final settlement before any money moves.' },
    recServ: { slugs: ['service-agreement'], note: 'Scope, payment terms, IP ownership, and a liability cap, the clauses that prevent disputes.' },
    recRent: { slugs: ['tenancy-agreement'], note: 'Covers deposit, renewal, and repair obligations clearly.' },
    recWeb: { slugs: ['website-terms', 'pdpa-privacy-notice'], note: 'The PDPA privacy notice is legally required; the terms protect you.' },
    recCall: { call: true }
  };

  var KEYWORDS = [
    [/freelanc|contractor/i, 'recFree'],
    [/hir|staff|employ|payroll/i, 'hire'],
    [/nda|confiden|secret|disclos/i, 'nda'],
    [/pay|owe|debt|invoice|money|unpaid/i, 'debt'],
    [/rent|tenan|premise|lease/i, 'recRent'],
    [/website|online|shop|store|e-?commerce|pdpa|privacy/i, 'recWeb'],
    [/shareholder|partner|co-?founder/i, 'recShare'],
    [/service|client|project|agency/i, 'recServ'],
    [/call|talk|speak|consult|help/i, 'recCall']
  ];
  RECS.recShare = { slugs: ['shareholders-agreement'], note: 'The document that answers what happens when the founders disagree.' };

  function init() {
    var mount = document.querySelector('[data-guide]');
    if (!mount) return;

    mount.innerHTML =
      /* The label is wrapped so narrow screens can collapse this to a circle.
         As a full-width pill it sat across the bottom of the phone viewport
         and covered whatever control was there, on the research library that
         was the last practice-area filter. aria-label keeps the button named
         once the visible text is hidden. */
      '<button class="guide-fab" type="button" data-guide-fab aria-label="Need help choosing?">' +
        '<svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 12.5a2 2 0 0 1-2 2H7l-4 3.5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>' +
        '<span class="guide-fab__label">Need help choosing?</span>' +
      '</button>' +
      '<div class="guide-panel" data-guide-panel role="dialog" aria-label="Agreement Guide">' +
        '<div class="guide-panel__head">' +
          '<span class="avatar">AG</span>' +
          '<div><strong>Agreement Guide</strong><span>Finds the right document in under a minute</span></div>' +
          '<button class="guide-panel__close" type="button" data-guide-close aria-label="Close">' +
            '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m5 5 10 10M15 5 5 15"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="guide-body" data-guide-body></div>' +
        '<form class="guide-input" data-guide-form>' +
          '<input class="input" type="text" placeholder="Describe what you need…" data-guide-text>' +
          '<button class="btn btn--primary btn--sm" type="submit">Send</button>' +
        '</form>' +
      '</div>';

    var panel = mount.querySelector('[data-guide-panel]');
    var body = mount.querySelector('[data-guide-body]');
    var started = false;

    function open() {
      panel.classList.add('is-open');
      if (!started) { started = true; goTo('start'); }
    }
    mount.querySelector('[data-guide-fab]').addEventListener('click', function () {
      if (panel.classList.contains('is-open')) panel.classList.remove('is-open');
      else open();
    });
    mount.querySelector('[data-guide-close]').addEventListener('click', function () {
      panel.classList.remove('is-open');
    });
    document.querySelectorAll('[data-guide-open]').forEach(function (b) {
      b.addEventListener('click', open);
    });

    function scroll() { body.scrollTop = body.scrollHeight; }

    function bot(html, asHtml) {
      setTimeout(function () {
        var el = document.createElement('div');
        el.className = 'g-msg g-msg--bot';
        if (asHtml) el.innerHTML = html; else el.textContent = html;
        body.appendChild(el);
        scroll();
      }, 320);
    }

    function user(text) {
      var el = document.createElement('div');
      el.className = 'g-msg g-msg--user';
      el.textContent = text;
      body.appendChild(el);
      scroll();
    }

    function chips(opts) {
      setTimeout(function () {
        var el = document.createElement('div');
        el.className = 'g-chips';
        el.innerHTML = opts.map(function (o) {
          return '<button type="button" data-go="' + esc(o[1]) + '">' + esc(o[0]) + '</button>';
        }).join('');
        el.addEventListener('click', function (e) {
          var b = e.target.closest('[data-go]');
          if (!b) return;
          user(b.textContent);
          el.remove();
          goTo(b.getAttribute('data-go'));
        });
        body.appendChild(el);
        scroll();
      }, 420);
    }

    function recCard(slug) {
      var tpl = Store.list('templates').filter(function (t) { return t.slug === slug; })[0];
      var title = tpl ? tpl.title : slug;
      var summary = tpl ? tpl.summary : '';
      var wired = window.LG_DOCS && window.LG_DOCS[slug];
      var href = tpl && tpl.href ? tpl.href : (wired ? 'create.html?template=' + slug : 'documents.html');
      var label = wired || (tpl && tpl.href) ? 'Create now' : 'View templates';
      setTimeout(function () {
        var el = document.createElement('div');
        el.className = 'g-rec';
        el.innerHTML = '<strong>' + esc(title) + '</strong><p>' + esc(summary) + '</p>' +
          '<a class="btn btn--primary btn--sm" href="' + esc(href) + '">' + label + '</a>';
        body.appendChild(el);
        scroll();
      }, 480);
    }

    function callCard() {
      setTimeout(function () {
        var el = document.createElement('div');
        el.className = 'g-rec';
        el.innerHTML = '<strong>Free 10-minute intake call</strong>' +
          '<p>A quick call with our client team to scope what you need. Anything that needs legal advice goes to our Malaysian lawyers, the call itself is guidance, not legal advice, and it costs nothing.</p>' +
          '<a class="btn btn--primary btn--sm" href="legalhelp.html#intake">Book the call</a>';
        body.appendChild(el);
        scroll();
      }, 480);
    }

    function goTo(key) {
      if (NODES[key]) {
        bot(NODES[key].say);
        chips(NODES[key].opts);
        return;
      }
      var rec = RECS[key];
      if (rec) {
        if (rec.call) {
          bot('Good call, sometimes ten minutes of conversation beats an hour of reading.');
          callCard();
        } else {
          bot(rec.note);
          rec.slugs.forEach(recCard);
        }
        chips([['Start over', 'start'], ['Book a free 10-min call', 'recCall']]);
        return;
      }
      bot('That one deserves a human. Our matching service will scope it properly, free, with a response inside 24 hours.');
      setTimeout(function () {
        var el = document.createElement('div');
        el.className = 'g-rec';
        el.innerHTML = '<strong>Get matched with a lawyer</strong>' +
          '<p>Tell us the situation and we\'ll put it in front of a qualified Malaysian lawyer.</p>' +
          '<a class="btn btn--primary btn--sm" href="legalhelp.html">Submit an enquiry</a>';
        body.appendChild(el);
        scroll();
      }, 480);
      chips([['Start over', 'start']]);
    }

    mount.querySelector('[data-guide-form]').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = mount.querySelector('[data-guide-text]');
      var text = input.value.trim();
      if (!text) return;
      user(text);
      input.value = '';
      var hit = null;
      for (var i = 0; i < KEYWORDS.length; i++) {
        if (KEYWORDS[i][0].test(text)) { hit = KEYWORDS[i][1]; break; }
      }
      goTo(hit || '__fallback__');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
