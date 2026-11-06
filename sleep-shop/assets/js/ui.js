/* Sleep Shop — shared chrome: header, footer, theme, the piece cards and
   their pre-order buttons. Runs on every page. Page-specific scripts load
   after this one. */
(function (global) {
  'use strict';

  var doc = global.document;
  var Store = global.SleepStore;
  var Art = global.SleepArt;
  var CONFIG = global.SLEEP_CONFIG;
  var BOX = global.SLEEP_BOX;

  /* The three pathways, then the studio. */
  var NAV = [
    { href: 'box.html', label: 'Gift sleep', page: 'box' },
    { href: 'shop.html', label: 'Shop sleep', page: 'shop' },
    { href: 'rituals.html', label: 'Sleep rituals', page: 'rituals' },
    { href: 'about.html', label: 'About', page: 'about' },
    { href: 'contact.html', label: 'Contact', page: 'contact' }
  ];

  var ICONS = {
    moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" stroke-linejoin="round"/></svg>',
    sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" stroke-linecap="round"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 6l6 6-6 6"/></svg>'
  };

  /* The logo is the wordmark alone: no icon. A brand line ("Sleep Shop"),
     nothing else — the place name lives in the announcement bar and the
     footer paragraph, not in the mark itself. */
  function brandLockup() {
    return '<strong>' + CONFIG.brand + '</strong><span class="brand__rule" aria-hidden="true"></span>';
  }

  /* ------------------------------------------------------------- helpers */

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function currentPage() {
    return (doc.body && doc.body.dataset.page) || '';
  }

  function ribbonSwatch(label) {
    var ribbons = BOX.ribbons || [];
    for (var i = 0; i < ribbons.length; i++) {
      if (ribbons[i].label === label) return ribbons[i].swatch;
    }
    return 'transparent';
  }

  /* --------------------------------------------------------------- theme */

  var THEME_KEY = 'sleepshop.theme';

  function preferredTheme() {
    try {
      var saved = global.localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (err) { /* storage unavailable — fall through */ }

    /* Respect a theme already stamped on the document. That is normally our own
       pre-paint bootstrap, but when the page is embedded somewhere that picks
       the theme for the reader, their choice should not be overwritten. */
    var stamped = doc.documentElement.getAttribute('data-theme');
    if (stamped === 'light' || stamped === 'dark') return stamped;

    return global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function applyTheme(theme) {
    doc.documentElement.setAttribute('data-theme', theme);
    var toggle = doc.querySelector('[data-theme-toggle]');
    if (toggle) {
      var next = theme === 'dark' ? 'light' : 'dark';
      toggle.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
      toggle.setAttribute('aria-label', 'Switch to ' + next + ' mode');
      toggle.setAttribute('title', 'Switch to ' + next + ' mode');
    }
  }

  function toggleTheme() {
    var next = doc.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { global.localStorage.setItem(THEME_KEY, next); } catch (err) { /* not fatal */ }
    applyTheme(next);
  }

  /* -------------------------------------------------------------- chrome */

  function renderHeader() {
    var host = doc.querySelector('[data-site-header]');
    if (!host) return;
    var page = currentPage();

    var links = NAV.map(function (item) {
      var current = item.page === page ? ' aria-current="page"' : '';
      return '<a class="nav__link" href="' + item.href + '"' + current + '>' + item.label + '</a>';
    }).join('');

    host.innerHTML =
      '<div class="announce">Free delivery Australia-wide &middot; packed by hand in ' + CONFIG.place + '</div>' +
      '<div class="site-header">' +
        '<div class="wrap header__inner">' +
          '<a class="brand" href="index.html">' + brandLockup() + '</a>' +
          '<nav class="nav" aria-label="Primary">' + links + '</nav>' +
          '<div class="header__actions">' +
            '<button class="icon-btn" type="button" data-theme-toggle></button>' +
            '<button class="icon-btn menu-toggle" type="button" data-menu-toggle ' +
              'aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">' +
              ICONS.menu +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="wrap"><div class="mobile-nav" id="mobile-nav">' +
          NAV.map(function (item) {
            return '<a href="' + item.href + '">' + item.label + '</a>';
          }).join('') +
        '</div></div>' +
      '</div>';
  }

  function renderFooter() {
    var host = doc.querySelector('[data-site-footer]');
    if (!host) return;

    host.innerHTML =
      '<footer class="site-footer">' +
        '<div class="wrap">' +
          '<div class="footer__grid">' +
            '<div class="footer__brand">' +
              '<a class="brand" href="index.html" style="color:var(--cream)">' + brandLockup() + '</a>' +
              '<p>' + CONFIG.tagline + ' Beautiful things for the last hour of the day, packed by ' +
                'hand in ' + CONFIG.place + ' and sent anywhere in Australia.</p>' +
            '</div>' +
            '<div><h3>Shop</h3><div class="footer__links">' +
              '<a href="box.html">The Gift of Sleep Box</a>' +
              '<a href="shop.html">Shop the bedside</a>' +
              '<a href="rituals.html">Sleep rituals</a>' +
              '<a href="gifting.html">Gifting</a>' +
            '</div></div>' +
            '<div><h3>Help</h3><div class="footer__links">' +
              '<a href="contact.html">Contact us</a>' +
              '<a href="gifting.html#delivery">Delivery</a>' +
              '<a href="gifting.html#returns">Returns</a>' +
              '<a href="contact.html#faq">FAQ</a>' +
            '</div></div>' +
            '<div><h3>Studio</h3><div class="footer__links">' +
              '<a href="about.html">Our story</a>' +
              '<a href="about.html#materials">Materials</a>' +
              '<a href="mailto:' + CONFIG.email + '">' + CONFIG.email + '</a>' +
            '</div></div>' +
          '</div>' +
          '<div class="footer__bottom">' +
            '<span>&copy; ' + new Date().getFullYear() + ' ' + CONFIG.brand +
              (CONFIG.abn ? '. ABN ' + CONFIG.abn : '') + '. Prices in ' + CONFIG.currency + '.</span>' +
            '<span>' + hoursLine() + '. Pre-order is real, processed by Stripe. The contact form is a demonstration only.</span>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  /* The ribbon choice picks the ground, so the box's own preview art matches
     it. Not cart-related — box.js uses this to redraw the hero shot. */
  function groundForRibbon(ribbon) {
    return ribbon === 'Clay rose' ? 'rose' : 'powder';
  }

  /* ----------------------------------------------------------- pre-order */

  /* A real purchase path, separate from the demonstration cart: an external
     link to a Stripe Payment Link, or a disabled placeholder until one
     exists. Never routes through Store — no fake payment can look like a
     real pre-order, and no real charge can be mistaken for a demo. */
  function preorderCta(productId, price) {
    var link = (CONFIG.preorderLinks || {})[productId];
    if (link) {
      return '<a class="btn btn--lg" href="' + escapeHtml(link) + '" target="_blank" rel="noopener">' +
          'Pre-order &middot; ' + Store.money(price) + '</a>' +
        '<p class="tiny muted">Orders open ' + hourLabel(NIGHT.opens) + ' to ' + hourLabel(NIGHT.closes) +
          ', Melbourne time. Ships from ' + escapeHtml(CONFIG.preorderShipsFrom) +
          '. Card processed securely by Stripe, off this site.</p>';
    }
    return '<button class="btn btn--lg" type="button" disabled>Pre-order, opening soon</button>';
  }

  /* Hand-written links opt in with data-preorder="<product id>". With a live
     Stripe link they go straight to it; without one they keep their own href,
     the product page, so nothing ever points nowhere. */
  function wirePreorder(scope) {
    var root = scope || doc;
    var links = CONFIG.preorderLinks || {};
    root.querySelectorAll('[data-preorder]').forEach(function (a) {
      var url = links[a.getAttribute('data-preorder')];
      if (!url) return;
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
    });
    root.querySelectorAll('[data-ships-from]').forEach(function (el) {
      el.textContent = CONFIG.preorderShipsFrom;
    });
  }

  /* ---------------------------------------------------------- night shop */

  /* Orders are only taken from 8pm to midnight in Melbourne. Browsing is
     always allowed; outside those hours a buy click draws the curtain
     instead of opening Stripe. ?lights=on or ?lights=off previews either. */
  var NIGHT = CONFIG.nightShop || { timeZone: 'Australia/Melbourne', opens: 20, closes: 24 };

  function melbourneClock() {
    var parts = new Intl.DateTimeFormat('en-AU', {
      timeZone: NIGHT.timeZone, hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
    }).formatToParts(new Date());
    var get = function (type) {
      for (var i = 0; i < parts.length; i++) if (parts[i].type === type) return Number(parts[i].value);
      return 0;
    };
    return { h: get('hour') % 24, m: get('minute') };
  }

  function lightsOverride() {
    var match = /[?&]lights=(on|off)\b/.exec(global.location.search);
    return match ? match[1] === 'on' : null;
  }

  function isOpen() {
    var forced = lightsOverride();
    if (forced !== null) return forced;
    var t = melbourneClock();
    return t.h >= NIGHT.opens && t.h < NIGHT.closes;
  }

  function minutesUntilOpen() {
    var t = melbourneClock();
    var now = t.h * 60 + t.m;
    var opens = NIGHT.opens * 60;
    return now < opens ? opens - now : 24 * 60 - now + opens;
  }

  function hourLabel(h) {
    if (h % 24 === 0) return 'midnight';
    return (h % 12 || 12) + (h < 12 ? 'am' : 'pm');
  }

  function untilOpenText() {
    var mins = minutesUntilOpen();
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    if (h === 0) return m + (m === 1 ? ' minute' : ' minutes');
    return h + (h === 1 ? ' hour' : ' hours') + (m ? ' ' + m + ' min' : '');
  }

  /* A calendar reminder for the next opening, built in the browser, standing
     in for an email list until there is one. */
  function reminderHref() {
    var start = new Date(Math.ceil((Date.now() + minutesUntilOpen() * 60000) / 60000) * 60000);
    var end = new Date(start.getTime() + 30 * 60000);
    var stamp = function (d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sleep Shop//Night shop//EN',
      'BEGIN:VEVENT',
      'UID:open-' + stamp(start) + '@sleepshop.online',
      'DTSTAMP:' + stamp(new Date()),
      'DTSTART:' + stamp(start),
      'DTEND:' + stamp(end),
      'SUMMARY:Sleep Shop is open',
      'DESCRIPTION:The shop is open until midnight. https://sleepshop.online',
      'URL:https://sleepshop.online',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  }

  function hoursLine() {
    return 'Open ' + hourLabel(NIGHT.opens) + ' to ' + hourLabel(NIGHT.closes) + ', Melbourne time';
  }

  function renderAnnounce() {
    var bar = doc.querySelector('.announce');
    if (!bar) return;
    bar.classList.toggle('announce--closed', !isOpen());
    bar.innerHTML = isOpen()
      ? 'The lights are on &middot; open until ' + hourLabel(NIGHT.closes) + ' tonight'
      : 'We are asleep &middot; doors open at ' + hourLabel(NIGHT.opens) + ' Melbourne time, in ' + untilOpenText();
  }

  function renderCurtain() {
    var el = doc.querySelector('[data-curtain]');
    if (!el) {
      el = doc.createElement('div');
      el.className = 'curtain';
      el.setAttribute('data-curtain', '');
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-labelledby', 'curtain-title');
      doc.body.appendChild(el);
    }
    el.innerHTML =
      '<div class="curtain__inner">' +
        '<div class="curtain__art">' + Art.render({ art: 'lamp', ground: 'cocoa', name: 'A bedside lamp, switched off' }) + '</div>' +
        '<p class="curtain__eyebrow">' + hoursLine() + '</p>' +
        '<h2 class="curtain__title" id="curtain-title">We are asleep.</h2>' +
        '<p class="curtain__body">The shop takes orders from ' + hourLabel(NIGHT.opens) + ' until ' +
          hourLabel(NIGHT.closes) + ', which is when you are in bed with your phone anyway. ' +
          'Doors open in <span data-until-open>' + untilOpenText() + '</span>.</p>' +
        '<div class="curtain__actions">' +
          '<a class="curtain__btn" href="' + reminderHref() + '" download="sleep-shop-opens.ics">Remind me at ' + hourLabel(NIGHT.opens) + '</a>' +
          '<button class="curtain__btn curtain__btn--quiet" type="button" data-curtain-close>Look around anyway</button>' +
        '</div>' +
      '</div>';
    return el;
  }

  var lastFocus = null;

  function openCurtain() {
    var el = renderCurtain();
    lastFocus = doc.activeElement;
    doc.documentElement.classList.add('curtain-open');
    el.classList.add('is-open');
    var close = el.querySelector('[data-curtain-close]');
    if (close) close.focus();
  }

  function closeCurtain() {
    var el = doc.querySelector('[data-curtain]');
    if (!el) return;
    el.classList.remove('is-open');
    doc.documentElement.classList.remove('curtain-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function isBuyLink(el) {
    return el.matches('[data-preorder], a[href^="https://buy.stripe.com"]');
  }

  function bindNightShop() {
    doc.addEventListener('click', function (event) {
      if (event.target.closest('[data-curtain-close]')) return closeCurtain();
      var link = event.target.closest('a');
      if (!link || !isBuyLink(link) || isOpen()) return;
      event.preventDefault();
      openCurtain();
    });
    doc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && doc.documentElement.classList.contains('curtain-open')) closeCurtain();
    });

    var wasOpen = isOpen();
    doc.documentElement.setAttribute('data-shop', wasOpen ? 'open' : 'closed');
    renderAnnounce();

    /* The first visit while closed gets the curtain once per tab. */
    if (!wasOpen) {
      var seen = false;
      try { seen = global.sessionStorage.getItem('sleepshop.curtain') === '1'; } catch (err) { /* ignore */ }
      if (!seen) {
        openCurtain();
        try { global.sessionStorage.setItem('sleepshop.curtain', '1'); } catch (err) { /* ignore */ }
      }
    }

    global.setInterval(function () {
      var open = isOpen();
      doc.documentElement.setAttribute('data-shop', open ? 'open' : 'closed');
      renderAnnounce();
      var until = doc.querySelector('[data-until-open]');
      if (until) until.textContent = untilOpenText();
      if (open && !wasOpen) closeCurtain();
      wasOpen = open;
    }, 30000);
  }

  /* ------------------------------------------------------------- pieces */

  /* A piece as the home page draws it: the picture, a hairline, the words.
     No box around it. */
  function pieceCard(piece) {
    return '<article class="h-piece">' +
      '<div class="h-piece__art">' + Art.render(piece) + '</div>' +
      '<div class="h-piece__copy">' +
        '<h3>' + escapeHtml(piece.name) + '</h3>' +
        '<p>' + escapeHtml(piece.material) + '</p>' +
        '<p class="h-piece__blurb">' + escapeHtml(piece.blurb) + '</p>' +
      '</div>' +
    '</article>';
  }

  /* The shop version: the same card plus a price and a way to buy. Used on
     the shop page and under each ritual. Straight to the piece's Stripe
     link; if there is none yet, it says so rather than linking nowhere. */
  function productCard(product) {
    var url = (CONFIG.preorderLinks || {})[product.id];
    var buy = url
      ? '<a class="h-link" href="' + escapeHtml(url) + '" target="_blank" rel="noopener">Pre-order ' + ICONS.arrow + '</a>'
      : '<span class="h-label" style="margin:0">Opening soon</span>';
    return '<article class="h-piece">' +
      '<div class="h-piece__art">' + Art.render(product) + '</div>' +
      '<div class="h-piece__copy">' +
        '<h3>' + escapeHtml(product.name) + '</h3>' +
        '<p>' + escapeHtml(product.material) + '</p>' +
        '<p class="h-piece__blurb">' + escapeHtml(product.blurb) + '</p>' +
        '<div class="h-piece__buy">' +
          '<span class="h-price-sm">' + Store.money(product.price) + '</span>' + buy +
        '</div>' +
        '<p class="h-ship">Ships from ' + escapeHtml(CONFIG.preorderShipsFrom) + '</p>' +
      '</div>' +
    '</article>';
  }

  /* ---------------------------------------------------------------- init */

  function bindGlobalEvents() {
    doc.addEventListener('click', function (event) {
      var el = event.target.closest('[data-theme-toggle], [data-menu-toggle]');
      if (!el) return;

      if (el.hasAttribute('data-theme-toggle')) return toggleTheme();
      if (el.hasAttribute('data-menu-toggle')) {
        var panel = doc.getElementById('mobile-nav');
        var open = panel.classList.toggle('is-open');
        el.setAttribute('aria-expanded', String(open));
      }
    });
  }

  /* Sections surface as the reader reaches them. Decoration only: the .js
     class is what arms the hidden state, so a browser that never runs this
     sees the whole page immediately, and reduced motion opts out entirely. */
  function revealOnScroll() {
    var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in global)) return;

    doc.documentElement.classList.add('js');

    var targets = doc.querySelectorAll('.section > .wrap, .section > .wrap--narrow');
    var observer = new global.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(function (el) {
      /* Anything already on screen at load stays put; only what is below the
         fold gets an entrance. */
      if (el.getBoundingClientRect().top > global.innerHeight * 0.9) {
        el.classList.add('reveal');
        observer.observe(el);
      }
    });
  }

  function init() {
    applyTheme(preferredTheme());
    renderHeader();
    renderFooter();
    applyTheme(doc.documentElement.getAttribute('data-theme') || preferredTheme());
    bindGlobalEvents();
    wirePreorder();
    bindNightShop();
    revealOnScroll();
  }

  global.SleepUI = {
    init: init,
    pieceCard: pieceCard,
    productCard: productCard,
    preorderCta: preorderCta,
    wirePreorder: wirePreorder,
    isOpen: isOpen,
    groundForRibbon: groundForRibbon,
    ribbonSwatch: ribbonSwatch,
    escapeHtml: escapeHtml,
    icons: ICONS
  };

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
