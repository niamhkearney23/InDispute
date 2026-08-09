/* Shop page: category / price / search filters, sorting, and URL sync. */
(function (global) {
  'use strict';

  var doc = global.document;
  var UI = global.HushUI;
  var Store = global.HushStore;
  var PRODUCTS = global.HUSH_PRODUCTS;
  var CATEGORIES = global.HUSH_CATEGORIES;

  var PRICE_BANDS = [
    { id: 'all', label: 'Any price', test: function () { return true; } },
    { id: 'under-100', label: 'Under $100', test: function (p) { return low(p) < 100; } },
    { id: '100-300', label: '$100 – $300', test: function (p) { return low(p) >= 100 && low(p) < 300; } },
    { id: '300-1000', label: '$300 – $1,000', test: function (p) { return low(p) >= 300 && low(p) < 1000; } },
    { id: 'over-1000', label: '$1,000 and up', test: function (p) { return low(p) >= 1000; } }
  ];

  var state = { category: 'all', price: 'all', sort: 'featured', q: '' };

  function low(product) {
    return Store.priceRange(product).min;
  }

  /* ------------------------------------------------------------ filtering */

  function matchesSearch(product, term) {
    if (!term) return true;
    var haystack = [
      product.name,
      product.blurb,
      UI.categoryName(product.category),
      (product.tags || []).join(' ')
    ].join(' ').toLowerCase();
    return term.toLowerCase().split(/\s+/).every(function (word) {
      return haystack.indexOf(word) !== -1;
    });
  }

  function band(id) {
    for (var i = 0; i < PRICE_BANDS.length; i++) {
      if (PRICE_BANDS[i].id === id) return PRICE_BANDS[i];
    }
    return PRICE_BANDS[0];
  }

  function visible() {
    var priceBand = band(state.price);
    return PRODUCTS.filter(function (p) {
      if (state.category !== 'all' && p.category !== state.category) return false;
      if (!priceBand.test(p)) return false;
      return matchesSearch(p, state.q);
    }).sort(sorter(state.sort));
  }

  function sorter(mode) {
    if (mode === 'price-asc') return function (a, b) { return low(a) - low(b); };
    if (mode === 'price-desc') return function (a, b) { return low(b) - low(a); };
    if (mode === 'rating') return function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; };
    if (mode === 'name') return function (a, b) { return a.name.localeCompare(b.name); };
    /* Featured: badged products first, then by review volume. */
    return function (a, b) {
      var flagged = (b.badges || []).length - (a.badges || []).length;
      return flagged || b.reviews - a.reviews;
    };
  }

  /* ------------------------------------------------------------ rendering */

  function renderFilters() {
    var cats = [{ slug: 'all', name: 'Everything' }].concat(CATEGORIES);
    doc.querySelector('[data-category-filters]').innerHTML = cats.map(function (cat) {
      var count = cat.slug === 'all'
        ? PRODUCTS.length
        : PRODUCTS.filter(function (p) { return p.category === cat.slug; }).length;
      return '<li><button type="button" data-category="' + cat.slug + '" aria-pressed="' +
        (state.category === cat.slug) + '">' + UI.escapeHtml(cat.name) +
        ' <span class="tiny muted">(' + count + ')</span></button></li>';
    }).join('');

    doc.querySelector('[data-price-filters]').innerHTML = PRICE_BANDS.map(function (b) {
      return '<li><button type="button" data-price="' + b.id + '" aria-pressed="' +
        (state.price === b.id) + '">' + b.label + '</button></li>';
    }).join('');
  }

  function renderHead() {
    var title = doc.querySelector('[data-shop-title]');
    var intro = doc.querySelector('[data-shop-intro]');
    var crumb = doc.querySelector('[data-crumb]');
    if (state.category === 'all') return;
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].slug === state.category) {
        title.textContent = CATEGORIES[i].name;
        intro.textContent = CATEGORIES[i].tagline;
        crumb.textContent = CATEGORIES[i].name;
        doc.title = CATEGORIES[i].name + ' — Hush';
        return;
      }
    }
  }

  function renderGrid() {
    var items = visible();
    var grid = doc.querySelector('[data-product-grid]');
    var count = doc.querySelector('[data-result-count]');

    count.textContent = items.length === 1
      ? '1 product'
      : items.length + ' products';

    if (!items.length) {
      grid.className = '';
      grid.innerHTML = '<div class="empty">' +
        '<p><strong>Nothing matches that combination.</strong></p>' +
        '<p class="small">Try clearing the price filter, or search for something broader.</p>' +
        '<button class="btn btn--ghost" type="button" data-reset-filters>Clear filters</button>' +
        '</div>';
      return;
    }

    grid.className = 'grid grid--3';
    grid.innerHTML = items.map(function (p) { return UI.productCard(p); }).join('');
  }

  function render() {
    renderFilters();
    renderHead();
    renderGrid();
    syncUrl();
  }

  /* ----------------------------------------------------------------- url */

  function syncUrl() {
    if (!global.history || !global.history.replaceState) return;
    var params = new URLSearchParams();
    if (state.category !== 'all') params.set('category', state.category);
    if (state.price !== 'all') params.set('price', state.price);
    if (state.sort !== 'featured') params.set('sort', state.sort);
    if (state.q) params.set('q', state.q);
    var query = params.toString();
    global.history.replaceState(null, '', query ? '?' + query : location.pathname);
  }

  function readUrl() {
    var params = new URLSearchParams(location.search);
    var category = params.get('category');
    if (category && CATEGORIES.some(function (c) { return c.slug === category; })) {
      state.category = category;
    }
    var price = params.get('price');
    if (price && PRICE_BANDS.some(function (b) { return b.id === price; })) state.price = price;
    var sort = params.get('sort');
    if (sort) state.sort = sort;
    var q = params.get('q');
    if (q) state.q = q;
  }

  /* --------------------------------------------------------------- events */

  function bind() {
    doc.addEventListener('click', function (event) {
      var el = event.target.closest('[data-category], [data-price], [data-reset-filters]');
      if (!el) return;
      if (el.hasAttribute('data-reset-filters')) {
        state.category = 'all';
        state.price = 'all';
        state.q = '';
        doc.querySelector('[data-search]').value = '';
        return render();
      }
      if (el.hasAttribute('data-category')) state.category = el.getAttribute('data-category');
      if (el.hasAttribute('data-price')) state.price = el.getAttribute('data-price');
      render();
    });

    doc.querySelector('[data-sort]').addEventListener('change', function (event) {
      state.sort = event.target.value;
      render();
    });

    var search = doc.querySelector('[data-search]');
    var timer = null;
    search.addEventListener('input', function (event) {
      global.clearTimeout(timer);
      var value = event.target.value;
      timer = global.setTimeout(function () {
        state.q = value.trim();
        renderGrid();
        syncUrl();
      }, 180);
    });
  }

  function init() {
    readUrl();
    doc.querySelector('[data-sort]').value = state.sort;
    doc.querySelector('[data-search]').value = state.q;
    bind();
    render();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
