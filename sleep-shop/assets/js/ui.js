/* Hush Sleep Shop — shared chrome: header, footer, cart drawer, theme, toasts.
   Runs on every page. Page-specific scripts load after this one. */
(function (global) {
  'use strict';

  var doc = global.document;
  var Store = global.HushStore;
  var Art = global.HushArt;
  var CONFIG = global.HUSH_CONFIG;
  var CATEGORIES = global.HUSH_CATEGORIES;

  var NAV = [
    { href: 'shop.html', label: 'Shop', page: 'shop' },
    { href: 'quiz.html', label: 'Find your fit', page: 'quiz' },
    { href: 'guides.html', label: 'Sleep guides', page: 'guides' },
    { href: 'about.html', label: 'About', page: 'about' },
    { href: 'contact.html', label: 'Contact', page: 'contact' }
  ];

  var ICONS = {
    moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" stroke-linejoin="round"/></svg>',
    sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" stroke-linecap="round"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l1 12H5z" stroke-linejoin="round"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" stroke-linecap="round"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>'
  };

  var LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">' +
    '<path d="M25.6 19.4a9.4 9.4 0 0 1-12.9-12 10.6 10.6 0 1 0 12.9 12z"/>' +
    '<circle cx="24.5" cy="7.5" r="1.6" opacity=".8"/>' +
    '<circle cx="28.6" cy="12.4" r="1" opacity=".6"/></svg>';

  /* ------------------------------------------------------------- helpers */

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function stars(rating) {
    var filled = Math.round(rating);
    var out = '';
    for (var i = 1; i <= 5; i++) out += i <= filled ? '★' : '☆';
    return out;
  }

  function currentPage() {
    return (doc.body && doc.body.dataset.page) || '';
  }

  function categoryName(slug) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].slug === slug) return CATEGORIES[i].name;
    }
    return slug;
  }

  /* --------------------------------------------------------------- theme */

  var THEME_KEY = 'hush.theme';

  function preferredTheme() {
    try {
      var saved = global.localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (err) { /* storage unavailable — fall through to the media query */ }
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
      '<div class="announce">Free delivery Australia-wide over ' +
        Store.money(CONFIG.freeShippingFrom) +
        ' &middot; <strong>100-night trial</strong> on mattresses and pillows</div>' +
      '<div class="site-header">' +
        '<div class="wrap header__inner">' +
          '<a class="brand" href="index.html"><span class="brand__mark">' + LOGO + '</span>Hush</a>' +
          '<nav class="nav" aria-label="Primary">' + links + '</nav>' +
          '<div class="header__actions">' +
            '<button class="icon-btn" type="button" data-theme-toggle></button>' +
            '<button class="icon-btn" type="button" data-cart-open aria-label="Open cart">' +
              ICONS.bag + '<span class="badge" data-cart-count>0</span>' +
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

    var shopLinks = CATEGORIES.map(function (cat) {
      return '<a href="shop.html?category=' + cat.slug + '">' + cat.name + '</a>';
    }).join('');

    host.innerHTML =
      '<footer class="site-footer">' +
        '<div class="wrap">' +
          '<div class="footer__grid">' +
            '<div class="footer__brand">' +
              '<a class="brand" href="index.html"><span class="brand__mark">' + LOGO + '</span>Hush</a>' +
              '<p>A small sleep shop in Melbourne. We sell the things that actually change a night, ' +
              'and nothing that does not.</p>' +
            '</div>' +
            '<div><h3>Shop</h3><div class="footer__links">' + shopLinks + '</div></div>' +
            '<div><h3>Help</h3><div class="footer__links">' +
              '<a href="contact.html">Contact us</a>' +
              '<a href="about.html#trial">100-night trial</a>' +
              '<a href="about.html#delivery">Delivery &amp; returns</a>' +
              '<a href="guides.html">Sleep guides</a>' +
            '</div></div>' +
            '<div><h3>Company</h3><div class="footer__links">' +
              '<a href="about.html">Our story</a>' +
              '<a href="about.html#materials">Materials</a>' +
              '<a href="quiz.html">Find your fit</a>' +
              '<a href="contact.html#faq">FAQ</a>' +
            '</div></div>' +
          '</div>' +
          '<div class="footer__bottom">' +
            '<span>&copy; ' + new Date().getFullYear() + ' Hush Sleep Shop. Prices in ' + CONFIG.currency + '.</span>' +
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
        'aria-label="Shopping cart" tabindex="-1" hidden>' +
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
    /* Next frame, so the transition runs from the off-screen position. */
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
    if (lastFocus && lastFocus.focus) lastFocus.focus();
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
          '<p><strong>Nothing here yet.</strong></p>' +
          '<p class="small">Not sure where to start? Take the 60-second fit quiz.</p>' +
          '<a class="btn btn--ghost" href="quiz.html">Find your fit</a>' +
        '</div>';
      foot.innerHTML = '<a class="btn btn--block btn--ghost" href="shop.html">Browse the shop</a>';
      return;
    }

    lines.innerHTML = summary.lines.map(lineItem).join('');
    foot.innerHTML =
      shipMeter(summary) +
      '<div class="totals">' +
        '<div><span>Subtotal</span><span>' + Store.money(summary.subtotal) + '</span></div>' +
        '<div><span>Delivery</span><span>' +
          (summary.shipping ? Store.money(summary.shipping) : 'Free') +
        '</span></div>' +
        '<div class="totals__grand"><span>Total</span><span>' + Store.money(summary.total) + '</span></div>' +
      '</div>' +
      '<a class="btn btn--block btn--lg" href="cart.html" style="margin-top:1rem">Go to checkout</a>';
  }

  function shipMeter(summary) {
    if (!summary.freeShippingRemaining) {
      return '<p class="ship-meter"><strong>Delivery is on us.</strong></p>';
    }
    var threshold = CONFIG.freeShippingFrom;
    var pct = Math.min(100, Math.round(((threshold - summary.freeShippingRemaining) / threshold) * 100));
    return '<div class="ship-meter">' +
      Store.money(summary.freeShippingRemaining) + ' away from free delivery' +
      '<div class="ship-meter__track"><div class="ship-meter__fill" style="width:' + pct + '%"></div></div>' +
      '</div>';
  }

  function lineItem(line) {
    var p = line.product;
    return '<div class="line-item">' +
      '<div class="line-item__media">' + Art.render(p, { label: '' }) + '</div>' +
      '<div>' +
        '<div class="line-item__title"><a href="product.html?id=' + p.id + '">' + escapeHtml(p.name) + '</a></div>' +
        (line.variant ? '<div class="line-item__meta">' + escapeHtml(line.variant) + '</div>' : '') +
        '<div class="line-item__meta">' + Store.money(line.unitPrice) + ' each</div>' +
        '<div class="line-item__row">' +
          qtyControl(line) +
          '<strong>' + Store.money(line.lineTotal) + '</strong>' +
        '</div>' +
        '<div class="line-item__row">' +
          '<button class="link-danger" type="button" data-cart-remove data-id="' + p.id +
            '" data-variant="' + escapeHtml(line.variant || '') + '">Remove</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function qtyControl(line) {
    var attrs = 'data-id="' + line.id + '" data-variant="' + escapeHtml(line.variant || '') + '"';
    return '<div class="qty">' +
      '<button type="button" data-cart-dec ' + attrs + ' aria-label="Decrease quantity">−</button>' +
      '<span>' + line.qty + '</span>' +
      '<button type="button" data-cart-inc ' + attrs + ' aria-label="Increase quantity">+</button>' +
    '</div>';
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

  /* ------------------------------------------------------- card rendering */

  function priceLabel(product) {
    var range = Store.priceRange(product);
    var base = Store.money(range.min);
    var html = '<span class="price">' + (range.min === range.max ? base : 'From ' + base);
    /* The was-price only belongs next to a single price — beside a "from" it
       would compare two different sizes. The saving is on the badge instead. */
    if (product.compareAt && range.min === range.max) {
      html += '<del>' + Store.money(product.compareAt) + '</del>';
    }
    html += '</span>';
    return html;
  }

  function productCard(product, options) {
    var opts = options || {};
    var flags = (product.badges || []).map(function (b) {
      return '<span class="pill pill--accent">' + escapeHtml(b) + '</span>';
    });
    if (product.compareAt) flags.push('<span class="pill pill--sale">Save ' +
      Store.money(product.compareAt - product.price) + '</span>');

    return '<article class="product-card">' +
      '<a class="product-card__media" href="product.html?id=' + product.id + '" tabindex="-1" aria-hidden="true">' +
        Art.render(product) +
      '</a>' +
      (flags.length ? '<div class="product-card__flags">' + flags.join('') + '</div>' : '') +
      '<div class="product-card__body">' +
        '<span class="tiny muted">' + escapeHtml(categoryName(product.category)) + '</span>' +
        '<h3 class="product-card__name"><a href="product.html?id=' + product.id + '">' +
          escapeHtml(product.name) + '</a></h3>' +
        '<span class="rating"><span class="stars" aria-hidden="true">' + stars(product.rating) + '</span>' +
          product.rating.toFixed(1) + ' (' + product.reviews.toLocaleString(CONFIG.locale) + ')</span>' +
        '<p class="product-card__blurb">' + escapeHtml(product.blurb) + '</p>' +
        '<div class="product-card__foot">' +
          priceLabel(product) +
          (opts.noAdd ? '' : '<button class="btn" type="button" data-add="' + product.id + '">Add</button>') +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function categoryTile(category) {
    var sample = { art: category.art, tone: toneFor(category.slug), name: category.name };
    return '<a class="tile" href="shop.html?category=' + category.slug + '">' +
      Art.render(sample, { label: category.name }) +
      '<span class="tile__label"><strong>' + escapeHtml(category.name) + '</strong>' +
      '<span>' + escapeHtml(category.tagline) + '</span></span>' +
    '</a>';
  }

  function toneFor(slug) {
    var products = global.HUSH_PRODUCTS;
    for (var i = 0; i < products.length; i++) {
      if (products[i].category === slug) return products[i].tone;
    }
    return ['#2b2a57', '#8fa5d6', '#f2ece1'];
  }

  /* ---------------------------------------------------------------- init */

  function bindGlobalEvents() {
    doc.addEventListener('click', function (event) {
      var el = event.target.closest('[data-add], [data-cart-open], [data-cart-close], ' +
        '[data-cart-scrim], [data-cart-inc], [data-cart-dec], [data-cart-remove], ' +
        '[data-theme-toggle], [data-menu-toggle]');
      if (!el) return;

      if (el.hasAttribute('data-add')) {
        var id = el.getAttribute('data-add');
        var product = Store.byId(id);
        Store.add(id, el.getAttribute('data-variant') || null, Number(el.getAttribute('data-qty')) || 1);
        toast((product ? product.name : 'Item') + ' added to cart');
        openCart();
        return;
      }
      if (el.hasAttribute('data-cart-open')) return openCart();
      if (el.hasAttribute('data-cart-close') || el.hasAttribute('data-cart-scrim')) return closeCart();
      if (el.hasAttribute('data-theme-toggle')) return toggleTheme();
      if (el.hasAttribute('data-menu-toggle')) {
        var panel = doc.getElementById('mobile-nav');
        var open = panel.classList.toggle('is-open');
        el.setAttribute('aria-expanded', String(open));
        return;
      }

      var lineId = el.getAttribute('data-id');
      var variant = el.getAttribute('data-variant') || null;
      var current = findQty(lineId, variant);
      if (el.hasAttribute('data-cart-inc')) Store.setQty(lineId, variant, current + 1);
      if (el.hasAttribute('data-cart-dec')) Store.setQty(lineId, variant, current - 1);
      if (el.hasAttribute('data-cart-remove')) Store.remove(lineId, variant);
    });

    doc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeCart();
    });
  }

  function findQty(id, variant) {
    var lines = Store.summary().lines;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].id === id && (lines[i].variant || null) === (variant || null)) return lines[i].qty;
    }
    return 0;
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
  }

  global.HushUI = {
    init: init,
    productCard: productCard,
    categoryTile: categoryTile,
    priceLabel: priceLabel,
    stars: stars,
    escapeHtml: escapeHtml,
    categoryName: categoryName,
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
