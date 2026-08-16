/* ==========================================================================
   Lawgistics, data layer
   One seam between UI and persistence, in two modes:

   remote, hydrates an in-memory cache from the live Payload REST API
            (via the serve.py proxy at /api) and writes back with
            POST/PATCH/DELETE. Auth is Payload's own /users/login; the JWT
            lives in sessionStorage and goes out as an Authorization header.

   local, the original demo mode: seed data + localStorage. Used when
            remote is off, the API is unreachable, or a collection denies
            anonymous reads (the public site before you log in).

   The read/write API (list/get/create/update/remove) is synchronous over
   the cache either way, so no page code changes between modes. Call
   Store.init() once before rendering; it resolves when hydration settles.
   ========================================================================== */

(function (global) {
  'use strict';

  var CFG = global.LG_CONFIG || { remote: false, apiBase: '/api', slugs: {}, globals: {} };
  var KEY = 'lawgistics.db.v1';
  var SESSION_KEY = 'lawgistics.session';
  var GLOBALS = ['pricing'];

  var db = null;
  var remoteLive = {};   // collection key -> true once hydrated from the API
  var initPromise = null;

  // Public forms POST to the API even without a session, Payload allows
  // anonymous create on these (verified: empty POST returns 400 validation,
  // not 403 access denied). Failures fall back to the local record silently.
  var PUBLIC_CREATE = ['contactSubmissions', 'enquirySubmissions', 'newsletterLeads',
                       'quizSubscribers', 'documentsToReview'];

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  /* ------------------------------------------------------------- local -- */

  function load() {
    if (db) return db;
    var raw = null;
    try { raw = global.localStorage.getItem(KEY); } catch (e) { /* private mode */ }
    if (raw) {
      try { db = JSON.parse(raw); } catch (e) { db = null; }
    }
    if (!db) {
      db = clone(global.LG_SEED || {});
    } else {
      var seed = global.LG_SEED || {};
      Object.keys(seed).forEach(function (k) {
        if (db[k] === undefined) db[k] = clone(seed[k]);
      });
    }
    return db;
  }

  function persist() {
    // Only demo data is persisted locally; live API data stays in memory.
    // Collections hydrated from the API are swapped back to their seed
    // values so stale production data never freezes into localStorage.
    if (!isRemote()) {
      try {
        var seed = global.LG_SEED || {};
        var saved = {};
        Object.keys(db).forEach(function (k) {
          saved[k] = remoteLive[k] ? clone(seed[k] || []) : db[k];
        });
        global.localStorage.setItem(KEY, JSON.stringify(saved));
      } catch (e) {}
    }
    global.dispatchEvent(new CustomEvent('lg:changed'));
  }

  function nextId(collection) {
    return collection.slice(0, 2) + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ------------------------------------------------------------ session -- */

  function session() {
    try {
      var raw = global.sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveSession(s) {
    try {
      if (s) global.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else global.sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  function isRemote() {
    var s = session();
    return !!(CFG.remote && s && s.mode === 'remote');
  }

  /* --------------------------------------------------------------- api -- */

  function authHeaders() {
    var s = session();
    var h = { 'Content-Type': 'application/json' };
    if (s && s.token) h.Authorization = 'JWT ' + s.token;
    return h;
  }

  function api(method, path, body) {
    return fetch(CFG.apiBase + path, {
      method: method,
      headers: authHeaders(),
      body: body === undefined ? undefined : JSON.stringify(body)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (json) {
        if (!res.ok) {
          var msg = (json.errors && json.errors[0] && json.errors[0].message) || ('HTTP ' + res.status);
          var err = new Error(msg);
          err.status = res.status;
          throw err;
        }
        return json;
      });
    });
  }

  function hydrateCollection(key) {
    var slug = CFG.slugs[key];
    if (!slug) return Promise.resolve(false);
    return api('GET', '/' + slug + '?limit=500&depth=0&sort=-createdAt')
      .then(function (json) {
        load()[key] = json.docs || [];
        remoteLive[key] = true;
        return true;
      })
      .catch(function () { remoteLive[key] = false; return false; });
  }

  function hydrateGlobal(key) {
    var slug = CFG.globals[key];
    if (!slug) return Promise.resolve(false);
    return api('GET', '/globals/' + slug + '?depth=0')
      .then(function (json) {
        load()[key] = json;
        remoteLive[key] = true;
        return true;
      })
      .catch(function () { remoteLive[key] = false; return false; });
  }

  function hydrate() {
    var jobs = Object.keys(CFG.slugs).map(hydrateCollection)
      .concat(Object.keys(CFG.globals).map(hydrateGlobal));
    return Promise.all(jobs).then(function (results) {
      var ok = results.filter(Boolean).length;
      global.dispatchEvent(new CustomEvent('lg:hydrated', { detail: { live: ok } }));
      return ok;
    });
  }

  /* -------------------------------------------------------------- Store -- */

  /* --------------------------------------------------------- webhooks --
     Fire-and-forget notifications to n8n. Never blocks the caller and never
     surfaces an error to the user: automation failing must not break a form.
     Configure the URLs in assets/js/config.js under LG_CONFIG.n8n. */
  function notify(hook, payload) {
    try {
      var cfg = (global.LG_CONFIG && global.LG_CONFIG.n8n) || {};
      var url = cfg[hook];
      if (!url) return;
      global.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () { /* automation is best-effort */ });
    } catch (e) { /* never let this throw */ }
  }

  var Store = {

    /* Expose the emitter so pages can fire their own events. */
    notify: notify,

    /* Resolve once data is ready. Hydration is attempted whenever the API
       is configured and the session isn't explicitly demo-mode, anonymous
       visitors included, so collections go live on the public site the
       moment Payload's read access allows them. 403s keep seed data.
       Safe to call more than once. */
    init: function () {
      if (initPromise) return initPromise;
      load();
      var s = session();
      var wantRemote = CFG.remote && (!s || s.mode === 'remote');
      initPromise = wantRemote ? hydrate() : Promise.resolve(0);
      return initPromise;
    },

    isLive: function (collection) {
      if (collection === undefined) {
        return Object.keys(remoteLive).some(function (k) { return remoteLive[k]; });
      }
      return !!remoteLive[collection];
    },

    /* ---------------------------------------------------------- reads -- */

    list: function (collection, opts) {
      opts = opts || {};
      var rows = clone(load()[collection] || []);

      if (opts.where) {
        Object.keys(opts.where).forEach(function (k) {
          var want = opts.where[k];
          rows = rows.filter(function (r) { return r[k] === want; });
        });
      }

      if (opts.search && opts.searchFields) {
        var q = String(opts.search).toLowerCase();
        rows = rows.filter(function (r) {
          return opts.searchFields.some(function (f) {
            return String(r[f] == null ? '' : r[f]).toLowerCase().indexOf(q) !== -1;
          });
        });
      }

      if (opts.sort) {
        var dir = opts.order === 'desc' ? -1 : 1;
        rows.sort(function (a, b) {
          var x = a[opts.sort], y = b[opts.sort];
          if (x == null) return 1;
          if (y == null) return -1;
          if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
          return String(x).localeCompare(String(y), 'en', { numeric: true }) * dir;
        });
      }

      if (opts.limit) rows = rows.slice(0, opts.limit);
      return rows;
    },

    get: function (collection, id) {
      if (GLOBALS.indexOf(collection) !== -1) return clone(load()[collection] || {});
      var row = (load()[collection] || []).filter(function (r) { return r.id === id; })[0];
      return row ? clone(row) : null;
    },

    count: function (collection, where) {
      return Store.list(collection, { where: where }).length;
    },

    label: function (collection, id, field) {
      // Payload with depth>0 can hand back a populated object instead of an id.
      if (id && typeof id === 'object') return id[field || 'name'] || id.title || id.id || ', ';
      var row = Store.get(collection, id);
      if (!row) return ', ';
      return row[field || 'name'] || row.title || row.id;
    },

    /* --------------------------------------------------------- writes -- */
    /* Optimistic: the cache mutates synchronously so the UI is instant;
       in remote mode the API write follows and reconciles or reverts. */

    create: function (collection, data) {
      var d = load();
      if (!d[collection]) d[collection] = [];
      var row = clone(data);
      row.id = row.id || nextId(collection);
      if (!row.createdAt && !row.date) row.createdAt = new Date().toISOString().slice(0, 10);
      d[collection].unshift(row);
      persist();

      var publicForm = PUBLIC_CREATE.indexOf(collection) !== -1;
      if ((isRemote() || (CFG.remote && publicForm)) && CFG.slugs[collection]) {
        var tempId = row.id;
        var payload = clone(row);
        delete payload.id;
        api('POST', '/' + CFG.slugs[collection], payload)
          .then(function (json) {
            var docs = load()[collection];
            var saved = json.doc || json;
            for (var i = 0; i < docs.length; i++) {
              if (docs[i].id === tempId) { docs[i] = saved; break; }
            }
            global.dispatchEvent(new CustomEvent('lg:changed'));
          })
          .catch(function (err) {
            if (publicForm && !isRemote()) {
              // Anonymous form submit rejected upstream (field mismatch or
              // access change): keep the local record so nothing is lost.
              return;
            }
            Store.removeLocal(collection, tempId);
            global.dispatchEvent(new CustomEvent('lg:writeError', { detail: { op: 'create', collection: collection, message: err.message } }));
          });
      }
      return clone(row);
    },

    update: function (collection, id, patch) {
      var d = load();

      if (GLOBALS.indexOf(collection) !== -1) {
        var before = clone(d[collection]);
        d[collection] = Object.assign({}, d[collection], patch);
        persist();
        if (isRemote() && CFG.globals[collection]) {
          api('POST', '/globals/' + CFG.globals[collection], patch)
            .catch(function (err) {
              d[collection] = before;
              global.dispatchEvent(new CustomEvent('lg:writeError', { detail: { op: 'update', collection: collection, message: err.message } }));
            });
        }
        return clone(d[collection]);
      }

      var rows = d[collection] || [];
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].id === id) {
          var prev = clone(rows[i]);
          rows[i] = Object.assign({}, rows[i], patch);
          persist();
          if (isRemote() && CFG.slugs[collection]) {
            api('PATCH', '/' + CFG.slugs[collection] + '/' + encodeURIComponent(id), patch)
              .catch(function (err) {
                var docs = load()[collection];
                for (var j = 0; j < docs.length; j++) {
                  if (docs[j].id === id) { docs[j] = prev; break; }
                }
                global.dispatchEvent(new CustomEvent('lg:writeError', { detail: { op: 'update', collection: collection, message: err.message } }));
              });
          }
          return clone(rows[i]);
        }
      }
      return null;
    },

    removeLocal: function (collection, id) {
      var d = load();
      d[collection] = (d[collection] || []).filter(function (r) { return r.id !== id; });
      persist();
    },

    remove: function (collection, id) {
      var d = load();
      var removed = (d[collection] || []).filter(function (r) { return r.id === id; })[0];
      if (!removed) return false;
      Store.removeLocal(collection, id);

      if (isRemote() && CFG.slugs[collection]) {
        api('DELETE', '/' + CFG.slugs[collection] + '/' + encodeURIComponent(id))
          .catch(function (err) {
            load()[collection].unshift(removed);
            global.dispatchEvent(new CustomEvent('lg:writeError', { detail: { op: 'delete', collection: collection, message: err.message } }));
          });
      }
      return true;
    },

    removeMany: function (collection, ids) {
      ids.forEach(function (id) { Store.remove(collection, id); });
    },

    reset: function () {
      db = clone(global.LG_SEED || {});
      persist();
    },

    exportJSON: function () {
      return JSON.stringify(load(), null, 2);
    },

    /* ----------------------------------------------------------- auth -- */

    /* Remote-first: credentials go straight to Payload's own login
       endpoint and never touch anything else. Returns a Promise. */
    signIn: function (email, password, opts) {
      opts = opts || {};
      email = String(email).trim();

      if (CFG.remote && !opts.forceLocal) {
        return api('POST', '/users/login', { email: email, password: password })
          .then(function (json) {
            var u = json.user || {};
            var s = {
              mode: 'remote',
              id: u.id,
              email: u.email || email,
              name: u.name || (u.email || email).split('@')[0],
              // Payload users without an explicit role field get full
              // access here, the real gate is the API's own access control.
              role: u.role || u.roles && u.roles[0] || 'admin',
              token: json.token
            };
            saveSession(s);
            initPromise = null; // re-hydrate with the token on next init()
            return s;
          });
      }

      // Local demo fallback (never used for real accounts).
      var user = Store.list('users').filter(function (u) {
        return u.email.toLowerCase() === email.toLowerCase();
      })[0];
      if (!user || user.password !== password) {
        return Promise.reject(new Error('Those credentials did not match an account.'));
      }
      var s = { mode: 'local', id: user.id, email: user.email, name: user.name, role: user.role };
      saveSession(s);
      return Promise.resolve(s);
    },

    session: session,

    signOut: function () {
      saveSession(null);
      initPromise = null;
      remoteLive = {};
      db = null;
    }
  };

  global.Store = Store;

})(window);
