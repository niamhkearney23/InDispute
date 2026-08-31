/* Sleep Shop — shared chrome: header, footer, cart drawer, theme, toasts.
   Runs on every page. Page-specific scripts load after this one. */
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
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6z" stroke-linejoin="round"/><path d="M9.5 8V6.6a2.5 2.5 0 0 1 5 0V8" stroke-linecap="round"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>'
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
            '<button class="icon-btn" type="button" data-cart-open aria-label="Open cart">' +
              ICONS.bag + '<span class="count" data-cart-count>0</span>' +
            '</button>' +
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
            '<span>Demonstration storefront — no payment is taken at checkout.</span>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  function renderDrawer() {
    if (doc.querySelector('[data-cart-drawer]')) return;
    var holder = doc.createElement('div');
    holder.innerHTML =
      '<div class="scrim" data-cart-scrim hidden></div>' +
      '<aside class="drawer" data-cart-drawer role="dialog" aria-modal="true" ' +
        'aria-label="Your cart" tabindex="-1" hidden>' +
        '<div class="drawer__head">' +
          '<h2>Your cart</h2>' +
          '<button class="icon-btn" type="button" data-cart-close aria-label="Close cart">' + ICONS.close + '</button>' +
        '</div>' +
        '<div class="drawer__body" data-cart-lines></div>' +
        '<div class="drawer__foot" data-cart-foot></div>' +
      '</aside>' +
      '<div class="toast" data-toast role="status" aria-live="polite"></div>';
    while (holder.firstChild) doc.body.appendChild(holder.firstChild);
  }

  /* ---------------------------------------------------------- cart drawer */

  var lastFocus = null;

  function openCart() {
    var drawer = doc.querySelector('[data-cart-drawer]');
    var scrim = doc.querySelector('[data-cart-scrim]');
    if (!drawer) return;
    lastFocus = doc.activeElement;
    drawer.hidden = false;
    scrim.hidden = false;
    global.requestAnimationFrame(function () {
      drawer.classList.add('is-open');
      scrim.classList.add('is-open');
    });
    doc.body.style.overflow = 'hidden';
    drawer.focus();
  }

  function closeCart() {
    var drawer = doc.querySelector('[data-cart-drawer]');
    var scrim = doc.querySelector('[data-cart-scrim]');
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('is-open');
    scrim.classList.remove('is-open');
    doc.body.style.overflow = '';
    global.setTimeout(function () {
      drawer.hidden = true;
      scrim.hidden = true;
    }, 260);

    var back = lastFocus && doc.contains(lastFocus)
      ? lastFocus
      : doc.querySelector('[data-cart-open]');
    if (back && back.focus) back.focus();
  }

  function renderCart() {
    var summary = Store.summary();

    doc.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = summary.count;
      el.hidden = summary.count === 0;
    });

    var lines = doc.querySelector('[data-cart-lines]');
    var foot = doc.querySelector('[data-cart-foot]');
    if (!lines || !foot) return;

    if (!summary.count) {
      lines.innerHTML =
        '<div class="empty">' +
          '<p class="script">Nothing here yet</p>' +
          '<p class="small">' + BOX.name + ', ' + Store.money(BOX.price) + '. Or the pieces on their own.</p>' +
          '<a class="btn btn--ghost" href="box.html">See the box</a>' +
        '</div>';
      foot.innerHTML = '<a class="btn btn--block btn--ghost" href="shop.html">Shop the bedside</a>';
      return;
    }

    lines.innerHTML = summary.lines.map(lineItem).join('');
    foot.innerHTML =
      '<div class="totals">' +
        '<div><span>Subtotal</span><span>' + Store.money(summary.subtotal) + '</span></div>' +
        '<div><span>Delivery</span><span>Free</span></div>' +
        '<div class="totals__grand"><span>Total</span><span>' + Store.money(summary.total) + '</span></div>' +
      '</div>' +
      (summary.written < summary.lines.length
        ? '<p class="tiny muted mt-1">You can add a handwritten message at checkout.</p>'
        : '') +
      '<a class="btn btn--block btn--lg mt-1" href="cart.html">Go to checkout</a>';
  }

  function lineItem(line) {
    var attrs = lineAttrs(line);
    var product = global.SLEEP_FIND(line.id) || BOX;
    var media = line.isBox
      ? Art.render(BOX, { ground: groundForRibbon(line.ribbon), label: '' })
      : Art.render(product, { label: '' });
    var meta = line.isBox ? escapeHtml(line.ribbon) + ' ribbon' : escapeHtml(product.material || '');

    return '<div class="line-item">' +
      '<div class="line-item__media">' + media + '</div>' +
      '<div>' +
        '<div class="line-item__title">' + escapeHtml(line.name) + '</div>' +
        '<div class="line-item__meta">' + meta + '</div>' +
        (line.message ? '<p class="written">' + escapeHtml(line.message) + '</p>' : '') +
        '<div class="line-item__row">' +
          '<div class="qty">' +
            '<button type="button" data-cart-dec ' + attrs + ' aria-label="Decrease quantity">&minus;</button>' +
            '<span>' + line.qty + '</span>' +
            '<button type="button" data-cart-inc ' + attrs + ' aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<strong>' + Store.money(line.lineTotal) + '</strong>' +
        '</div>' +
        '<div class="line-item__row">' +
          '<button class="link-quiet" type="button" data-cart-remove ' + attrs + '>Remove</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* The ribbon choice picks the ground, so the cart thumbnail matches it. */
  function groundForRibbon(ribbon) {
    return ribbon === 'Clay rose' ? 'rose' : 'powder';
  }

  /* One place decides how a cart line is addressed in the DOM, so the drawer
     and the cart page cannot disagree about it. */
  function lineAttrs(line) {
    return 'data-id="' + escapeHtml(line.id) + '" data-ribbon="' + escapeHtml(line.ribbon) +
      '" data-message="' + escapeHtml(line.message) + '"';
  }

  /* --------------------------------------------------------------- toast */

  var toastTimer = null;

  function toast(message) {
    var el = doc.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-open');
    global.clearTimeout(toastTimer);
    toastTimer = global.setTimeout(function () {
      el.classList.remove('is-open');
    }, 2600);
  }

  /* ------------------------------------------------------------- pieces */

  function pieceCard(piece) {
    return '<article class="piece">' +
      '<div class="piece__media">' + Art.render(piece) + '</div>' +
      '<div class="piece__body">' +
        '<span class="label">' + escapeHtml(piece.material) + '</span>' +
        '<h3>' + escapeHtml(piece.name) + '</h3>' +
        '<p>' + escapeHtml(piece.blurb) + '</p>' +
      '</div>' +
    '</article>';
  }

  /* The shop version of the card: same shape, plus a price and a way to buy.
     Used on the shop page and under each ritual. */
  function productCard(product) {
    return '<article class="piece">' +
      '<div class="piece__media">' + Art.render(product) + '</div>' +
      '<div class="piece__body">' +
        '<span class="label">' + escapeHtml(product.material) + '</span>' +
        '<h3>' + escapeHtml(product.name) + '</h3>' +
        '<p>' + escapeHtml(product.blurb) + '</p>' +
        '<div class="piece__buy">' +
          '<span class="piece__price">' + Store.money(product.price) + '</span>' +
          '<button class="btn btn--quiet" type="button" data-shop-add="' +
            escapeHtml(product.id) + '">Add to cart</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  /* ---------------------------------------------------------------- init */

  function bindGlobalEvents() {
    doc.addEventListener('click', function (event) {
      var el = event.target.closest('[data-cart-open], [data-cart-close], [data-cart-scrim], ' +
        '[data-cart-inc], [data-cart-dec], [data-cart-remove], [data-theme-toggle], ' +
        '[data-menu-toggle], [data-shop-add]');
      if (!el) return;

      if (el.hasAttribute('data-cart-open')) return openCart();
      if (el.hasAttribute('data-shop-add')) {
        var product = global.SLEEP_FIND(el.getAttribute('data-shop-add'));
        if (!product) return;
        Store.add(product.id, '', '', 1);
        toast(product.name + ' added');
        return openCart();
      }
      if (el.hasAttribute('data-cart-close') || el.hasAttribute('data-cart-scrim')) return closeCart();
      if (el.hasAttribute('data-theme-toggle')) return toggleTheme();
      if (el.hasAttribute('data-menu-toggle')) {
        var panel = doc.getElementById('mobile-nav');
        var open = panel.classList.toggle('is-open');
        el.setAttribute('aria-expanded', String(open));
        return;
      }

      var id = el.getAttribute('data-id');
      var ribbon = el.getAttribute('data-ribbon') || '';
      var message = el.getAttribute('data-message') || '';
      var current = findQty(id, ribbon, message);
      if (el.hasAttribute('data-cart-inc')) Store.setQty(id, ribbon, message, current + 1);
      if (el.hasAttribute('data-cart-dec')) Store.setQty(id, ribbon, message, current - 1);
      if (el.hasAttribute('data-cart-remove')) Store.remove(id, ribbon, message);
    });

    doc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') return closeCart();
      if (event.key === 'Tab') trapFocus(event);
    });
  }

  function findQty(id, ribbon, message) {
    var lines = Store.summary().lines;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].id === id && lines[i].ribbon === ribbon && lines[i].message === message) {
        return lines[i].qty;
      }
    }
    return 0;
  }

  /* While the drawer is open it is a modal dialog, so Tab must not walk off
     into the page behind it. */
  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function trapFocus(event) {
    var drawer = doc.querySelector('[data-cart-drawer]');
    if (!drawer || drawer.hidden) return;

    var items = Array.prototype.filter.call(
      drawer.querySelectorAll(FOCUSABLE),
      function (el) { return el.offsetParent !== null; }
    );
    if (!items.length) return;

    var first = items[0];
    var last = items[items.length - 1];
    var active = doc.activeElement;

    if (!drawer.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
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
    renderDrawer();
    applyTheme(doc.documentElement.getAttribute('data-theme') || preferredTheme());
    bindGlobalEvents();
    Store.subscribe(renderCart);
    renderCart();
    revealOnScroll();
  }

  global.SleepUI = {
    init: init,
    pieceCard: pieceCard,
    productCard: productCard,
    lineAttrs: lineAttrs,
    groundForRibbon: groundForRibbon,
    ribbonSwatch: ribbonSwatch,
    escapeHtml: escapeHtml,
    toast: toast,
    openCart: openCart,
    closeCart: closeCart,
    icons: ICONS
  };

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
