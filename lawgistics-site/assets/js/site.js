/* ==========================================================================
   Lawgistics, public site behaviour
   Header/footer injection, nav, reveal-on-scroll, accordions, and the forms
   that write into the same store the admin reads from.
   ========================================================================== */

(function () {
  'use strict';

  var ICON = {
    check: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 4.5 6 12 2.5 8.5"/></svg>',
    shield: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2 3.5 4.6v4.9c0 3.9 2.7 7.4 6.5 8.5 3.8-1.1 6.5-4.6 6.5-8.5V4.6z"/><path d="m7.4 10 1.8 1.8 3.4-3.6"/></svg>',
    lock: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8.5" width="12" height="8.5" rx="2"/><path d="M6.8 8.5V6a3.2 3.2 0 1 1 6.4 0v2.5"/></svg>',
    star: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m10 2.6 2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L2.5 8.1l5.2-.8z"/></svg>',
    arrow: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 7h9M8 3.5 11.5 7 8 10.5"/></svg>',
    plus: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 3.5v11M3.5 9h11"/></svg>',
    menu: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };
  window.LG_ICON = ICON;

  var NAV = [
    { href: 'documents.html', label: 'Templates' },
    { href: 'legalhelp.html', label: 'Find a lawyer' },
    { href: 'court-updates.html', label: 'Court Updates' },
    { href: 'for-businesses.html', label: 'For business' },
  { href: 'for-lawyers.html', label: 'For lawyers' },
    { href: 'for-students.html', label: 'For students' }
  ];

  var here = location.pathname.split('/').pop() || 'index.html';

  /* -------------------------------------------------------------- chrome -- */

  function buildHeader() {
    var host = document.querySelector('[data-header]');
    if (!host) return;

    var links = NAV.map(function (n) {
      var cur = n.href === here ? ' aria-current="page"' : '';
      return '<a href="' + n.href + '"' + cur + '>' + n.label + '</a>';
    }).join('');

    var sess = null;
    try { sess = window.Store && Store.session ? Store.session() : null; } catch (e) {}
    var acctHtml;
    if (sess) {
      var initials = String(sess.name || sess.email).split(/[\s@.]+/).filter(Boolean)
        .map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
      var dest = (sess.role === 'admin' || sess.role === 'editor') ? 'admin/' : 'dashboard.html';
      acctHtml =
        '<a class="account-chip js-mobile-keep" href="' + dest + '" title="' + esc(sess.email || '') + '">' +
          '<span class="account-chip__avatar">' + esc(initials) + '</span>' +
          '<span class="account-chip__name">' + esc(sess.name || 'Account') + '</span>' +
        '</a>';
    } else {
      acctHtml =
        '<a class="btn btn--ghost btn--sm" href="login.html">Sign in</a>' +
        '<a class="btn btn--primary btn--sm js-mobile-keep" href="documents.html">Get started</a>';
    }

    // Beta notice, site wide. Nothing is charged yet, so every price on the
    // site has to be read in that light.
    if (!document.querySelector('.beta-bar')) {
      var bar = document.createElement('div');
      bar.className = 'beta-bar';
      bar.innerHTML = '<div class="wrap"><span><b>Lawgistics is in beta.</b> ' +
        'Everything on the site is free while we are testing.</span></div>';
      host.parentNode.insertBefore(bar, host);
    }

    host.className = 'site-header';
    host.innerHTML =
      '<div class="wrap">' +
        '<a class="brand" href="index.html">Lawgistics<span class="dot"></span></a>' +
        '<nav class="nav" id="site-nav">' + links + '</nav>' +
        '<div class="header-actions">' + acctHtml +
          '<button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-nav">' + ICON.menu + '</button>' +
        '</div>' +
      '</div>';

    var toggle = host.querySelector('.nav-toggle');
    var nav = host.querySelector('.nav');
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      toggle.innerHTML = open ? ICON.close : ICON.menu;
    });

    var onScroll = function () { host.classList.toggle('is-stuck', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function buildFooter() {
    var host = document.querySelector('[data-footer]');
    if (!host) return;

    // The footer carries the whole ecosystem, grouped by who it is for, so the
    // homepage above it does not have to. Every href points at a page that
    // exists; where a product has no page yet it routes to its audience hub.
    var COLUMNS = [
      ['For business', [
        ['documents.html', 'Templates'],
        ['recover-debt.html', 'Debt recovery'],
        ['legalhelp.html', 'Find a lawyer'],
        ['documents.html#contracts-agreements', 'Contracts'],
        ['documents.html#employment-hr', 'Employment'],
        ['documents.html#property-tenancy', 'Property']
      ]],
      ['For lawyers', [
        ['court-updates.html', 'Court Updates'],
        ['library.html', 'Research Library'],
        ['assistant.html', 'Research Assistant'],
        ['paralegals.html', 'Book a Paralegal'],
        ['independent.html', 'Go Independent'],
        ['for-lawyers.html', 'Lawgistics Network']
      ]],
      ['For students', [
        ['academy.html', 'Litigation Academy'],
        ['for-students.html', 'Internships'],
        ['academy.html', 'Practical skills']
      ]],
      ['Lawgistics', [
        ['aboutus.html', 'About'],
        ['insights.html', 'Insights'],
        ['contactus.html', 'Contact'],
        ['terms.html', 'Terms'],
        ['privacy-policy.html', 'Privacy']
      ]]
    ];
    var columns = COLUMNS.map(function (col) {
      return '<div><h4>' + col[0] + '</h4><ul class="footer-links">' +
        col[1].map(function (l) {
          return '<li><a href="' + l[0] + '">' + l[1] + '</a></li>';
        }).join('') + '</ul></div>';
    }).join('');

    // Instagram is the only account that exists. A dead social icon reads as
    // an abandoned business, so the block renders only when a URL is set.
    var IG = 'M10 6.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2zm0 5.9a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6zM14.7 5a.9.9 0 1 1-1.7 0 .9.9 0 0 1 1.7 0zM6.5 2.8h7a3.7 3.7 0 0 1 3.7 3.7v7a3.7 3.7 0 0 1-3.7 3.7h-7a3.7 3.7 0 0 1-3.7-3.7v-7A3.7 3.7 0 0 1 6.5 2.8zm0 1.4a2.3 2.3 0 0 0-2.3 2.3v7a2.3 2.3 0 0 0 2.3 2.3h7a2.3 2.3 0 0 0 2.3-2.3v-7a2.3 2.3 0 0 0-2.3-2.3z';
    var igUrl = (window.LG_CONFIG && window.LG_CONFIG.instagramUrl) || '';
    var social = igUrl
      ? '<a href="' + igUrl + '" target="_blank" rel="noopener" aria-label="Instagram">' +
        '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="' + IG + '"/></svg></a>'
      : '';

    host.className = 'site-footer';
    host.innerHTML =
      '<div class="wrap">' +
        '<div class="footer-grid">' +
          '<div>' +
            '<a class="brand brand--light" href="index.html">Lawgistics<span class="dot"></span></a>' +
            '<p class="tagline">Drafted by lawyers. Built for businesses.</p>' +
            (social ? '<h4 style="margin-top:30px">Instagram</h4>' +
              '<div class="social-row" style="margin-top:0">' + social + '</div>' : '') +
          '</div>' +
          columns +
        '</div>' +
        '<div class="footer-sub">' +
          '<div>' +
            '<h4>Subscribe to our newsletter</h4>' +
            '<p style="font-size:.93rem">Legal updates and practical guides, delivered to your inbox.</p>' +
            '<form class="subscribe" data-form="newsletter" data-source="Footer form" novalidate>' +
              '<label class="sr-only" for="footer-email" style="position:absolute;left:-9999px">Email address</label>' +
              '<input class="input" id="footer-email" type="email" name="email" placeholder="you@company.com" required>' +
              '<button class="btn btn--primary" type="submit">Subscribe</button>' +
            '</form>' +
            '<div class="form-status" data-status></div>' +
          '</div>' +
        '</div>' +
        '<div class="footer-bottom">' +
          '<span>&copy; ' + new Date().getFullYear() + ' All rights reserved by Lawgistics</span>' +
          '<span><a href="privacy-policy.html">Privacy Policy</a> &nbsp;·&nbsp; <a href="admin/">Admin</a></span>' +
        '</div>' +
      '</div>';
  }

  /* ------------------------------------------------------------ json-ld -- */

  function jsonLd(id, obj) {
    if (document.getElementById(id)) return;
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = id;
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  }

  function orgSchema() {
    jsonLd('ld-org', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Lawgistics',
      url: 'https://lawgistics.my/',
      description: 'Lawyer-drafted, compliance-ready legal templates and lawyer matching for Malaysian SMEs.',
      areaServed: 'MY',
      slogan: 'Drafted by lawyers. Built for businesses.'
    });
  }

  /* ------------------------------------------------------------- reveal -- */

  var revealObserver = null;

  function reveal() {
    var els = document.querySelectorAll('[data-reveal]:not(.is-in)');
    if (!els.length) return;

    // Content starts at opacity 0 and is revealed by JS. If the observer
    // never reports back — a background tab, an embedded view, an odd
    // browser — the page would stay blank. Always un-hide after a beat.
    var safety = setTimeout(function () {
      document.querySelectorAll('[data-reveal]:not(.is-in)')
        .forEach(function (el) { el.classList.add('is-in'); });
    }, 1800);
    window.addEventListener('pagehide', function () { clearTimeout(safety); });

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    // Reuse one observer across calls; a second call only adds new nodes.
    var io = revealObserver || (revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var delay = parseInt(e.target.getAttribute('data-reveal') || '0', 10);
        setTimeout(function () { e.target.classList.add('is-in'); }, delay);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 }));
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------- accordion -- */

  function accordions() {
    document.querySelectorAll('.faq__q').forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq__item');
        var panel = item.querySelector('.faq__a');
        var open = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
        panel.style.maxHeight = open ? panel.scrollHeight + 40 + 'px' : '0px';
      });
    });
  }

  function renderFaqs() {
    var host = document.querySelector('[data-faqs]');
    if (!host || !window.Store) return;
    var rows = Store.list('faqs', { where: { status: 'published' }, sort: 'order' });
    var limit = parseInt(host.getAttribute('data-faqs') || '0', 10);
    if (limit) rows = rows.slice(0, limit);
    host.innerHTML = rows.map(function (f) {
      return '<div class="faq__item">' +
        '<button class="faq__q" type="button">' + esc(f.question) + ICON.plus + '</button>' +
        '<div class="faq__a"><p>' + esc(f.answer) + '</p></div>' +
      '</div>';
    }).join('');

    jsonLd('ld-faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: rows.map(function (f) {
        return {
          '@type': 'Question', name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer }
        };
      })
    });
  }

  /* -------------------------------------------------------------- forms -- */

  function statusFor(form) {
    return form.parentElement.querySelector('[data-status]') ||
           form.querySelector('[data-status]');
  }

  function say(form, msg, ok) {
    var box = statusFor(form);
    if (!box) return;
    box.textContent = msg;
    box.className = 'form-status ' + (ok ? 'is-ok' : 'is-err');
  }

  function forms() {
    document.querySelectorAll('form[data-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var kind = form.getAttribute('data-form');
        var data = {};
        new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });

        if (!form.checkValidity()) {
          say(form, 'Please complete the required fields.', false);
          form.reportValidity();
          return;
        }

        var today = new Date().toISOString().slice(0, 10);

        if (kind === 'newsletter') {
          var exists = Store.list('newsletterLeads').some(function (l) {
            return l.email.toLowerCase() === data.email.toLowerCase();
          });
          if (exists) { say(form, 'You are already subscribed, thank you.', true); form.reset(); return; }
          Store.create('newsletterLeads', {
            email: data.email,
            source: form.getAttribute('data-source') || 'Website',
            status: 'subscribed',
            date: today
          });
          say(form, 'Subscribed. Look out for the next issue.', true);
          form.reset();
          return;
        }

        if (kind === 'contact') {
          Store.create('contactSubmissions', {
            name: data.name, email: data.email, phone: data.phone || '',
            subject: data.subject || 'General enquiry', message: data.message,
            status: 'new', date: today
          });
          say(form, 'Thank you, your message has reached us. We reply within one business day.', true);
          form.reset();
          return;
        }

        if (kind === 'enquiry') {
          // Field names match the live Payload enquiry-submissions schema.
          var services = [];
          form.querySelectorAll('input[name="legalServices"]:checked').forEach(function (c) {
            services.push(c.value);
          });
          if (!services.length) {
            say(form, 'Pick at least one legal service so we can route your enquiry.', false);
            return;
          }
          Store.create('enquirySubmissions', {
            businessName: data.businessName, businessType: data.businessType,
            stage: data.stage,
            // Live Payload stores this as an array field of {service} rows.
            legalServices: services.join(', '),
            description: data.description, timeline: data.timeline,
            email: data.email, phone: data.phone || '',
            preferredContact: data.preferredContact || 'email',
            status: 'new', assignedTo: '', date: today
          });
          Store.notify('enquiry', { source: 'legal-help', businessName: data.businessName,
            businessType: data.businessType, stage: data.stage, legalServices: services.join(', '),
            description: data.description, timeline: data.timeline, email: data.email,
            phone: data.phone || '', preferredContact: data.preferredContact || 'email' });
          say(form, 'Submitted. We will review your requirement and come back within 24 hours.', true);
          form.reset();
          return;
        }

        if (kind === 'quiz-subscribe') {
          // Daily quiz signup. Consent is mandatory and recorded, because a
          // daily WhatsApp needs a documented opt-in under the PDPA and
          // Meta's own rules before any template message may be sent.
          var consentEl = form.querySelector('[name="consent"]');
          if (consentEl && !consentEl.checked) {
            say(form, 'Please tick the consent box so we can send you the daily question.', false);
            return;
          }
          var wa = data.channel === 'whatsapp';
          if (wa && !/^[+0-9 ()-]{8,}$/.test(data.contact || '')) {
            say(form, 'That does not look like a phone number. Include the country code, e.g. +60 12 345 6789.', false);
            return;
          }
          Store.create('quizSubscribers', {
            name: data.name,
            email: wa ? '' : data.contact,
            phone: wa ? data.contact : '',
            channel: data.channel || 'email',
            consent: 'yes', status: 'subscribed', date: today
          });
          Store.notify('quiz', { event: 'quiz.subscribed', name: data.name,
            channel: data.channel || 'email', contact: data.contact });
          say(form, wa
            ? 'Subscribed. Your first question arrives at 7am Malaysian time — reply STOP any time.'
            : 'Subscribed. Your first question arrives at 7am Malaysian time.', true);
          form.reset();
          return;
        }

        if (kind === 'debt') {
          // Unpaid-debt enquiry. Lands in the same inbox as every other
          // enquiry so nothing needs a separate triage path.
          var summary = [
            'DEBT RECOVERY ENQUIRY',
            'Debtor: ' + data.debtor,
            'Amount: RM ' + (Number(data.amount) || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 }),
            'Overdue: ' + (data.overdue || ''),
            'Invoices: ' + (data.invoices || 'not given'),
            'Documentation: ' + (data.written || ''),
            'Disputed: ' + (data.disputed || ''),
            '',
            data.story
          ].join('\n');
          Store.create('enquirySubmissions', {
            businessName: data.businessName, businessType: 'Debt recovery',
            stage: 'growing', legalServices: 'Debt Recovery',
            description: summary, timeline: 'urgent',
            email: data.email, phone: data.phone || '',
            preferredContact: 'email', status: 'new', assignedTo: '', date: today
          });
          Store.notify('enquiry', { source: 'debt-recovery', businessName: data.businessName,
            businessType: 'Debt recovery', legalServices: 'Debt Recovery',
            description: summary, timeline: 'urgent', email: data.email,
            phone: data.phone || '', amount: data.amount, debtor: data.debtor });
          say(form, 'Sent. A lawyer will read this and reply within 24 hours.', true);
          form.reset();
          return;
        }

        if (kind === 'independent') {
          var needs = [];
          form.querySelectorAll('input[name="needs"]:checked').forEach(function (c) { needs.push(c.value); });
          Store.create('enquirySubmissions', {
            businessName: data.name + ' (independent practitioner)',
            businessType: data.area || 'Legal practice',
            stage: data.stage || 'startup',
            legalServices: 'Independent lawyering support' + (needs.length ? ', ' + needs.join(', ') : ''),
            description: 'INDEPENDENT LAWYERING ENQUIRY, ' + data.message,
            timeline: 'soon', email: data.email, phone: data.phone || '',
            preferredContact: 'email', status: 'new', assignedTo: '', date: today
          });
          Store.notify('enquiry', { source: 'independent', businessName: data.name + ' (independent practitioner)',
            businessType: data.area || 'Legal practice', legalServices: 'Independent lawyering support' + (needs.length ? ', ' + needs.join(', ') : ''),
            description: 'INDEPENDENT LAWYERING ENQUIRY, ' + data.message, timeline: 'soon',
            email: data.email, phone: data.phone || '', stage: data.stage || 'startup', preferredContact: 'email' });
          say(form, 'Thank you, we will come back to you within one business day.', true);
          form.reset();
          return;
        }

        if (kind === 'intake') {
          // Free 10-minute intake call, lands in the live enquiry inbox.
          Store.create('enquirySubmissions', {
            businessName: data.businessName, businessType: data.businessType,
            stage: data.stage || 'growing',
            legalServices: 'Legal Advisory & Retainer Services',
            description: 'FREE 10-MINUTE INTAKE CALL REQUEST, preferred time: ' +
              (data.preferredTime || 'any') + '. Topic: ' + data.topic,
            timeline: 'soon', email: data.email, phone: data.phone || '',
            preferredContact: data.preferredContact || 'phone',
            status: 'new', assignedTo: '', date: today
          });
          Store.notify('enquiry', { source: 'intake-call', businessName: data.businessName,
            businessType: data.businessType, stage: data.stage || 'growing',
            legalServices: 'Legal Advisory & Retainer Services',
            description: 'FREE 10-MINUTE INTAKE CALL REQUEST, preferred time: ' + (data.preferredTime || 'any') + '. Topic: ' + data.topic,
            timeline: 'soon', email: data.email, phone: data.phone || '',
            preferredContact: data.preferredContact || 'phone' });
          say(form, 'Request received, we will confirm a time within one business day.', true);
          form.reset();
          return;
        }

        if (kind === 'auth') {
          var mode = form.getAttribute('data-mode') || 'login';
          var goTo = function (session) {
            var dest = (session.role === 'admin' || session.role === 'editor' || session.mode === 'remote')
              ? 'admin/' : 'dashboard.html';
            // Honour ?next=, but only for a relative path on this site. Anything
            // with a scheme or a host would be an open redirect.
            var next = new URLSearchParams(location.search).get('next');
            if (next && /^[a-z0-9._~\-]+\.html(\?[^#]*)?(#.*)?$/i.test(next) &&
                session.role !== 'admin' && session.role !== 'editor') {
              dest = next;
            }
            say(form, 'Welcome, ' + (session.name || 'there') + ', taking you through…', true);
            setTimeout(function () { location.href = dest; }, 600);
          };
          if (mode === 'signup') {
            var termsEl = form.querySelector('[name="terms"]');
            if (termsEl && !termsEl.checked) {
              say(form, 'Please agree to the Terms of Service and Privacy Policy first.', false);
              return;
            }
            var taken = Store.list('users').some(function (u) {
              return u.email.toLowerCase() === data.email.toLowerCase();
            });
            if (taken) { say(form, 'An account with that email already exists. Try signing in.', false); return; }
            Store.create('users', {
              email: data.email, name: data.name || data.email.split('@')[0],
              role: 'customer', password: data.password, createdAt: today
            });
            Promise.resolve(Store.signIn(data.email, data.password, { forceLocal: true }))
              .then(function (s) {
                if (s) goTo(s);
                else say(form, 'Account created. You can now sign in.', true);
              })
              .catch(function () { say(form, 'Account created. You can now sign in.', true); });
            return;
          }
          Promise.resolve(Store.signIn(data.email, data.password, { forceLocal: true }))
            .then(function (session) {
              if (!session) throw new Error('no match');
              goTo(session);
            })
            .catch(function () {
              say(form, 'Those details did not match an account.', false);
            });
          return;
        }
      });
    });
  }

  /* -------------------------------------------------------------- utils -- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  window.lgEsc = esc;

  window.lgDate = function (iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    var day = d.getDate();
    var suffix = (day % 10 === 1 && day !== 11) ? 'st' : (day % 10 === 2 && day !== 12) ? 'nd' :
                 (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return day + suffix + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  };

  /* --------------------------------------------------------------- init -- */

  /* A page requires an account by declaring <body data-requires-auth>.
     Store.session() reads sessionStorage synchronously, so this resolves
     before anything paints rather than flashing the page and then bouncing.
     The current page and its query travel through as ?next=, so signing up
     returns you to exactly the document you were trying to build. */
  function authGate() {
    if (!document.body || !document.body.hasAttribute('data-requires-auth')) return false;
    var sess = null;
    try { sess = window.Store && Store.session ? Store.session() : null; } catch (e) {}
    if (sess) return false;
    var file = location.pathname.split('/').pop() || 'index.html';
    if (!/\.html$/i.test(file)) file += '.html';
    location.replace('login.html?mode=signup&next=' +
      encodeURIComponent(file + location.search));
    return true;
  }

  function init() {
    if (authGate()) return;
    buildHeader();
    buildFooter();
    orgSchema();

    // The page must NEVER depend on the API answering. Hydration is an
    // upgrade, not a precondition: if lawgistics.my is slow, down, or
    // rejects, we still render from seed data and every form still works.
    // Whichever happens first — resolve, reject, or the deadline — wins.
    // Reveal what is already in the HTML straight away. The hero headline is
    // the most important thing on the page and must never wait on an API call.
    reveal();

    var booted = false;
    function boot() {
      if (booted) return;
      booted = true;
      renderFaqs();
      accordions();
      forms();
      // Page scripts inject their own [data-reveal] nodes, so they must run
      // before the observer is wired up.
      if (typeof window.pageInit === 'function') window.pageInit();
      reveal();
    }

    var deadline = setTimeout(boot, 1500);
    function settle() { clearTimeout(deadline); boot(); }

    try {
      var p = Store.init();
      if (p && typeof p.then === 'function') p.then(settle, settle);
      else settle();
    } catch (e) {
      settle();
    }
  }
  window.lgReveal = reveal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
