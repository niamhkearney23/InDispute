/* Hush Sleep Shop — cart state and pricing.
   No DOM access here, so the same file runs under node in tests/. */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'hush.cart.v1';
  var config = global.HUSH_CONFIG || {};
  var products = global.HUSH_PRODUCTS || [];

  function byId(id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) return products[i];
    }
    return null;
  }

  /* A product's price for a given variant label. Unknown variants fall back
     to the base price rather than throwing — a stale cart shouldn't break the page. */
  function priceFor(product, variant) {
    if (!product) return 0;
    if (!product.sizes || !variant) return product.price;
    for (var i = 0; i < product.sizes.length; i++) {
      if (product.sizes[i].label === variant) {
        return product.price + product.sizes[i].delta;
      }
    }
    return product.price;
  }

  function defaultVariant(product) {
    if (!product || !product.sizes || !product.sizes.length) return null;
    /* The zero-delta size is the advertised one; otherwise take the first. */
    for (var i = 0; i < product.sizes.length; i++) {
      if (product.sizes[i].delta === 0) return product.sizes[i].label;
    }
    return product.sizes[0].label;
  }

  function priceRange(product) {
    if (!product.sizes || !product.sizes.length) {
      return { min: product.price, max: product.price };
    }
    var min = Infinity;
    var max = -Infinity;
    for (var i = 0; i < product.sizes.length; i++) {
      var p = product.price + product.sizes[i].delta;
      if (p < min) min = p;
      if (p > max) max = p;
    }
    return { min: min, max: max };
  }

  function money(value) {
    var n = Math.round(value * 100) / 100;
    var whole = n % 1 === 0;
    try {
      return new Intl.NumberFormat(config.locale || 'en-AU', {
        style: 'currency',
        currency: config.currency || 'AUD',
        minimumFractionDigits: whole ? 0 : 2,
        maximumFractionDigits: whole ? 0 : 2
      }).format(n);
    } catch (err) {
      return '$' + n.toFixed(whole ? 0 : 2);
    }
  }

  /* ------------------------------------------------------------- storage */

  function safeStorage() {
    try {
      var ls = global.localStorage;
      if (!ls) return null;
      ls.setItem('hush.probe', '1');
      ls.removeItem('hush.probe');
      return ls;
    } catch (err) {
      return null; /* private mode, or no storage at all */
    }
  }

  var storage = safeStorage();
  var memory = null;

  function read() {
    if (!storage) return memory ? memory.slice() : [];
    try {
      var raw = storage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(isUsableLine) : [];
    } catch (err) {
      return [];
    }
  }

  function isUsableLine(line) {
    return !!line && typeof line.id === 'string' && byId(line.id) && line.qty > 0;
  }

  function write(lines) {
    memory = lines.slice();
    if (storage) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(lines));
      } catch (err) {
        /* Quota or private mode — the in-memory copy still serves this page. */
      }
    }
    emit();
  }

  /* ----------------------------------------------------------- listeners */

  var listeners = [];

  function subscribe(fn) {
    listeners.push(fn);
    return function unsubscribe() {
      listeners = listeners.filter(function (l) {
        return l !== fn;
      });
    };
  }

  function emit() {
    var snapshot = summary();
    listeners.forEach(function (fn) {
      try {
        fn(snapshot);
      } catch (err) {
        if (global.console) global.console.error(err);
      }
    });
  }

  /* --------------------------------------------------------------- cart */

  function keyOf(id, variant) {
    return id + '::' + (variant || '');
  }

  function add(id, variant, qty) {
    var product = byId(id);
    if (!product) return summary();
    var count = Math.max(1, Math.floor(qty || 1));
    var chosen = variant || defaultVariant(product);
    var lines = read();
    var found = false;
    for (var i = 0; i < lines.length; i++) {
      if (keyOf(lines[i].id, lines[i].variant) === keyOf(id, chosen)) {
        lines[i].qty = Math.min(99, lines[i].qty + count);
        found = true;
        break;
      }
    }
    if (!found) lines.push({ id: id, variant: chosen, qty: Math.min(99, count) });
    write(lines);
    return summary();
  }

  function setQty(id, variant, qty) {
    var next = Math.floor(qty);
    var lines = read().map(function (line) {
      if (keyOf(line.id, line.variant) === keyOf(id, variant)) {
        return { id: line.id, variant: line.variant, qty: next };
      }
      return line;
    }).filter(function (line) {
      return line.qty > 0;
    });
    write(lines);
    return summary();
  }

  function remove(id, variant) {
    return setQty(id, variant, 0);
  }

  function clear() {
    write([]);
    return summary();
  }

  function promoRate(code) {
    if (!code) return 0;
    var codes = config.promoCodes || {};
    return codes[String(code).trim().toUpperCase()] || 0;
  }

  function summary(promoCode) {
    var lines = read().map(function (line) {
      var product = byId(line.id);
      var unit = priceFor(product, line.variant);
      return {
        id: line.id,
        variant: line.variant,
        qty: line.qty,
        product: product,
        unitPrice: unit,
        lineTotal: unit * line.qty
      };
    });

    var subtotal = lines.reduce(function (sum, line) {
      return sum + line.lineTotal;
    }, 0);
    var count = lines.reduce(function (sum, line) {
      return sum + line.qty;
    }, 0);

    var rate = promoRate(promoCode);
    var discount = Math.round(subtotal * rate * 100) / 100;
    var afterDiscount = subtotal - discount;
    var threshold = config.freeShippingFrom || 0;
    var shipping = count === 0 || afterDiscount >= threshold ? 0 : (config.shippingFlat || 0);

    return {
      lines: lines,
      count: count,
      subtotal: subtotal,
      discount: discount,
      discountRate: rate,
      shipping: shipping,
      total: afterDiscount + shipping,
      freeShippingRemaining: Math.max(0, threshold - afterDiscount)
    };
  }

  var Store = {
    STORAGE_KEY: STORAGE_KEY,
    byId: byId,
    priceFor: priceFor,
    priceRange: priceRange,
    defaultVariant: defaultVariant,
    money: money,
    add: add,
    setQty: setQty,
    remove: remove,
    clear: clear,
    summary: summary,
    promoRate: promoRate,
    subscribe: subscribe
  };

  global.HushStore = Store;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Store;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
