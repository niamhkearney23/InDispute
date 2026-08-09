/* Product detail page: variant + quantity selection, specs, related items. */
(function (global) {
  'use strict';

  var doc = global.document;
  var UI = global.HushUI;
  var Art = global.HushArt;
  var Store = global.HushStore;

  var product = null;
  var variant = null;
  var qty = 1;

  function productId() {
    return new URLSearchParams(location.search).get('id');
  }

  function setMeta(attribute, name, value) {
    var tag = doc.querySelector('meta[' + attribute + '="' + name + '"]');
    if (tag) tag.setAttribute('content', value);
  }

  /* Thumbnails reuse the illustration with the palette rotated, so a product
     reads as a small set of shots rather than one repeated image. */
  function toneVariants(tone) {
    return [
      tone,
      [tone[0], tone[2], tone[1]],
      [Art.mix(tone[0], tone[1], 0.35), tone[1], tone[2]]
    ];
  }

  function notFound() {
    doc.querySelector('[data-pdp]').innerHTML =
      '<div class="empty" style="margin-block:4rem">' +
        '<p><strong>We could not find that product.</strong></p>' +
        '<p class="small">It may have been renamed, or the link may be incomplete.</p>' +
        '<a class="btn" href="shop.html">Back to the shop</a>' +
      '</div>';
  }

  function unitPrice() {
    return Store.priceFor(product, variant);
  }

  function priceBlock() {
    var html = '<p class="pdp__price">' + Store.money(unitPrice());
    if (product.compareAt) {
      /* Shift the was-price by the same size delta, so the pair always
         describes the size actually selected. */
      var delta = unitPrice() - product.price;
      html += '<del>' + Store.money(product.compareAt + delta) + '</del>';
    }
    html += '</p>';
    return html;
  }

  function variantBlock() {
    if (!product.sizes) return '';
    return '<fieldset class="variant-group">' +
      '<legend>' + UI.escapeHtml(product.sizeLabel || 'Option') + '</legend>' +
      '<div class="variants">' +
        product.sizes.map(function (size) {
          return '<button type="button" data-variant="' + UI.escapeHtml(size.label) + '" aria-pressed="' +
            (size.label === variant) + '">' + UI.escapeHtml(size.label) + '</button>';
        }).join('') +
      '</div>' +
    '</fieldset>';
  }

  function specRows() {
    return Object.keys(product.specs).map(function (key) {
      return '<tr><th scope="row">' + UI.escapeHtml(key) + '</th><td>' +
        UI.escapeHtml(product.specs[key]) + '</td></tr>';
    }).join('');
  }

  function render() {
    var tones = toneVariants(product.tone);

    doc.querySelector('[data-pdp]').innerHTML =
      '<nav class="breadcrumbs" style="padding-top:1.5rem" aria-label="Breadcrumb">' +
        '<a href="index.html">Home</a> <span aria-hidden="true">/</span> ' +
        '<a href="shop.html?category=' + product.category + '">' + UI.categoryName(product.category) + '</a> ' +
        '<span aria-hidden="true">/</span> <span>' + UI.escapeHtml(product.name) + '</span>' +
      '</nav>' +
      '<div class="pdp">' +
        '<div>' +
          '<div class="pdp__media" data-main-art>' + Art.render(product) + '</div>' +
          '<div class="pdp__thumbs">' +
            tones.map(function (tone, i) {
              return '<button type="button" data-thumb="' + i + '" aria-label="View ' +
                UI.escapeHtml(product.name) + ', image ' + (i + 1) + '" ' +
                'style="border:0;padding:0;background:none;cursor:pointer;border-radius:8px;overflow:hidden">' +
                Art.render({ art: product.art, tone: tone, name: product.name }, { label: '' }) +
                '</button>';
            }).join('') +
          '</div>' +
        '</div>' +

        '<div>' +
          (product.badges && product.badges.length
            ? '<div class="cluster" style="margin-bottom:.9rem">' +
              product.badges.map(function (b) {
                return '<span class="pill pill--accent">' + UI.escapeHtml(b) + '</span>';
              }).join('') + '</div>'
            : '') +
          '<h1>' + UI.escapeHtml(product.name) + '</h1>' +
          '<span class="rating"><span class="stars" aria-hidden="true">' + UI.stars(product.rating) +
            '</span>' + product.rating.toFixed(1) + ' from ' +
            product.reviews.toLocaleString(global.HUSH_CONFIG.locale) + ' reviews</span>' +
          '<div data-price-slot>' + priceBlock() + '</div>' +
          '<p class="lead" style="margin-top:1rem">' + UI.escapeHtml(product.blurb) + '</p>' +

          '<div data-variant-slot>' + variantBlock() + '</div>' +

          '<div class="variant-group">' +
            '<span class="label">Quantity</span>' +
            '<div class="qty">' +
              '<button type="button" data-qty-dec aria-label="Decrease quantity">−</button>' +
              '<span data-qty>1</span>' +
              '<button type="button" data-qty-inc aria-label="Increase quantity">+</button>' +
            '</div>' +
          '</div>' +

          '<div class="buy-row">' +
            '<button class="btn btn--lg" type="button" data-pdp-add>Add to cart · ' +
              '<span data-total-price>' + Store.money(unitPrice()) + '</span></button>' +
            '<a class="btn btn--ghost btn--lg" href="quiz.html">Take the fit quiz</a>' +
          '</div>' +
          '<p class="callout" style="margin-top:1.2rem">Free delivery over ' +
            Store.money(global.HUSH_CONFIG.freeShippingFrom) + '. ' +
            (product.specs.Trial ? product.specs.Trial + ' to change your mind.' : 'Returns accepted within 30 days.') +
          '</p>' +

          '<ul class="feature-list">' +
            product.features.map(function (f) {
              return '<li>' + UI.escapeHtml(f) + '</li>';
            }).join('') +
          '</ul>' +

          '<div style="margin-top:2rem">' +
            accordion('Full description',
              product.description.map(function (para) {
                return '<p>' + UI.escapeHtml(para) + '</p>';
              }).join(''), true) +
            accordion('Specifications', '<table class="spec-table"><tbody>' + specRows() + '</tbody></table>') +
            accordion('Delivery and returns',
              '<p>Free delivery Australia-wide on orders over ' +
              Store.money(global.HUSH_CONFIG.freeShippingFrom) + ', otherwise ' +
              Store.money(global.HUSH_CONFIG.shippingFlat) + ' flat. Metro orders usually arrive in two to ' +
              'five working days; regional can take a week.</p>' +
              '<p>Mattresses include removal of your old one at no charge. Returns inside the trial ' +
              'window are collected by us — you do not need the original box.</p>') +
          '</div>' +
        '</div>' +
      '</div>';

    renderRelated();
    bind();
  }

  function accordion(title, body, open) {
    return '<details class="accordion"' + (open ? ' open' : '') + '>' +
      '<summary>' + title + '</summary>' +
      '<div class="accordion__body">' + body + '</div>' +
    '</details>';
  }

  function renderRelated() {
    var related = global.HUSH_PRODUCTS.filter(function (p) {
      return p.id !== product.id && p.category === product.category;
    });
    /* Fill out the row with anything sharing a tag when the category is small. */
    if (related.length < 3) {
      global.HUSH_PRODUCTS.forEach(function (p) {
        if (related.length >= 3 || p.id === product.id || related.indexOf(p) !== -1) return;
        var shared = (p.match || []).some(function (tag) {
          return (product.match || []).indexOf(tag) !== -1;
        });
        if (shared) related.push(p);
      });
    }
    related = related.slice(0, 3);
    if (!related.length) return;

    doc.querySelector('[data-related]').innerHTML =
      '<section class="section section--alt">' +
        '<div class="wrap">' +
          '<div class="section__head"><div>' +
            '<p class="eyebrow">Often bought together</p>' +
            '<h2>Goes with this</h2>' +
          '</div></div>' +
          '<div class="grid grid--3">' +
            related.map(function (p) { return UI.productCard(p); }).join('') +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function refreshPrice() {
    doc.querySelector('[data-price-slot]').innerHTML = priceBlock();
    doc.querySelector('[data-total-price]').textContent = Store.money(unitPrice() * qty);
    doc.querySelector('[data-qty]').textContent = qty;
  }

  function bind() {
    doc.querySelector('[data-pdp]').addEventListener('click', function (event) {
      var el = event.target.closest('[data-variant], [data-qty-inc], [data-qty-dec], [data-pdp-add], [data-thumb]');
      if (!el) return;

      if (el.hasAttribute('data-variant')) {
        variant = el.getAttribute('data-variant');
        doc.querySelectorAll('[data-variant]').forEach(function (btn) {
          btn.setAttribute('aria-pressed', String(btn.getAttribute('data-variant') === variant));
        });
        refreshPrice();
        return;
      }

      if (el.hasAttribute('data-thumb')) {
        var tone = toneVariants(product.tone)[Number(el.getAttribute('data-thumb'))];
        doc.querySelector('[data-main-art]').innerHTML =
          Art.render({ art: product.art, tone: tone, name: product.name });
        return;
      }

      if (el.hasAttribute('data-qty-inc')) { qty = Math.min(99, qty + 1); return refreshPrice(); }
      if (el.hasAttribute('data-qty-dec')) { qty = Math.max(1, qty - 1); return refreshPrice(); }

      if (el.hasAttribute('data-pdp-add')) {
        Store.add(product.id, variant, qty);
        UI.toast(product.name + ' added to cart');
        UI.openCart();
      }
    });
  }

  function init() {
    product = Store.byId(productId());
    if (!product) return notFound();
    variant = Store.defaultVariant(product);
    /* The page is one file serving every product, so the metadata is filled in
       from the catalogue rather than written into the HTML. */
    var title = product.name + ' — Hush';
    doc.title = title;
    setMeta('name', 'description', product.blurb);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', product.blurb);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', product.blurb);
    render();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
