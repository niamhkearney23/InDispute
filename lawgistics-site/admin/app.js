/* ==========================================================================
   Lawgistics Admin, application shell
   Hash router + generic list/edit views driven entirely by LG_SCHEMA.
   ========================================================================== */

(function () {
  'use strict';

  var S = window.LG_SCHEMA;
  var COLL = S.collections;

  /* ---------------------------------------------------------------- svg -- */

  var SVG = {
    logo: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 2.6 21 7.4v9.2L12 21.4 3 16.6V7.4z"/><path d="M12 2.6v18.8M3 7.4l9 4.8 9-4.8"/></svg>',
    chevron: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 7.5 6 4l3.5 3.5"/></svg>',
    back: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 5 8l5 5"/></svg>',
    plus: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 2.5v9M2.5 7h9"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="8" cy="8" r="5.2"/><path d="m12 12 3.5 3.5"/></svg>',
    up: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 7.5 6 4l3.5 3.5"/></svg>',
    down: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>',
    out: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14.5v2a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 3 16.5v-13A1.5 1.5 0 0 1 4.5 2h6A1.5 1.5 0 0 1 12 3.5v2"/><path d="M16.5 10H7m9.5 0-3-3m3 3-3 3"/></svg>',
    menu: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 6h14M3 10h14M3 14h14"/></svg>'
  };

  /* -------------------------------------------------------------- utils -- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return String(d.getDate()).padStart(2, '0') + '/' +
           String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }

  function today() { return new Date().toISOString().slice(0, 10); }

  function titleCase(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }

  var toastTimer;
  function toast(msg, isErr) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast is-on' + (isErr ? ' toast--err' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast' + (isErr ? ' toast--err' : ''); }, 2800);
  }

  function rowTitle(slug, row) {
    var def = COLL[slug];
    return row[def.useAsTitle] || row.title || row.name || row.id;
  }

  /* --------------------------------------------------------------- auth -- */

  function guard() {
    var s = Store.session();
    if (!s || (s.role !== 'admin' && s.role !== 'editor')) {
      location.replace('login.html?next=' + encodeURIComponent(location.hash || '#/'));
      return null;
    }
    return s;
  }

  /* ------------------------------------------------------------ sidebar -- */

  var collapsed = {};
  try { collapsed = JSON.parse(localStorage.getItem('lawgistics.admin.groups') || '{}'); } catch (e) {}

  function renderSidebar(active) {
    var host = document.getElementById('side-nav');
    host.innerHTML = S.groups.map(function (g) {
      var items = g.collections.map(function (slug) {
        var def = COLL[slug];
        if (!def) return '';
        var href = def.global ? '#/globals/' + slug : '#/collections/' + slug;
        var count = def.global ? '' : '<span class="navitem__count">' + Store.list(slug).length + '</span>';
        var on = active === slug ? ' is-active' : '';
        return '<a class="navitem' + on + '" href="' + href + '">' + count + esc(def.label) + '</a>';
      }).join('');
      var isC = collapsed[g.label] ? ' is-collapsed' : '';
      return '<div class="navgroup' + isC + '" data-group="' + esc(g.label) + '">' +
        '<button class="navgroup__head" type="button" aria-expanded="' + (isC ? 'false' : 'true') + '">' +
          esc(g.label) + SVG.chevron + '</button>' +
        '<div class="navgroup__items">' + items + '</div></div>';
    }).join('');

    host.querySelectorAll('.navgroup__head').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var g = btn.parentElement;
        var key = g.getAttribute('data-group');
        collapsed[key] = g.classList.toggle('is-collapsed');
        btn.setAttribute('aria-expanded', String(!collapsed[key]));
        try { localStorage.setItem('lawgistics.admin.groups', JSON.stringify(collapsed)); } catch (e) {}
      });
    });
  }

  function crumbs(parts) {
    var html = '<span class="logo-mark">' + SVG.logo + '</span>';
    parts.forEach(function (p, i) {
      html += '<span class="sep">/</span>';
      html += p.href
        ? '<a href="' + p.href + '">' + esc(p.label) + '</a>'
        : '<span class="current">' + esc(p.label) + '</span>';
    });
    document.getElementById('crumbs').innerHTML = html;
  }

  /* ---------------------------------------------------------- dashboard -- */

  function viewDashboard() {
    renderSidebar(null);
    crumbs([{ label: 'Dashboard' }]);

    var newEnq = Store.list('enquirySubmissions', { where: { status: 'new' } }).length;
    var newMsg = Store.list('contactSubmissions', { where: { status: 'new' } }).length;
    var awaiting = Store.list('documentsToReview').filter(function (d) {
      return d.status === 'awaiting review' || d.status === 'in review';
    }).length;
    var pendingRev = Store.list('reviews', { where: { status: 'pending' } }).length;
    var subs = Store.list('newsletterLeads', { where: { status: 'subscribed' } }).length;
    var pub = Store.list('templates', { where: { status: 'published' } }).length;

    var metrics = [
      { label: 'New enquiries', value: newEnq, hint: 'Awaiting a lawyer match', href: '#/collections/enquirySubmissions' },
      { label: 'Unread messages', value: newMsg, hint: 'Contact form', href: '#/collections/contactSubmissions' },
      { label: 'Documents in review', value: awaiting, hint: 'Awaiting or in review', href: '#/collections/documentsToReview' },
      { label: 'Reviews to moderate', value: pendingRev, hint: 'Pending approval', href: '#/collections/reviews' },
      { label: 'Newsletter subscribers', value: subs, hint: 'Active', href: '#/collections/newsletterLeads' },
      { label: 'Published templates', value: pub, hint: 'Live on the site', href: '#/collections/templates' }
    ];

    var html = '<div class="view__head"><h1>Dashboard</h1><div class="spacer"></div>' +
      '<a class="btn btn--ghost" href="../index.html" target="_blank" rel="noopener">View site</a></div>';

    html += '<div class="metric-grid">' + metrics.map(function (m) {
      return '<a class="metric" href="' + m.href + '">' +
        '<div class="metric__label">' + esc(m.label) + '</div>' +
        '<div class="metric__value">' + m.value + '</div>' +
        '<div class="metric__hint">' + esc(m.hint) + '</div></a>';
    }).join('') + '</div>';

    S.groups.forEach(function (g) {
      html += '<h2 class="section-title">' + esc(g.label) + '</h2><div class="card-grid">' +
        g.collections.map(function (slug) {
          var def = COLL[slug];
          if (!def) return '';
          if (def.global) {
            return '<a class="coll-card" href="#/globals/' + slug + '">' +
              '<div class="coll-card__top"><div><div class="coll-card__name">' + esc(def.label) + '</div>' +
              '<div class="coll-card__count">Global settings</div></div></div></a>';
          }
          var n = Store.list(slug).length;
          return '<a class="coll-card" href="#/collections/' + slug + '">' +
            '<div class="coll-card__top">' +
              '<div><div class="coll-card__name">' + esc(def.label) + '</div>' +
              '<div class="coll-card__count">' + n + ' ' + (n === 1 ? 'record' : 'records') + '</div></div>' +
              '<button class="coll-card__add" type="button" data-create="' + slug + '" aria-label="Create ' + esc(def.singular) + '">' + SVG.plus + '</button>' +
            '</div></a>';
        }).join('') + '</div>';
    });

    var view = document.getElementById('view');
    view.innerHTML = html;

    view.querySelectorAll('[data-create]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        location.hash = '#/collections/' + btn.getAttribute('data-create') + '/create';
      });
    });
  }

  /* --------------------------------------------------------------- list -- */

  var listState = {};

  function viewList(slug) {
    var def = COLL[slug];
    if (!def) return viewDashboard();

    renderSidebar(slug);
    crumbs([{ label: def.label }]);

    if (!listState[slug]) {
      listState[slug] = { q: '', sort: def.defaultSort || def.useAsTitle, order: def.defaultOrder || 'asc', filter: 'all', sel: [] };
    }
    var st = listState[slug];

    // status filter chips, derived from whichever column carries a badge map
    var statusCol = (def.columns || []).filter(function (c) { return c.badge && Object.keys(c.badge).length; })[0];

    var view = document.getElementById('view');
    view.innerHTML =
      '<div class="view__head"><h1>' + esc(def.label) + '</h1>' +
        (def.readOnlyCreate ? '' : '<button class="btn" type="button" id="create-btn">Create New</button>') +
      '</div>' +
      '<div class="searchbar">' + SVG.search +
        '<input type="search" id="list-search" placeholder="Search by ' +
          esc((def.search || ['id']).map(function (f) { return titleCase(f); }).join(' or ')) + '" value="' + esc(st.q) + '">' +
      '</div>' +
      (statusCol ? '<div class="filter-row" id="filter-row"></div>' : '') +
      '<div class="bulkbar" id="bulkbar"><span id="bulk-count"></span>' +
        '<button class="btn btn--sm btn--danger" type="button" id="bulk-delete">Delete selected</button>' +
        '<button class="btn btn--sm btn--ghost" type="button" id="bulk-clear">Clear</button></div>' +
      '<div class="table-wrap" id="table-wrap"></div>';

    if (!def.readOnlyCreate) {
      document.getElementById('create-btn').addEventListener('click', function () {
        location.hash = '#/collections/' + slug + '/create';
      });
    }

    var searchEl = document.getElementById('list-search');
    searchEl.addEventListener('input', function () {
      st.q = searchEl.value;
      st.sel = [];
      paint();
    });

    if (statusCol) {
      var opts = ['all'].concat(Object.keys(statusCol.badge));
      var fr = document.getElementById('filter-row');
      fr.innerHTML = opts.map(function (o) {
        return '<button class="filter-chip" type="button" data-f="' + esc(o) + '">' +
          (o === 'all' ? 'All' : titleCase(o)) + '</button>';
      }).join('');
      fr.addEventListener('click', function (e) {
        var b = e.target.closest('[data-f]');
        if (!b) return;
        st.filter = b.getAttribute('data-f');
        st.sel = [];
        paint();
      });
    }

    function rows() {
      var r = Store.list(slug, {
        search: st.q, searchFields: def.search,
        sort: st.sort, order: st.order
      });
      if (statusCol && st.filter !== 'all') {
        r = r.filter(function (x) { return x[statusCol.key] === st.filter; });
      }
      return r;
    }

    function cell(col, row) {
      var v = row[col.key];

      if (col.rel) {
        return esc(Store.label(col.rel, v, 'name'));
      }
      if (col.type === 'date') return '<span class="num muted">' + fmtDate(v) + '</span>';
      if (col.type === 'stars') return '<span class="num">' + '★'.repeat(Number(v) || 0) + '</span>';
      if (col.badge) {
        var tone = col.badge[v] || 'grey';
        return v ? '<span class="badge badge--' + tone + '">' + esc(v) + '</span>' : '<span class="muted">, </span>';
      }
      if (v === '' || v == null) return '<span class="muted">' + esc(col.empty || ', ') + '</span>';
      if (col.truncate && String(v).length > col.truncate) v = String(v).slice(0, col.truncate) + '…';
      if (col.type === 'number') return '<span class="num">' + esc((col.prefix || '') + v) + '</span>';
      return esc((col.prefix || '') + v);
    }

    function paint() {
      if (statusCol) {
        document.querySelectorAll('#filter-row [data-f]').forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-f') === st.filter);
        });
      }

      var data = rows();
      var wrap = document.getElementById('table-wrap');

      if (!data.length) {
        wrap.innerHTML = '<div class="empty">No ' + esc(def.label.toLowerCase()) + ' match this view.</div>';
        syncBulk();
        return;
      }

      var head = '<tr><th class="col-check"><input class="checkbox" type="checkbox" id="check-all"></th>' +
        def.columns.map(function (c) {
          var isSort = st.sort === c.key;
          return '<th><span class="sorter">' + esc(c.label) +
            '<button type="button" data-sort="' + esc(c.key) + '" data-dir="asc" class="' + (isSort && st.order === 'asc' ? 'is-on' : '') + '" aria-label="Sort ascending">' + SVG.up + '</button>' +
            '<button type="button" data-sort="' + esc(c.key) + '" data-dir="desc" class="' + (isSort && st.order === 'desc' ? 'is-on' : '') + '" aria-label="Sort descending">' + SVG.down + '</button>' +
            '</span></th>';
        }).join('') + '<th class="col-actions"></th></tr>';

      var body = data.map(function (row) {
        var checked = st.sel.indexOf(row.id) !== -1 ? ' checked' : '';
        return '<tr>' +
          '<td class="col-check"><input class="checkbox" type="checkbox" aria-label="Select this record" data-pick="' + esc(row.id) + '"' + checked + '></td>' +
          def.columns.map(function (c) {
            var inner = cell(c, row);
            return '<td>' + (c.link
              ? '<a class="cell-link" href="#/collections/' + slug + '/' + esc(row.id) + '">' + inner + '</a>'
              : inner) + '</td>';
          }).join('') +
          '<td class="col-actions"><a class="btn btn--sm btn--ghost" href="#/collections/' + slug + '/' + esc(row.id) + '">Edit</a></td>' +
        '</tr>';
      }).join('');

      wrap.innerHTML = '<table class="tbl"><thead>' + head + '</thead><tbody>' + body + '</tbody></table>';

      wrap.querySelectorAll('[data-sort]').forEach(function (b) {
        b.addEventListener('click', function () {
          st.sort = b.getAttribute('data-sort');
          st.order = b.getAttribute('data-dir');
          paint();
        });
      });

      wrap.querySelectorAll('[data-pick]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var id = cb.getAttribute('data-pick');
          var i = st.sel.indexOf(id);
          if (cb.checked && i === -1) st.sel.push(id);
          if (!cb.checked && i !== -1) st.sel.splice(i, 1);
          syncBulk();
        });
      });

      var all = document.getElementById('check-all');
      all.checked = data.length > 0 && st.sel.length === data.length;
      all.addEventListener('change', function () {
        st.sel = all.checked ? data.map(function (r) { return r.id; }) : [];
        paint();
      });

      syncBulk();
    }

    function syncBulk() {
      var bar = document.getElementById('bulkbar');
      bar.classList.toggle('is-on', st.sel.length > 0);
      document.getElementById('bulk-count').textContent =
        st.sel.length + ' selected';
    }

    document.getElementById('bulk-clear').addEventListener('click', function () {
      st.sel = []; paint();
    });
    document.getElementById('bulk-delete').addEventListener('click', function () {
      if (!confirm('Delete ' + st.sel.length + ' record(s)? This cannot be undone.')) return;
      Store.removeMany(slug, st.sel);
      toast(st.sel.length + ' record(s) deleted');
      st.sel = [];
      renderSidebar(slug);
      paint();
    });

    paint();
  }

  /* --------------------------------------------------------------- edit -- */

  function fieldHTML(f, value) {
    var id = 'f-' + f.key;
    var v = value == null ? '' : value;
    var control;

    if (f.type === 'textarea' || f.type === 'richtext') {
      control = '<textarea class="txt' + (f.type === 'richtext' ? ' txt--tall' : '') + '" id="' + id + '" name="' + f.key + '"' +
        (f.required ? ' required' : '') + '>' + esc(v) + '</textarea>';
    } else if (f.type === 'select') {
      control = '<select class="sel" id="' + id + '" name="' + f.key + '">' +
        f.options.map(function (o) {
          // String(v) makes a stored boolean match its 'true'/'false' option.
          return '<option value="' + esc(o) + '"' + (String(v) === o ? ' selected' : '') + '>' + esc(titleCase(o)) + '</option>';
        }).join('') + '</select>';
    } else if (f.type === 'relationship') {
      var opts = Store.list(f.relTo, { sort: 'order' });
      control = '<select class="sel" id="' + id + '" name="' + f.key + '">' +
        '<option value="">, none, </option>' +
        opts.map(function (o) {
          var label = o.name || o.title || o.id;
          return '<option value="' + esc(o.id) + '"' + (v === o.id ? ' selected' : '') + '>' + esc(label) + '</option>';
        }).join('') + '</select>';
    } else {
      var type = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : 'text';
      control = '<input class="inp" id="' + id + '" name="' + f.key + '" type="' + type + '" value="' + esc(v) + '"' +
        (f.required ? ' required' : '') + '>';
    }

    return '<div class="f"' + (f.half ? ' data-half' : '') + '>' +
      '<label for="' + id + '">' + esc(f.label) + (f.required ? ' *' : '') + '</label>' + control +
      (f.desc ? '<p class="desc">' + esc(f.desc) + '</p>' : '') + '</div>';
  }

  function layoutFields(fields, row) {
    var out = '', i = 0;
    while (i < fields.length) {
      var f = fields[i];
      if (f.half && fields[i + 1] && fields[i + 1].half) {
        out += '<div class="f-row">' + fieldHTML(f, row[f.key]) + fieldHTML(fields[i + 1], row[fields[i + 1].key]) + '</div>';
        i += 2;
      } else {
        out += fieldHTML(f, row[f.key]);
        i += 1;
      }
    }
    return out;
  }

  function viewEdit(slug, id) {
    var def = COLL[slug];
    if (!def) return viewDashboard();

    var isNew = id === 'create';
    var row = isNew ? {} : Store.get(slug, id);

    renderSidebar(slug);

    if (!isNew && !row) {
      crumbs([{ label: def.label, href: '#/collections/' + slug }, { label: 'Not found' }]);
      document.getElementById('view').innerHTML =
        '<div class="view__head"><h1>Record not found</h1></div>' +
        '<p class="empty">That record no longer exists. <a class="cell-link" href="#/collections/' + slug + '">Back to ' + esc(def.label) + '</a></p>';
      return;
    }

    if (isNew) {
      // sensible defaults
      def.fields.forEach(function (f) {
        if (f.type === 'select' && f.options.length) row[f.key] = f.options[0];
        if (f.type === 'date') row[f.key] = today();
        if (f.type === 'number') row[f.key] = 0;
      });
    }

    var title = isNew ? 'Create ' + def.singular : rowTitle(slug, row);
    crumbs([{ label: def.label, href: '#/collections/' + slug }, { label: title }]);

    document.getElementById('view').innerHTML =
      '<div class="view__head">' +
        '<a class="btn btn--ghost btn--sm" href="#/collections/' + slug + '">' + SVG.back + ' Back</a>' +
        '<h1>' + esc(title) + '</h1>' +
      '</div>' +
      '<form id="edit-form"><div class="edit-grid">' +
        '<div><div class="panel">' + layoutFields(def.fields, row) + '</div></div>' +
        '<div class="sticky-side"><div class="panel">' +
          '<h3>' + (isNew ? 'New record' : 'Record') + '</h3>' +
          (isNew ? '' :
            '<div class="meta-row"><span>ID</span><span>' + esc(row.id) + '</span></div>' +
            '<div class="meta-row"><span>Collection</span><span>' + esc(def.label) + '</span></div>') +
          '<div class="form-actions" style="margin-top:18px">' +
            '<button class="btn btn--primary" type="submit">' + (isNew ? 'Create' : 'Save changes') + '</button>' +
            (isNew ? '' : '<button class="btn btn--danger btn--sm" type="button" id="del-btn">Delete</button>') +
          '</div>' +
        '</div></div>' +
      '</div></form>';

    document.getElementById('edit-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target;
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var patch = {};
      def.fields.forEach(function (f) {
        var el = form.elements[f.key];
        if (!el) return;
        var val = el.value;
        if (f.type === 'number') val = val === '' ? null : Number(val);
        // A select whose only options are true/false is a boolean field.
        // Saving the STRING 'false' would be truthy everywhere it is read,
        // which silently flips flags like cases.verified and .superseded.
        if (f.type === 'select' && f.options && f.options.length === 2 &&
            f.options.every(function (o) { return o === 'true' || o === 'false'; })) {
          val = (val === 'true');
        }
        patch[f.key] = val;
      });

      if (isNew) {
        var created = Store.create(slug, patch);
        toast(def.singular + ' created');
        renderSidebar(slug);
        location.hash = '#/collections/' + slug + '/' + created.id;
      } else {
        Store.update(slug, row.id, patch);
        toast('Saved');
        crumbs([{ label: def.label, href: '#/collections/' + slug }, { label: rowTitle(slug, Object.assign({}, row, patch)) }]);
      }
    });

    var del = document.getElementById('del-btn');
    if (del) {
      del.addEventListener('click', function () {
        if (!confirm('Delete this record? This cannot be undone.')) return;
        Store.remove(slug, row.id);
        toast('Record deleted');
        location.hash = '#/collections/' + slug;
      });
    }
  }

  /* ------------------------------------------------------------- global -- */

  function viewGlobal(slug) {
    var def = COLL[slug];
    if (!def) return viewDashboard();

    renderSidebar(slug);
    crumbs([{ label: def.label }]);

    var row = Store.get(slug) || {};

    document.getElementById('view').innerHTML =
      '<div class="view__head"><h1>' + esc(def.label) + '</h1></div>' +
      '<form id="edit-form"><div class="edit-grid">' +
        '<div><div class="panel">' + layoutFields(def.fields, row) + '</div></div>' +
        '<div class="sticky-side"><div class="panel">' +
          '<h3>Global</h3>' +
          '<p class="desc" style="margin:0 0 16px">These values drive the pricing blocks on the home page and the documents page.</p>' +
          '<div class="form-actions"><button class="btn btn--primary" type="submit">Save changes</button></div>' +
        '</div></div>' +
      '</div></form>';

    document.getElementById('edit-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var patch = {};
      def.fields.forEach(function (f) {
        var el = form.elements[f.key];
        if (!el) return;
        patch[f.key] = f.type === 'number' ? Number(el.value) : el.value;
      });
      Store.update(slug, slug, patch);
      toast('Pricing saved');
    });
  }

  /* ------------------------------------------------------------- router -- */

  function route() {
    var hash = location.hash.replace(/^#/, '') || '/';
    var parts = hash.split('/').filter(Boolean);

    window.scrollTo(0, 0);
    document.getElementById('side').classList.remove('is-open');
    document.getElementById('side-scrim').classList.remove('is-on');

    if (!parts.length) return viewDashboard();
    if (parts[0] === 'globals') return viewGlobal(parts[1]);
    if (parts[0] === 'collections') {
      if (parts.length === 2) return viewList(parts[1]);
      if (parts.length >= 3) return viewEdit(parts[1], parts[2]);
    }
    return viewDashboard();
  }

  /* --------------------------------------------------------------- boot -- */

  function boot() {
    var session = guard();
    if (!session) return;

    var initials = (session.name || session.email).split(/[\s@.]+/)
      .map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();

    var av = document.getElementById('avatar');
    av.textContent = initials;
    av.title = session.name + ', ' + session.email + ' (' + session.role + ')';

    // Surface failed API writes (remote mode reverts the cache on failure).
    window.addEventListener('lg:writeError', function (e) {
      toast('API ' + e.detail.op + ' failed: ' + e.detail.message, true);
      route();
    });

    // Mode badge in the topbar.
    var crumbsEl = document.getElementById('crumbs');
    var badge = document.createElement('span');
    badge.className = 'badge ' + (session.mode === 'remote' ? 'badge--green' : 'badge--grey');
    badge.style.marginLeft = '10px';
    badge.textContent = session.mode === 'remote' ? 'live · lawgistics.my' : 'demo data';
    crumbsEl.parentElement.appendChild(badge);

    document.getElementById('signout').addEventListener('click', function () {
      Store.signOut();
      location.replace('login.html');
    });

    document.getElementById('menu-btn').addEventListener('click', function () {
      document.getElementById('side').classList.add('is-open');
      document.getElementById('side-scrim').classList.add('is-on');
    });
    document.getElementById('side-scrim').addEventListener('click', function () {
      document.getElementById('side').classList.remove('is-open');
      document.getElementById('side-scrim').classList.remove('is-on');
    });

    document.getElementById('collapse-btn').addEventListener('click', function () {
      var allCollapsed = S.groups.every(function (g) { return collapsed[g.label]; });
      S.groups.forEach(function (g) { collapsed[g.label] = !allCollapsed; });
      try { localStorage.setItem('lawgistics.admin.groups', JSON.stringify(collapsed)); } catch (e) {}
      route();
    });

    window.addEventListener('hashchange', route);

    // Hydrate from the API (remote sessions) before first paint.
    document.getElementById('view').innerHTML =
      '<div class="empty">Loading' + (session.mode === 'remote' ? ' from lawgistics.my…' : '…') + '</div>';
    Store.init().then(function (liveCount) {
      if (session.mode === 'remote' && !liveCount) {
        toast('API unreachable, showing demo data', true);
        badge.className = 'badge badge--amber';
        badge.textContent = 'API unreachable · demo data';
      }
      route();
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
