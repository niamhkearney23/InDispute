/* ==========================================================================
   Lawgistics, document creator wizard
   Guided steps -> signature capture (type / draw / upload) -> submit ->
   (demo) checkout -> unlocked preview with edit + Word/PDF export.
   The preview stays blurred until payment, like the production product.
   ========================================================================== */

(function () {
  'use strict';

  window.pageInit = function () {
    var esc = window.lgEsc;

    var slug = new URLSearchParams(location.search).get('template');
    var def = window.LG_DOCS && window.LG_DOCS[slug];

    var backEl = document.querySelector('[data-back]');
    if (backEl) backEl.insertAdjacentHTML('afterbegin', '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 7h-9M6 3.5 2.5 7 6 10.5"/></svg>');

    if (!def) {
      document.querySelector('.wiz-panel').innerHTML =
        '<h1 style="font-size:1.8rem">Template not available yet</h1>' +
        '<p>This template hasn\'t been wired into the instant creator. <a href="documents.html">Browse templates</a> or <a href="legalhelp.html">talk to a lawyer</a>.</p>';
      document.querySelector('.preview-pane').style.display = 'none';
      return;
    }

    document.title = def.title + ', Lawgistics';
    document.querySelector('[data-doc-title]').textContent = def.title;
    document.querySelector('[data-doc-desc]').textContent = def.description;

    /* ---------------------------------------------------------- state -- */

    var SIGNERS = {
      'employment-contract': ['For and on behalf of the Company', 'The Employee'],
      'nda-mutual': ['First party, authorised signatory', 'Second party, authorised signatory'],
      'service-agreement': ['The Provider', 'The Client'],
      'letter-of-demand': ['Signatory'],
      'offer-letter': ['For and on behalf of the Company', 'Candidate, acceptance'],
      'nda-one-way': ['The Discloser', 'The Recipient'],
      'mou': ['First party', 'Second party'],
      'shareholders-agreement': ['First shareholder', 'Second shareholder'],
      'board-resolution': ['Director 1', 'Director 2'],
      'tenancy-agreement': ['The Landlord', 'The Tenant'],
      'settlement-agreement': ['The Recipient', 'The Payer'],
      'website-terms': [],
      'pdpa-privacy-notice': [],
      'contractor-agreement': ['The Client', 'The Contractor']
    };
    var signers = SIGNERS[slug] !== undefined ? SIGNERS[slug] : ['First party', 'Second party'];

    var steps = def.steps.concat([{ title: 'Sign & submit', sign: true }]);
    var TOTAL = steps.length;

    var DRAFT_KEY = 'lawgistics.draft.' + slug;
    var state = { step: 0, answers: {}, signatures: [], editedHtml: null, stale: false, unlocked: false };
    try {
      var saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (saved) {
        state.answers = saved.answers || {};
        state.signatures = saved.signatures || [];
        state.editedHtml = saved.editedHtml || null;
        state.unlocked = !!saved.unlocked;
        state.reviewRef = saved.reviewRef || null;
      }
    } catch (e) {}

    def.steps.forEach(function (s) {
      s.fields.forEach(function (f) {
        if (state.answers[f.key] === undefined && f.value !== undefined) state.answers[f.key] = f.value;
        if (state.answers[f.key] === undefined && f.type === 'select' && f.options.length) state.answers[f.key] = f.options[0][0];
      });
    });

    function save() {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          answers: state.answers, signatures: state.signatures,
          editedHtml: state.editedHtml, unlocked: state.unlocked,
          reviewRef: state.reviewRef || null
        }));
      } catch (e) {}
    }

    /* ---------------------------------------------------------- voice -- */

    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var activeRec = null;

    function attachVoice(wrapper, input) {
      if (!SR) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mic-btn' + (input.tagName === 'TEXTAREA' ? ' for-textarea' : '');
      btn.setAttribute('aria-label', 'Fill this field by voice');
      btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2.5" width="6" height="10" rx="3"/><path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5"/></svg>';
      var hint = document.createElement('p');
      hint.className = 'voice-hint';
      hint.textContent = 'Listening, just talk, it types for you.';
      wrapper.appendChild(btn);
      wrapper.appendChild(hint);

      btn.addEventListener('click', function () {
        if (activeRec) { activeRec.stop(); return; }
        var rec = new SR();
        rec.lang = 'en-US';
        rec.interimResults = true;
        rec.continuous = input.tagName === 'TEXTAREA';
        var base = input.tagName === 'TEXTAREA' && input.value ? input.value.replace(/\s+$/, '') + ' ' : '';
        activeRec = rec;
        btn.classList.add('is-listening');
        hint.classList.add('is-on');
        rec.onresult = function (e) {
          var text = '';
          for (var i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
          input.value = base + text.trim();
          input.dispatchEvent(new Event('input', { bubbles: true }));
        };
        var done = function () {
          activeRec = null;
          btn.classList.remove('is-listening');
          hint.classList.remove('is-on');
        };
        rec.onend = done;
        rec.onerror = function (e) {
          done();
          if (e.error === 'not-allowed') {
            hint.textContent = 'Microphone blocked, allow mic access in the browser to dictate.';
            hint.classList.add('is-on');
            setTimeout(function () { hint.classList.remove('is-on'); hint.textContent = 'Listening, just talk, it types for you.'; }, 3500);
          }
        };
        rec.start();
      });
    }

    /* -------------------------------------------------------- stepper -- */

    var stepsHost = document.querySelector('[data-steps]');
    var fieldsHost = document.querySelector('[data-fields]');
    var stepTitle = document.querySelector('[data-step-title]');
    var progress = document.querySelector('[data-progress]');

    function stepComplete(i) {
      var s = steps[i];
      if (s.sign) return state.unlocked;
      return s.fields.every(function (f) {
        return !f.required || String(state.answers[f.key] || '').trim();
      });
    }

    function renderSteps() {
      var html = '';
      steps.forEach(function (s, i) {
        var done = stepComplete(i) && i !== state.step;
        var cls = i === state.step ? ' is-current' : (done ? ' is-done' : '');
        html += '<button class="wiz-step' + cls + '" type="button" data-goto="' + i + '">' +
          '<span class="wiz-step__dot">' + (done ? '✓' : (i + 1)) + '</span>' +
          '<span class="wiz-step__label">' + esc(s.title) + '</span></button>';
        if (i < TOTAL - 1) html += '<span class="wiz-step__bar' + (done ? ' is-done' : '') + '"></span>';
      });
      stepsHost.innerHTML = html;
      progress.style.width = Math.round(((state.step + 1) / TOTAL) * 100) + '%';
      document.querySelector('[data-prev]').style.visibility = state.step === 0 ? 'hidden' : 'visible';
      var next = document.querySelector('[data-next]');
      if (steps[state.step].sign) {
        next.textContent = state.unlocked ? 'Unlocked ✓' : 'Submit';
        next.disabled = state.unlocked;
      } else {
        next.textContent = 'Continue';
        next.disabled = false;
      }
    }

    /* ----------------------------------------------------- signatures -- */

    function sigBlock(i, label) {
      var wrap = document.createElement('div');
      wrap.className = 'sig-block';
      wrap.innerHTML =
        '<h4>' + esc(label) + '</h4>' +
        '<div class="sig-tabs">' +
          '<button type="button" data-mode="typed" class="is-active">Type</button>' +
          '<button type="button" data-mode="draw">Draw</button>' +
          '<button type="button" data-mode="upload">Upload</button>' +
        '</div>' +
        '<div data-mode-body="typed"><input class="input" type="text" placeholder="Type the signatory\'s name" data-sig-text></div>' +
        '<div data-mode-body="draw" style="display:none"><canvas class="sig-canvas" width="640" height="220"></canvas>' +
          '<div class="sig-row"><button class="btn btn--sm btn--ghost" type="button" data-sig-clear-canvas>Clear drawing</button></div></div>' +
        '<div data-mode-body="upload" style="display:none"><input type="file" accept="image/*" data-sig-file></div>' +
        '<div class="sig-preview" data-sig-preview><span style="font-size:.78rem;font-weight:600;color:var(--ink-soft)">Saved:</span><span data-sig-preview-body></span>' +
          '<button class="btn btn--sm btn--ghost" type="button" data-sig-remove style="margin-left:auto">Remove</button></div>';

      var tabs = wrap.querySelectorAll('.sig-tabs button');
      tabs.forEach(function (t) {
        t.addEventListener('click', function () {
          tabs.forEach(function (x) { x.classList.toggle('is-active', x === t); });
          wrap.querySelectorAll('[data-mode-body]').forEach(function (b) {
            b.style.display = b.getAttribute('data-mode-body') === t.getAttribute('data-mode') ? 'block' : 'none';
          });
        });
      });

      function setSig(sig) {
        state.signatures[i] = sig;
        save();
        paintPreviewChip();
        renderPreview();
      }

      function paintPreviewChip() {
        var box = wrap.querySelector('[data-sig-preview]');
        var body = wrap.querySelector('[data-sig-preview-body]');
        var sig = state.signatures[i];
        if (!sig) { box.classList.remove('is-on'); body.innerHTML = ''; return; }
        box.classList.add('is-on');
        body.innerHTML = sig.kind === 'typed'
          ? '<span class="sig-typed">' + esc(sig.text) + '</span>'
          : '<img src="' + sig.data + '" alt="Signature">';
      }

      wrap.querySelector('[data-sig-text]').addEventListener('input', function (e) {
        var v = e.target.value.trim();
        setSig(v ? { kind: 'typed', text: v } : null);
      });

      var canvas = wrap.querySelector('canvas');
      var ctx = canvas.getContext('2d');
      ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.strokeStyle = '#1c2129';
      var drawing = false, drew = false;
      function pos(e) {
        var r = canvas.getBoundingClientRect();
        return [(e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height)];
      }
      canvas.addEventListener('pointerdown', function (e) {
        drawing = true; drew = true;
        canvas.setPointerCapture(e.pointerId);
        var p = pos(e); ctx.beginPath(); ctx.moveTo(p[0], p[1]);
      });
      canvas.addEventListener('pointermove', function (e) {
        if (!drawing) return;
        var p = pos(e); ctx.lineTo(p[0], p[1]); ctx.stroke();
      });
      canvas.addEventListener('pointerup', function () {
        drawing = false;
        if (drew) setSig({ kind: 'image', data: canvas.toDataURL('image/png') });
      });
      wrap.querySelector('[data-sig-clear-canvas]').addEventListener('click', function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drew = false;
        setSig(null);
      });

      wrap.querySelector('[data-sig-file]').addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () { setSig({ kind: 'image', data: reader.result }); };
        reader.readAsDataURL(file);
      });

      wrap.querySelector('[data-sig-remove]').addEventListener('click', function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        wrap.querySelector('[data-sig-text]').value = '';
        setSig(null);
      });

      // restore
      var existing = state.signatures[i];
      if (existing && existing.kind === 'typed') wrap.querySelector('[data-sig-text]').value = existing.text;
      paintPreviewChip();

      return wrap;
    }

    /* ---------------------------------------------------------- steps -- */

    function renderFields() {
      var s = steps[state.step];
      stepTitle.textContent = s.title;
      fieldsHost.innerHTML = '';

      if (s.sign) {
        var note = document.createElement('p');
        note.className = 'hint';
        note.style.cssText = 'display:block;margin-bottom:14px';
        note.textContent = signers.length
          ? 'Sign below (optional, you can also sign on paper), then submit to unlock the full document.'
          : 'This document is published, not signed, no signatures needed. Just submit to unlock it.';
        fieldsHost.appendChild(note);
        signers.forEach(function (label, i) {
          fieldsHost.appendChild(sigBlock(i, label));
        });
        return;
      }

      s.fields.forEach(function (f) {
        var wrap = document.createElement('div');
        wrap.className = 'field' + (f.type === 'text' || f.type === 'textarea' ? ' field-voice' : '');
        var val = state.answers[f.key] == null ? '' : state.answers[f.key];
        var inner = '<label for="wf-' + f.key + '">' + esc(f.label) + (f.required ? ' <span class="hint">(required)</span>' : '') + '</label>';
        if (f.type === 'textarea') {
          inner += '<textarea class="textarea" style="min-height:88px" id="wf-' + f.key + '" data-key="' + f.key + '" placeholder="' + esc(f.placeholder || '') + '">' + esc(val) + '</textarea>';
        } else if (f.type === 'select') {
          inner += '<select class="select" id="wf-' + f.key + '" data-key="' + f.key + '">' +
            f.options.map(function (o) {
              return '<option value="' + esc(o[0]) + '"' + (String(val) === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
            }).join('') + '</select>';
        } else {
          inner += '<input class="input" id="wf-' + f.key + '" data-key="' + f.key + '" type="' + (f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text') + '" value="' + esc(val) + '" placeholder="' + esc(f.placeholder || '') + '">';
        }
        if (f.help) inner += '<p class="hint" style="margin-top:6px;display:block">' + esc(f.help) + '</p>';
        wrap.innerHTML = inner;
        fieldsHost.appendChild(wrap);

        var input = wrap.querySelector('[data-key]');
        input.addEventListener('input', onAnswer);
        input.addEventListener('change', onAnswer);
        if (f.type === 'text' || f.type === 'textarea') attachVoice(wrap, input);
      });
    }

    function onAnswer(e) {
      var key = e.target.getAttribute('data-key');
      state.answers[key] = e.target.value;
      if (state.editedHtml) state.stale = true;
      save();
      renderSteps();
      renderPreview();
    }

    stepsHost.addEventListener('click', function (e) {
      var b = e.target.closest('[data-goto]');
      if (!b) return;
      state.step = Number(b.getAttribute('data-goto'));
      renderSteps(); renderFields();
    });
    document.querySelector('[data-prev]').addEventListener('click', function () {
      if (state.step > 0) { state.step--; renderSteps(); renderFields(); }
    });
    document.querySelector('[data-next]').addEventListener('click', function () {
      if (!steps[state.step].sign) {
        state.step++;
        renderSteps(); renderFields();
        return;
      }
      // Submit
      var missing = [];
      def.steps.forEach(function (s, i) { if (!stepComplete(i) && !steps[i].sign) missing.push(s.title); });
      if (missing.length) {
        alert('Still needed before you can submit: ' + missing.join(', '));
        return;
      }
      openModal('confirm');
    });

    /* --------------------------------------------------------- modals -- */

    function openModal(name) {
      document.querySelector('[data-modal="' + name + '"]').classList.add('is-on');
    }
    function closeModals() {
      document.querySelectorAll('.modal-scrim').forEach(function (m) { m.classList.remove('is-on'); });
    }
    document.querySelectorAll('.modal-scrim').forEach(function (m) {
      m.addEventListener('click', function (e) { if (e.target === m) closeModals(); });
    });
    document.querySelectorAll('[data-modal-close]').forEach(function (b) {
      b.addEventListener('click', closeModals);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModals(); });

    document.querySelector('[data-confirm-yes]').addEventListener('click', function () {
      closeModals();
      openModal('checkout');
    });

    var pricing = window.Store ? Store.get('pricing') : null;
    var priceLabel = pricing ? pricing.standardCurrency + ' ' + pricing.standardPrice : 'RM 149';
    document.querySelectorAll('[data-price]').forEach(function (el) { el.textContent = priceLabel; });

    document.querySelector('[data-pay]').addEventListener('click', function () {
      state.unlocked = true;
      save();
      closeModals();
      syncLock();
      renderSteps();
      document.querySelector('.paper-wrap').scrollIntoView({ behavior: 'smooth' });
    });

    document.querySelector('[data-unlock-shortcut]').addEventListener('click', function () {
      openModal('checkout');
    });

    /* -------------------------------------------------------- preview -- */

    var paper = document.querySelector('[data-paper]');
    var paperWrap = document.querySelector('.paper-wrap');
    var staleBanner = document.querySelector('[data-stale]');
    var editBadge = document.querySelector('[data-edit-badge]');
    var editToggle = document.querySelector('[data-edit-toggle]');

    function injectSignatures(root) {
      var lines = root.querySelectorAll('.doc__sig .doc__sig-line');
      state.signatures.forEach(function (sig, i) {
        if (!sig || !lines[i]) return;
        lines[i].innerHTML = sig.kind === 'typed'
          ? '<span class="sig-typed">' + esc(sig.text) + '</span>'
          : '<img src="' + sig.data + '" alt="Signature">';
      });
    }

    function buildDocHtml() {
      var tmp = document.createElement('div');
      tmp.innerHTML = def.render(state.answers);
      injectSignatures(tmp);
      return tmp.innerHTML;
    }

    function renderPreview() {
      if (state.editedHtml) {
        if (paper.innerHTML !== state.editedHtml) paper.innerHTML = state.editedHtml;
        staleBanner.classList.toggle('is-on', state.stale);
        editBadge.classList.add('is-on');
      } else {
        paper.innerHTML = buildDocHtml();
        staleBanner.classList.remove('is-on');
        editBadge.classList.remove('is-on');
      }
    }

    function syncLock() {
      paperWrap.classList.toggle('is-locked', !state.unlocked);
      ['[data-edit-toggle]', '[data-print]', '[data-word]', '[data-review-req]'].forEach(function (sel) {
        var b = document.querySelector(sel);
        if (!b) return;
        if (state.unlocked) b.removeAttribute('disabled');
        else b.setAttribute('disabled', 'disabled');
      });
      syncReviewBtn();
    }

    /* ------------------------------------------------- lawyer review -- */

    function syncReviewBtn() {
      var b = document.querySelector('[data-review-req]');
      if (!b) return;
      if (state.reviewRef) {
        b.textContent = 'In lawyer review ✓';
        b.setAttribute('disabled', 'disabled');
      }
    }

    var reviewBtn = document.querySelector('[data-review-req]');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', function () {
        if (state.reviewRef || !state.unlocked) return;
        if (!confirm('Send this document to our legal team for review? A lawyer checks it and comes back with notes or approval.')) return;
        var session = (window.Store && Store.session && Store.session()) || null;
        var now = new Date();
        var ref = 'LG-' + String(now.getFullYear()).slice(2) +
          String(now.getMonth() + 1).padStart(2, '0') + '-' +
          String(Math.floor(1000 + Math.random() * 9000));
        Store.create('documentsToReview', {
          reference: ref,
          customer: session ? (session.name || session.email) : 'Guest customer',
          template: def.title,
          submitted: now.toISOString().slice(0, 10),
          status: 'awaiting review', reviewer: '', notes: ''
        });
        state.reviewRef = ref;
        save();
        syncReviewBtn();
        Store.notify('review', {
          event: 'review.requested', reference: ref,
          customer: session ? (session.name || session.email) : 'Guest customer',
          customerEmail: session ? session.email : '',
          template: def.title, submitted: now.toISOString().slice(0, 10),
          status: 'awaiting review'
        });
        alert('Sent for review, reference ' + ref + '. Track it from your dashboard.');
      });
    }

    editToggle.addEventListener('click', function () {
      var editing = paper.getAttribute('contenteditable') === 'true';
      if (editing) {
        paper.setAttribute('contenteditable', 'false');
        editToggle.textContent = 'Edit text';
        state.editedHtml = paper.innerHTML;
        save();
        renderPreview();
      } else {
        if (!state.editedHtml) state.editedHtml = paper.innerHTML;
        paper.setAttribute('contenteditable', 'true');
        paper.focus();
        editToggle.textContent = 'Done editing';
        editBadge.classList.add('is-on');
      }
    });
    paper.addEventListener('input', function () {
      if (paper.getAttribute('contenteditable') === 'true') {
        state.editedHtml = paper.innerHTML;
        save();
      }
    });

    document.querySelector('[data-regen]').addEventListener('click', function () {
      if (!confirm('Discard your manual edits and rebuild from the answers?')) return;
      state.editedHtml = null;
      state.stale = false;
      paper.setAttribute('contenteditable', 'false');
      editToggle.textContent = 'Edit text';
      save();
      renderPreview();
    });

    document.querySelector('[data-print]').addEventListener('click', function () { window.print(); });

    document.querySelector('[data-word]').addEventListener('click', function () {
      var docHtml =
        '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">' +
        '<head><meta charset="utf-8"><title>' + esc(def.title) + '</title><style>' +
        'body{font-family:Georgia,"Times New Roman",serif;font-size:12pt;line-height:1.6;color:#1c2129;max-width:680px;margin:0 auto}' +
        'h1{font-size:16pt;text-align:center;text-transform:uppercase;letter-spacing:1px}' +
        'h2{font-size:12pt}' +
        '.doc__dated{text-align:center;font-style:italic}' +
        '.doc__sig-grid{width:100%}.doc__sig{display:inline-block;width:45%;vertical-align:top;margin-right:4%}' +
        '.doc__sig-line{border-bottom:1px solid #1c2129;min-height:40pt;margin-bottom:8pt}' +
        '.doc__sig-line img{max-height:40pt}' +
        '.sig-typed{font-family:"Segoe Script","Brush Script MT",cursive;font-size:20pt}' +
        '.doc__notice{font-family:Arial,sans-serif;font-size:8pt;color:#666;border-top:1px solid #ccc;padding-top:8pt;margin-top:30pt}' +
        '.doc--letter .doc__from{text-align:right}.doc__re{text-decoration:underline}' +
        '</style></head><body>' + paper.innerHTML + '</body></html>';
      var blob = new Blob(['﻿' + docHtml], { type: 'application/msword' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = def.title.replace(/[^\w]+/g, '-') + '.doc';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });

    /* ----------------------------------------------------------- boot -- */

    renderSteps();
    renderFields();
    renderPreview();
    syncLock();
  };
})();
