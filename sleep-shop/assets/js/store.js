/* Sleep Shop — cart state and pricing.
   No DOM access here, so the same file runs under node in tests/.

   A line is a product id, plus, for the box only, a ribbon and the message we
   hand-write on the card. Two boxes going to two different people are two
   lines even though the product is identical — the message is what
   distinguishes them. The individual pieces have no options, so a piece is
   one line however many are in the cart. */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'sleepshop.cart.v1';
  var config = global.SLEEP_CONFIG || {};
  var box = global.SLEEP_BOX || {};
  var find = global.SLEEP_FIND || function () { return null; };

  function isBox(id) {
    return id === box.id;
  }

  function ribbons() {
    return (box.ribbons || []).map(function (r) { return r.label; });
  }

  function defaultRibbon() {
    return ribbons()[0] || null;
  }

  function isRibbon(label) {
    return ribbons().indexOf(label) !== -1;
  }

  /* Messages are written by hand onto a small card, so the limit is physical. */
  function tidyMessage(text) {
    var limit = config.giftMessageLimit || 250;
    return String(text == null ? '' : text).replace(/\s+/g, ' ').trim().slice(0, limit);
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
      ls.setItem('sleepshop.probe', '1');
      ls.removeItem('sleepshop.probe');
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
      return Array.isArray(parsed) ? parsed.map(normalise).filter(Boolean) : [];
    } catch (err) {
      return [];
    }
  }

  function normalise(line) {
    if (!line || !(line.qty > 0)) return null;
    /* Carts saved before the shop existed have no id — those lines are boxes. */
    var id = line.id || box.id;
    if (!find(id)) return null;
    if (isBox(id) && !isRibbon(line.ribbon)) return null;
    return {
      id: id,
      ribbon: isBox(id) ? line.ribbon : '',
      message: isBox(id) ? tidyMessage(line.message) : '',
      qty: Math.min(20, Math.max(1, Math.floor(line.qty)))
    };
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
      listeners = listeners.filter(function (l) { return l !== fn; });
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

  function keyOf(id, ribbon, message) {
    return id + '|' + (ribbon || '') + '|' + tidyMessage(message);
  }

  function lineKey(line) {
    return keyOf(line.id, line.ribbon, line.message);
  }

  function add(id, ribbon, message, qty) {
    var product = find(id);
    if (!product) return summary();

    var chosen = '';
    var note = '';
    if (isBox(id)) {
      chosen = isRibbon(ribbon) ? ribbon : defaultRibbon();
      if (!chosen) return summary();
      note = tidyMessage(message);
    }

    var count = Math.max(1, Math.floor(qty || 1));
    var lines = read();
    var found = false;

    for (var i = 0; i < lines.length; i++) {
      if (lineKey(lines[i]) === keyOf(id, chosen, note)) {
        lines[i].qty = Math.min(20, lines[i].qty + count);
        found = true;
        break;
      }
    }
    if (!found) lines.push({ id: id, ribbon: chosen, message: note, qty: Math.min(20, count) });
    write(lines);
    return summary();
  }

  function setQty(id, ribbon, message, qty) {
    var next = Math.floor(qty);
    var lines = read().map(function (line) {
      if (lineKey(line) === keyOf(id, ribbon, message)) {
        return { id: line.id, ribbon: line.ribbon, message: line.message, qty: Math.min(20, next) };
      }
      return line;
    }).filter(function (line) {
      return line.qty > 0;
    });
    write(lines);
    return summary();
  }

  /* Only a box carries a message, so this is a no-op on the pieces. */
  function setMessage(id, ribbon, message, nextMessage) {
    if (!isBox(id)) return summary();
    var note = tidyMessage(nextMessage);
    var lines = read();
    var index = -1;

    for (var i = 0; i < lines.length; i++) {
      if (lineKey(lines[i]) === keyOf(id, ribbon, message)) {
        index = i;
        break;
      }
    }
    if (index === -1) return summary();
    var target = lines[index];

    /* Editing a message can collide with a line that already carries it. */
    for (var j = 0; j < lines.length; j++) {
      if (j !== index && lineKey(lines[j]) === keyOf(id, target.ribbon, note)) {
        lines[j].qty = Math.min(20, lines[j].qty + target.qty);
        lines.splice(index, 1);
        write(lines);
        return summary();
      }
    }

    /* Otherwise edit in place, so the box keeps its position in the cart. */
    lines[index] = { id: target.id, ribbon: target.ribbon, message: note, qty: target.qty };
    write(lines);
    return summary();
  }

  function remove(id, ribbon, message) {
    return setQty(id, ribbon, message, 0);
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

  /* options: { promo: 'CODE', express: true } */
  function summary(options) {
    var opts = options || {};

    var lines = read().map(function (line) {
      var product = find(line.id) || {};
      var unit = product.price || 0;
      return {
        id: line.id,
        name: product.name || line.id,
        isBox: isBox(line.id),
        ribbon: line.ribbon,
        message: line.message,
        qty: line.qty,
        unitPrice: unit,
        lineTotal: unit * line.qty
      };
    });

    var subtotal = lines.reduce(function (sum, l) { return sum + l.lineTotal; }, 0);
    var count = lines.reduce(function (sum, l) { return sum + l.qty; }, 0);

    var rate = promoRate(opts.promo);
    var discount = Math.round(subtotal * rate * 100) / 100;
    /* Standard delivery is free on everything, so shipping is opt-in only. */
    var shipping = count && opts.express ? (config.expressFee || 0) : 0;

    return {
      lines: lines,
      count: count,
      boxes: lines.filter(function (l) { return l.isBox; })
        .reduce(function (sum, l) { return sum + l.qty; }, 0),
      subtotal: subtotal,
      discount: discount,
      discountRate: rate,
      shipping: shipping,
      express: !!(count && opts.express),
      total: subtotal - discount + shipping,
      written: lines.filter(function (l) { return !!l.message; }).length
    };
  }

  var Store = {
    STORAGE_KEY: STORAGE_KEY,
    box: box,
    isBox: isBox,
    ribbons: ribbons,
    defaultRibbon: defaultRibbon,
    isRibbon: isRibbon,
    tidyMessage: tidyMessage,
    money: money,
    add: add,
    setQty: setQty,
    setMessage: setMessage,
    remove: remove,
    clear: clear,
    summary: summary,
    promoRate: promoRate,
    subscribe: subscribe
  };

  global.SleepStore = Store;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Store;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
