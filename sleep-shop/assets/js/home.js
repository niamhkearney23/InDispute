/* Home page: hero artwork, category tiles, featured products, newsletter. */
(function (global) {
  'use strict';

  var doc = global.document;
  var UI = global.HushUI;
  var Art = global.HushArt;
  var Store = global.HushStore;

  function fill(selector, html) {
    var el = doc.querySelector(selector);
    if (el) el.innerHTML = html;
  }

  function heroProduct() {
    return Store.byId('cloudform-hybrid') || global.HUSH_PRODUCTS[0];
  }

  function featured() {
    var wanted = [
      'cloudform-hybrid',
      'stonewashed-linen-set',
      'contour-cool-pillow',
      'sunrise-alarm-lamp'
    ];
    return wanted.map(Store.byId).filter(Boolean);
  }

  function renderNewsletter() {
    var form = doc.querySelector('[data-newsletter]');
    var msg = doc.querySelector('[data-newsletter-msg]');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var value = input.value.trim();
      /* Deliberately loose: something before an @, something with a dot after it. */
      var looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!looksLikeEmail) {
        msg.textContent = 'That email does not look right — check it and try again.';
        msg.style.color = '';
        input.focus();
        return;
      }
      msg.style.color = 'var(--sage)';
      msg.textContent = 'Thanks. Check ' + value + ' for a confirmation (demo only — nothing is sent).';
      form.reset();
    });
  }

  function init() {
    var hero = heroProduct();

    fill('[data-hero-sky]', Art.heroSky());
    fill('[data-hero-card]',
      Art.render(hero, { label: hero.name }) +
      '<div class="hero__caption"><span>' + UI.escapeHtml(hero.name) + ' · ' +
      Store.money(hero.price) + '</span>' +
      '<a href="product.html?id=' + hero.id + '">View</a></div>');

    fill('[data-category-grid]', global.HUSH_CATEGORIES.slice(0, 4).map(UI.categoryTile).join(''));
    fill('[data-featured-grid]', featured().map(function (p) {
      return UI.productCard(p);
    }).join(''));

    var wool = Store.byId('wool-duvet');
    fill('[data-split-art]', Art.render(wool, { label: 'A made bed with a wool duvet' }));

    renderNewsletter();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
