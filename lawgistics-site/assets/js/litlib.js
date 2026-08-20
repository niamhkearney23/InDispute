/* ==========================================================================
   Lawgistics, litigation library (Magistrates Court debt recovery pack)
   Takes the interview answers from courtpack.html and drafts the four
   documents of a simple debt claim: statement of claim, chronology,
   witness statement, and an indexed bundle of documents. Bundle tab and
   page numbers are computed once here so every document cites the same
   references. Drafted for Malaysian subordinate-court practice.
   ========================================================================== */

(function (global) {
  'use strict';

  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  function fmtDate(iso) {
    if (!iso) return '____________';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return esc(iso);
    var m = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
             'August', 'September', 'October', 'November', 'December'];
    return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
  }

  function rm(n) {
    var v = Number(n);
    if (!isFinite(v) || v <= 0) return 'RM ____________';
    return 'RM ' + v.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function blank(v, fallback) {
    var s = String(v == null ? '' : v).trim();
    return s ? esc(s) : (fallback || '____________');
  }

  var STATES = [
    'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang',
    'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor',
    'Terengganu', 'Wilayah Persekutuan Kuala Lumpur',
    'Wilayah Persekutuan Labuan', 'Wilayah Persekutuan Putrajaya'
  ];

  var DOC_CATS = [
    ['contract', 'Contract / Purchase order / Quotation'],
    ['invoice', 'Invoice'],
    ['delivery', 'Delivery order / Proof of work done'],
    ['soa', 'Statement of account'],
    ['payment', 'Payment record / Receipt'],
    ['credit-note', 'Credit / debit note'],
    ['resolution', 'Proof a complaint was resolved'],
    ['lod', 'Letter of demand'],
    ['correspondence', 'Correspondence (email / WhatsApp)'],
    ['search', 'SSM company search'],
    ['other', 'Other']
  ];

  /* ------------------------------------------------------------ compute -- */
  /* Derives everything the four documents share: totals, bundle order with
     tab + page numbers, citation refs, the chronology, and sanity warnings. */
  function compute(a) {
    var invoices = (a.invoices || []).filter(function (i) { return i && (i.no || i.amount); });
    var payments = (a.payments || []).filter(function (p) { return p && p.amount; });
    var sum = function (rows) {
      return rows.reduce(function (t, r) { return t + (Number(r.amount) || 0); }, 0);
    };
    var invTotal = sum(invoices);
    var payTotal = sum(payments);
    var creditTotal = a.hasCreditNote === 'yes' ? (Number(a.creditNoteAmount) || 0) : 0;
    var debt = Number(a.debtAmount) || 0;

    /* Bundle: chronological, undated documents last in the order added. */
    var docs = (a.docs || []).slice().sort(function (x, y) {
      if (!x.date && !y.date) return 0;
      if (!x.date) return 1;
      if (!y.date) return -1;
      return x.date < y.date ? -1 : x.date > y.date ? 1 : 0;
    });
    var page = 1;
    docs.forEach(function (d, i) {
      var n = Math.max(1, Number(d.pages) || 1);
      d.tab = i + 1;
      d.p1 = page;
      d.p2 = page + n - 1;
      page = d.p2 + 1;
    });

    function refText(d) {
      if (!d) return '';
      return d.p1 === d.p2 ? 'page ' + d.p1 + ' of the Bundle' : 'pages ' + d.p1 + '-' + d.p2 + ' of the Bundle';
    }
    function findCat(cat, needle) {
      var hit = null;
      docs.forEach(function (d) {
        if (d.category !== cat) return;
        if (needle) {
          var hay = ((d.name || '') + ' ' + (d.desc || '')).toLowerCase();
          if (hay.indexOf(String(needle).toLowerCase()) === -1) return;
        }
        if (!hit) hit = d;
      });
      /* Fall back to the first doc of the category when no name match. */
      if (!hit && needle) return findCat(cat, null);
      return hit;
    }

    var refs = {
      contract: findCat('contract'),
      lod: findCat('lod'),
      invoice: function (no) { return findCat('invoice', no); },
      payment: findCat('payment'),
      creditNote: findCat('credit-note'),
      resolution: findCat('resolution'),
      text: refText
    };

    /* Chronology. */
    var events = [];
    if (a.linkType && a.linkType !== 'none' && a.linkDate) {
      var how = {
        contract: 'The parties entered into a written agreement',
        po: 'The Defendant issued Purchase Order No. ' + (a.linkRef || '-') + ' to the Plaintiff',
        quotation: 'The Defendant accepted the Plaintiff’s Quotation No. ' + (a.linkRef || '-'),
        oral: 'The parties reached an oral agreement'
      }[a.linkType] || 'The parties reached an agreement';
      events.push({ date: a.linkDate, text: how + (a.linkDesc ? ' for ' + a.linkDesc : ''), doc: refs.contract });
    }
    invoices.forEach(function (i) {
      if (!i.date && !i.no) return;
      events.push({
        date: i.date || '',
        text: 'The Plaintiff issued Invoice No. ' + (i.no || '-') + ' for ' + rmPlain(i.amount) + (i.desc ? ' (' + i.desc + ')' : ''),
        doc: refs.invoice(i.no)
      });
    });
    payments.forEach(function (p) {
      events.push({
        date: p.date || '',
        text: 'The Defendant paid ' + rmPlain(p.amount) + (p.ref ? ' towards ' + p.ref : ''),
        doc: refs.payment
      });
    });
    if (a.hasCreditNote === 'yes' && a.creditNoteDate) {
      events.push({
        date: a.creditNoteDate,
        text: 'The Plaintiff issued a credit note' + (a.creditNoteRef ? ' (No. ' + a.creditNoteRef + ')' : '') +
              ' allowing the Defendant a reduction of ' + rmPlain(a.creditNoteAmount),
        doc: refs.creditNote
      });
    }
    if (a.lodSent === 'yes' && a.lodDate) {
      events.push({ date: a.lodDate, text: 'The Plaintiff issued a letter of demand' + (a.lodMode ? ' by ' + a.lodMode : ''), doc: refs.lod });
    }
    events.sort(function (x, y) {
      if (!x.date) return 1;
      if (!y.date) return -1;
      return x.date < y.date ? -1 : x.date > y.date ? 1 : 0;
    });
    events.push({ date: '', text: 'Writ of Summons and Statement of Claim filed', doc: null, future: true });

    /* Documents the claim relies on but the bundle doesn't yet contain. */
    var missing = [];
    var hasCat = function (c) { return docs.some(function (d) { return d.category === c; }); };
    if (a.linkType && a.linkType !== 'none' && a.linkType !== 'oral' && !hasCat('contract')) {
      missing.push('The contract / purchase order / quotation the claim is based on');
    }
    if (a.hasInvoices === 'yes' && !hasCat('invoice')) missing.push('The unpaid invoices themselves');
    if (payments.length && !hasCat('payment') && !hasCat('soa')) missing.push('Proof of the part payments (receipts or statement of account)');
    if (a.lodSent === 'yes' && !hasCat('lod')) missing.push('The letter of demand and proof it was sent');
    if (a.performed === 'yes' && !hasCat('delivery') && !hasCat('correspondence')) {
      missing.push('Proof the goods were delivered / work was done (delivery orders, sign-offs, or correspondence)');
    }
    if (a.hasCreditNote === 'yes' && !hasCat('credit-note')) missing.push('The credit / debit note itself');
    if (a.performed === 'complaints' && !hasCat('resolution') && !hasCat('correspondence')) {
      missing.push('Proof the complaint was attended to and resolved (sign-off, replacement delivery order, correspondence), this is what makes the draft Reply usable');
    }

    var mismatch = a.hasInvoices === 'yes' && invTotal > 0 &&
      Math.abs((invTotal - payTotal - creditTotal) - debt) > 0.01;

    return {
      invoices: invoices, payments: payments,
      invTotal: invTotal, payTotal: payTotal, creditTotal: creditTotal, debt: debt,
      docs: docs, refs: refs, events: events,
      missing: missing, mismatch: mismatch,
      totalPages: page - 1
    };
  }

  function rmPlain(n) {
    var v = Number(n);
    if (!isFinite(v) || v <= 0) return 'RM,';
    return 'RM ' + v.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ------------------------------------------------------------ caption -- */

  function stateLine(state) {
    if (!state) return 'DALAM NEGERI ____________, MALAYSIA';
    if (/wilayah/i.test(state)) return 'DALAM ' + esc(state).toUpperCase() + ', MALAYSIA';
    return 'DALAM NEGERI ' + esc(state).toUpperCase() + ', MALAYSIA';
  }

  /* Court selection. Per Mathew: the summons is one template, what changes
     is the court. Monetary jurisdiction, Subordinate Courts Act 1948:
     Magistrates up to RM 100,000, Sessions up to RM 1,000,000, High Court
     above that. a.courtLevel overrides the derived level when the solicitor
     files elsewhere (transferred matters, consolidated suits). */
  var COURT_LIMITS = { magistrates: 100000, sessions: 1000000 };

  function courtLevelFor(amount) {
    var n = Number(amount) || 0;
    if (n > COURT_LIMITS.sessions) return 'high';
    if (n > COURT_LIMITS.magistrates) return 'sessions';
    return 'magistrates';
  }

  function court(a) {
    a = a || {};
    var level = a.courtLevel || courtLevelFor(a.debtAmount);
    var borneo = /sabah|sarawak|labuan/i.test(a.courtState || '');
    if (level === 'high') {
      return { level: level, bm: borneo ? 'MAHKAMAH TINGGI SABAH DAN SARAWAK' : 'MAHKAMAH TINGGI MALAYA',
        en: 'High Court', registrar: 'Registrar / Penolong Kanan Pendaftar', seat: 'High Court' };
    }
    if (level === 'sessions') {
      return { level: level, bm: 'MAHKAMAH SESYEN', en: 'Sessions Court',
        registrar: 'Registrar / Penolong Kanan Pendaftar', seat: 'Sessions Court' };
    }
    return { level: level, bm: 'MAHKAMAH MAJISTRET', en: 'Magistrates’ Court',
      registrar: 'Registrar / Penolong Kanan Pendaftar', seat: 'Magistrates’ Court' };
  }

  function partyLine(name, type, regNo) {
    var no = '';
    if (regNo) no = type === 'individual' ? '(No. K/P: ' + esc(regNo) + ')' : '(No. Syarikat: ' + esc(regNo) + ')';
    return '<strong>' + blank(name).toUpperCase() + '</strong>' + (no ? '<br>' + no : '');
  }

  function caption(a) {
    return '<div class="doc__court-head">' +
      '<p class="doc__court-line">DALAM ' + court(a).bm + ' DI ' + blank(a.courtTown).toUpperCase() + '<br>' +
      stateLine(a.courtState) + '<br>' +
      'GUAMAN NO: ' + (a.suitNo ? esc(a.suitNo) : '____________') + '</p>' +
      '<p class="doc__court-between">ANTARA</p>' +
      '<table class="doc__court-party"><tr><td>' + partyLine(a.pName, a.pType, a.pRegNo) + '</td><td class="doc__court-role">… PLAINTIF</td></tr></table>' +
      '<p class="doc__court-between">DAN</p>' +
      '<table class="doc__court-party"><tr><td>' + partyLine(a.dName, a.dType, a.dRegNo) + '</td><td class="doc__court-role">… DEFENDAN</td></tr></table>' +
      '</div>';
  }

  function title2(bm, en) {
    return '<h1 class="doc__title doc__title--court">' + bm + '<br><span class="doc__title-en">(' + en + ')</span></h1>';
  }

  function subject(a, form) {
    /* form: 'noun' -> "the goods", 'supplied' -> past-tense verb phrase */
    var s = a.subject || 'services';
    if (form === 'noun') {
      return { goods: 'the goods', services: 'the services', both: 'the goods and services' }[s] || 'the services';
    }
    return {
      goods: 'sold and delivered the goods',
      services: 'performed the services',
      both: 'supplied the goods and performed the services'
    }[s] || 'performed the services';
  }

  function notice(kind) {
    return '<p class="doc__notice">Generated with Lawgistics. This ' + kind + ' follows common Malaysian subordinate-court practice but is not legal advice, have an Advocate &amp; Solicitor review it before filing or affirming.</p>';
  }

  function numPara(n, html) {
    return '<p class="doc__para"><span class="doc__num">' + n + '.</span> ' + html + '</p>';
  }

  function partyDesc(name, type, regNo, address, role) {
    if (type === 'individual') {
      return 'The ' + role + ' is an individual (NRIC No. ' + blank(regNo) + ') whose address' +
        (role === 'Defendant' ? ' for the purpose of service herein' : '') + ' is at ' + blank(address) + '.';
    }
    return 'The ' + role + ' is a company incorporated in Malaysia under the Companies Act 2016 (Company No. ' + blank(regNo) + ')' +
      ' with its ' + (role === 'Plaintiff' ? 'business address at ' : 'registered / business address, and address for service herein, at ') + blank(address) + '.';
  }

  /* ==================================================== writ of summons == */

  function claimSummary(a, C) {
    var what = { goods: 'goods sold and delivered', services: 'services rendered',
                 both: 'goods sold and delivered and services rendered' }[a.subject] || 'goods and/or services supplied';
    return 'the sum of ' + rm(a.debtAmount) + ' being the outstanding balance due and owing from the Defendant to the Plaintiff for ' +
      what + ' by the Plaintiff to the Defendant' +
      (C.invoices.length ? ' under ' + (C.invoices.length > 1 ? C.invoices.length + ' invoices' : 'an invoice') + ' issued between ' +
        fmtDate(C.invoices[0].date) + ' and ' + fmtDate(C.invoices[C.invoices.length - 1].date) : '') +
      ', together with interest and costs';
  }

  function renderWrit(a, C) {
    var html = '<div class="doc doc--court">' + caption(a) + title2('WRIT SAMAN', 'WRIT OF SUMMONS');

    html += '<p><strong>Kepada / To:</strong><br><strong>' + blank(a.dName).toUpperCase() + '</strong><br>' +
      blank(a.dAddress).replace(/\n/g, '<br>') + '</p>';

    html += '<p style="margin-top:1.4em"><strong>AMBIL PERHATIAN / TAKE NOTICE</strong> that this Writ of Summons has been issued against you at the instance of the abovenamed Plaintiff in respect of the claim indorsed below.</p>';

    var CT = court(a);

    html += '<p>You are required, within <strong>fourteen (14) days</strong> after service of this Writ on you, inclusive of the day of service, to enter an appearance at the Registry of the ' + CT.seat + ' at ' +
      blank(a.courtTown) + ', either in person or through a solicitor, failing which the Plaintiff may proceed with the action and <strong>judgment may be entered against you in your absence</strong> without further notice.</p>';

    html += '<p>Dated this ______ day of ____________ 20____.</p>';

    html += '<div class="doc__sig-grid" style="margin-top:2.5em">' +
      '<div class="doc__sig"><div class="doc__sig-line"></div><p><strong>' + CT.registrar + '</strong><br>' + CT.seat + ', ' + blank(a.courtTown) + '<br><em>(Meterai Mahkamah / Seal of the Court)</em></p></div>' +
      '<div class="doc__sig"><div class="doc__sig-line"></div><p><strong>' + blank(a.pName) + '</strong><br>Plaintiff / Solicitors for the Plaintiff</p></div>' +
      '</div>';

    html += '<h2 style="text-align:center;margin:2em 0 .8em;text-decoration:underline">TUNTUTAN / INDORSEMENT OF CLAIM</h2>';
    html += '<p>The Plaintiff’s claim against the Defendant is for ' + claimSummary(a, C) +
      ', as set out in the Statement of Claim annexed herewith.</p>';

    html += '<h2 style="margin:1.8em 0 .5em">MEMORANDUM</h2>' +
      '<p style="font-size:.95em">An appearance may be entered by delivering the prescribed memorandum of appearance to the Registry of the ' + CT.seat + ' at ' + blank(a.courtTown) +
      ', with a copy served on the Plaintiff at the address for service below. If you pay the amount claimed with costs to the Plaintiff or its solicitors within the time limited for appearance, further proceedings will be stayed.</p>';

    html += '<p style="margin-top:1.6em;font-size:.92em">This Writ is issued by the abovenamed Plaintiff, whose address for service is ' +
      blank(a.pAddress).replace(/\n/g, ', ') + '.</p>';

    html += notice('writ of summons');
    return html + '</div>';
  }

  /* ================================================= statement of claim == */

  function renderClaim(a, C) {
    var n = 0;
    var next = function () { return ++n; };
    var html = '<div class="doc doc--court">' + caption(a) + title2('PENYATA TUNTUTAN', 'STATEMENT OF CLAIM');

    html += numPara(next(), partyDesc(a.pName, a.pType, a.pRegNo, a.pAddress, 'Plaintiff') +
      (a.pBusiness ? ' The Plaintiff carries on the business of ' + esc(a.pBusiness) + '.' : ''));
    html += numPara(next(), partyDesc(a.dName, a.dType, a.dRegNo, a.dAddress, 'Defendant'));

    /* Engagement. */
    var eng;
    if (a.linkType === 'contract') {
      eng = 'By a written agreement dated ' + fmtDate(a.linkDate) + (a.linkRef ? ' (Ref: ' + esc(a.linkRef) + ')' : '') +
        ' (“the Agreement”), the Defendant engaged the Plaintiff to ' + blank(a.linkDesc, 'supply goods and/or services') + '.';
    } else if (a.linkType === 'po') {
      eng = 'By Purchase Order No. ' + blank(a.linkRef) + ' dated ' + fmtDate(a.linkDate) +
        ' issued by the Defendant to the Plaintiff (“the Purchase Order”), the Defendant engaged the Plaintiff to ' + blank(a.linkDesc) + '.';
    } else if (a.linkType === 'quotation') {
      eng = 'By the Plaintiff’s Quotation No. ' + blank(a.linkRef) + ' dated ' + fmtDate(a.linkDate) +
        ', which the Defendant accepted, the parties agreed that the Plaintiff would ' + blank(a.linkDesc) + '.';
    } else if (a.linkType === 'oral') {
      eng = 'By an oral agreement made in or around ' + fmtDate(a.linkDate) +
        ', the Defendant engaged the Plaintiff to ' + blank(a.linkDesc) + '.';
    } else {
      eng = 'At the request of the Defendant, the Plaintiff agreed to ' + blank(a.linkDesc, 'supply goods and/or services to the Defendant') + '.';
    }
    html += numPara(next(), eng);

    /* Performance + invoices. */
    if (a.hasInvoices === 'yes' && C.invoices.length) {
      html += numPara(next(), 'Pursuant thereto, the Plaintiff duly ' + subject(a, 'supplied') +
        ' and issued the following invoice' + (C.invoices.length > 1 ? 's' : '') + ' to the Defendant:');
      html += '<div class="doc__particulars"><p class="doc__particulars-h">PARTICULARS</p>' +
        '<table class="doc__table"><thead><tr><th>No.</th><th>Invoice No.</th><th>Date</th><th style="text-align:right">Amount (RM)</th></tr></thead><tbody>';
      C.invoices.forEach(function (i, idx) {
        html += '<tr><td>' + (idx + 1) + '</td><td>' + blank(i.no) + '</td><td>' + fmtDate(i.date) + '</td>' +
          '<td style="text-align:right">' + (Number(i.amount) ? Number(i.amount).toLocaleString('en-MY', { minimumFractionDigits: 2 }) : '-') + '</td></tr>';
      });
      html += '<tr class="doc__table-total"><td colspan="3">Total</td><td style="text-align:right">' +
        C.invTotal.toLocaleString('en-MY', { minimumFractionDigits: 2 }) + '</td></tr>';
      html += '</tbody></table></div>';
    } else {
      html += numPara(next(), 'Pursuant thereto, the Plaintiff duly ' + subject(a, 'supplied') +
        ' for the Defendant. ' + (a.basisNoInvoice ? esc(a.basisNoInvoice) + ' ' : '') +
        'The agreed sum payable by the Defendant to the Plaintiff is ' + rm(a.debtAmount) + '.');
    }

    /* Credit terms, pleads when the sums fell due. */
    if (a.hasInvoices === 'yes' && a.creditDays) {
      html += numPara(next(), 'Under the agreed terms between the parties, each invoice was payable ' +
        (a.creditDays === '0' ? 'on presentation' : 'within ' + esc(a.creditDays) + ' days of its date') +
        '. The sums claimed herein have accordingly fallen due, and remain unpaid.');
    }

    /* Acceptance. Where the defendant raised complaints, the claim stays
       neutral, a plaintiff does not pre-empt the defence. The complaint and
       its rebuttal live in the draft Reply, deployed only if the Defence
       raises the point. */
    if (a.performed === 'complaints') {
      html += numPara(next(), 'The Plaintiff has duly performed all of its obligations, and the sums claimed herein are due and owing.');
    } else {
      html += numPara(next(), 'The Defendant accepted ' + subject(a, 'noun') +
        ' without any complaint, objection or rejection whatsoever, and the Defendant is not entitled to any set-off, deduction or counterclaim.');
    }

    /* Credit / debit note, the claim is net of any reduction allowed. */
    if (a.hasCreditNote === 'yes') {
      html += numPara(next(), 'By a credit note' + (a.creditNoteRef ? ' No. ' + esc(a.creditNoteRef) : '') +
        ' dated ' + fmtDate(a.creditNoteDate) + ', the Plaintiff allowed the Defendant a reduction of ' + rm(a.creditNoteAmount) +
        (a.creditNoteReason ? ' in respect of ' + esc(a.creditNoteReason) : '') +
        '. The sum claimed herein is net of the said reduction.');
    }

    /* Payments / balance. */
    if (C.payments.length) {
      var pp = C.payments.map(function (p) {
        return fmtDate(p.date) + ', ' + rmPlain(p.amount) + (p.ref ? ' (' + esc(p.ref) + ')' : '');
      }).join('; ');
      html += numPara(next(), 'The Defendant has made part payment(s) totalling ' + rm(C.payTotal) +
        ', namely: ' + pp + '. After giving credit for the said payment(s), the sum of ' + rm(a.debtAmount) +
        ' remains due and owing from the Defendant to the Plaintiff.');
    } else {
      html += numPara(next(), 'Despite the said sum having fallen due, the Defendant has not paid the same or any part thereof, and the sum of ' +
        rm(a.debtAmount) + ' remains due and owing from the Defendant to the Plaintiff.');
    }

    /* Demand. */
    if (a.lodSent === 'yes') {
      html += numPara(next(), 'By a letter of demand dated ' + fmtDate(a.lodDate) +
        (a.lodMode ? ' issued by ' + esc(a.lodMode) : '') +
        ', the Plaintiff demanded payment of the outstanding sum from the Defendant. Despite the said demand, the Defendant has failed, refused and/or neglected to pay the said sum or any part thereof.');
    } else {
      html += numPara(next(), 'Despite repeated requests for payment, the Defendant has failed, refused and/or neglected to pay the said sum or any part thereof.');
    }

    /* Contractual interest, if elected. */
    if (a.interest === 'contractual') {
      html += numPara(next(), 'Under the agreed terms between the parties, the Plaintiff is further entitled to interest on overdue amounts at the rate of ' +
        blank(a.contractualRate, '__') + '% per annum from the due date of each invoice until full payment.');
    }

    /* Prayer. */
    html += '<p class="doc__operative">AND THE PLAINTIFF CLAIMS against the Defendant:</p><ol class="doc__prayer">';
    html += '<li>the sum of ' + rm(a.debtAmount) + ';</li>';
    if (a.interest === 'contractual') {
      html += '<li>interest on the said sum at the rate of ' + blank(a.contractualRate, '__') + '% per annum from the due date(s) until the date of full realisation;</li>';
    } else {
      html += '<li>interest on the said sum at the rate of 5% per annum from the date of the Writ herein until the date of full realisation, pursuant to section 11 of the Civil Law Act 1956;</li>';
    }
    html += '<li>costs; and</li>' +
      '<li>such further and/or other relief as this Honourable Court deems fit and just.</li></ol>';

    html += '<p style="margin-top:2em">Dated this ______ day of ____________ 20____.</p>' +
      '<div class="doc__sig" style="max-width:300px;margin-top:3em"><div class="doc__sig-line"></div>' +
      '<p><strong>' + blank(a.pName) + '</strong><br>Plaintiff / Solicitors for the Plaintiff<br><em>Plaintif / Peguam cara Plaintif</em></p></div>' +
      '<p style="margin-top:2.5em;font-size:.92em">This Statement of Claim is filed by the abovenamed Plaintiff' +
      ', whose address for service is ' + blank(a.pAddress).replace(/\n/g, ', ') + '.</p>';

    html += notice('statement of claim');
    return html + '</div>';
  }

  /* ======================================================= draft reply == */
  /* Generated only when the defendant raised complaints. The strategy is
     Mathew's: never plead the complaint in the Statement of Claim (a
     plaintiff does not speculate about the defence), but where there is
     proof the complaint was resolved, hold a Reply ready so that if the
     Defence raises it, the rebuttal is filed the same week. */

  function renderReply(a, C) {
    var n = 0;
    var next = function () { return ++n; };
    var html = '<div class="doc doc--court">' + caption(a) + title2('JAWAPAN KEPADA PEMBELAAN', 'REPLY TO DEFENCE');

    html += '<div class="doc__missing"><p><strong>DRAFT, do not file with the Writ.</strong> ' +
      'A Reply is filed only after the Defendant serves a Defence, and only if that Defence raises the matters below. ' +
      'If the Defence raises something different, this draft must be rewritten to answer what was actually pleaded. ' +
      'File within 14 days of service of the Defence.</p></div>';

    html += numPara(next(), 'The Plaintiff repeats and relies upon its Statement of Claim.');

    html += numPara(next(), 'Insofar as the Defence alleges any complaint concerning ' + subject(a, 'noun') +
      ', namely ' + blank(a.complaintsDesc) + ', the Plaintiff avers that the said matter was attended to and resolved at the material time' +
      (a.complaintsResponse ? ', in that ' + esc(a.complaintsResponse) : '') + '.' +
      (C.refs.resolution ? ' The Plaintiff will refer to ' + C.refs.text(C.refs.resolution) + ' of Documents as proof of the said resolution.' : ''));

    var conduct = [];
    if (C.payments.length) conduct.push('made payment(s) totalling ' + rm(C.payTotal) + ' after the said matter arose');
    if (a.hasCreditNote === 'yes') conduct.push('received and retained the benefit of the Plaintiff’s credit note of ' + rm(a.creditNoteAmount));
    if (conduct.length) {
      html += numPara(next(), 'Further, the Defendant thereafter ' + conduct.join(', and ') +
        ', conduct consistent only with the Defendant’s acceptance that the matter had been resolved.');
    }

    html += numPara(next(), 'In the premises, the matters raised afford the Defendant no defence to the Plaintiff’s claim, and no set-off, deduction or counterclaim arises therefrom.');

    html += numPara(next(), 'Save as expressly admitted herein, the Plaintiff joins issue with the Defendant upon its Defence, and repeats the prayer in the Statement of Claim.');

    html += '<p style="margin-top:2em">Dated this ______ day of ____________ 20____.</p>' +
      '<div class="doc__sig" style="max-width:300px;margin-top:3em"><div class="doc__sig-line"></div>' +
      '<p><strong>' + blank(a.pName) + '</strong><br>Plaintiff / Solicitors for the Plaintiff<br><em>Plaintif / Peguam cara Plaintif</em></p></div>';

    html += notice('draft reply');
    return html + '</div>';
  }

  /* ======================================================== chronology == */

  function renderChronology(a, C) {
    var html = '<div class="doc doc--court">' + caption(a) + title2('KRONOLOGI KES', 'CHRONOLOGY OF EVENTS');
    html += '<table class="doc__table doc__table--chron"><thead><tr><th style="width:120px">Date</th><th>Event</th><th style="width:140px">Reference</th></tr></thead><tbody>';
    C.events.forEach(function (e) {
      html += '<tr><td>' + (e.future ? '<em>(on filing)</em>' : fmtDate(e.date)) + '</td>' +
        '<td>' + esc(e.text) + '</td>' +
        '<td>' + (e.doc ? 'BOD ' + C.refs.text(e.doc).replace(' of the Bundle', '') : '-') + '</td></tr>';
    });
    html += '</tbody></table>';
    html += '<p style="margin-top:1.6em;font-size:.92em"><em>BOD refers to the Plaintiff’s Bundle of Documents.</em></p>';
    html += notice('chronology');
    return html + '</div>';
  }

  /* ================================================== witness statement == */

  function renderWitness(a, C) {
    var qn = 0;
    function qa(q, ans) {
      qn++;
      return '<div class="doc__qa"><p class="doc__q"><strong>Q' + qn + ':</strong> ' + q + '</p>' +
        '<p class="doc__a"><strong>A' + qn + ':</strong> ' + ans + '</p></div>';
    }
    var W = blank(a.witnessName);
    var html = '<div class="doc doc--court">' + caption(a) + title2('PENYATA SAKSI SP-1', 'WITNESS STATEMENT OF SP-1');

    html += '<table class="doc__table doc__table--intro"><tbody>' +
      '<tr><td>Name of witness</td><td><strong>' + W + '</strong></td></tr>' +
      '<tr><td>NRIC No.</td><td>' + blank(a.witnessNric) + '</td></tr>' +
      '<tr><td>Occupation</td><td>' + blank(a.witnessRole) + '</td></tr>' +
      '<tr><td>Address</td><td>' + blank(a.pAddress).replace(/\n/g, ', ') + '</td></tr>' +
      '</tbody></table>';

    html += qa('Please state your full name, NRIC number and occupation.',
      'My name is ' + W + ' (NRIC No. ' + blank(a.witnessNric) + '). I am the ' + blank(a.witnessRole) + ' of the Plaintiff.');

    html += qa('What is your role in this matter, and how do you know the facts you are about to give?',
      'In my capacity as ' + blank(a.witnessRole) + ' of the Plaintiff, I had personal conduct of the Plaintiff’s dealings with the Defendant. I am authorised by the Plaintiff to give this statement, and the facts below are within my personal knowledge or derived from the Plaintiff’s business records, to which I have full access.');

    html += qa('Do you know the Defendant?',
      'Yes. The Defendant is a customer of the Plaintiff' + (a.pBusiness ? ', which carries on the business of ' + esc(a.pBusiness) : '') + '.');

    /* Engagement. */
    var engQ = 'How did the dealings between the Plaintiff and the Defendant in this suit come about?';
    var engA;
    if (a.linkType === 'contract') {
      engA = 'The Defendant engaged the Plaintiff under a written agreement dated ' + fmtDate(a.linkDate) +
        (a.linkRef ? ' (Ref: ' + esc(a.linkRef) + ')' : '') + ' to ' + blank(a.linkDesc) + '.';
    } else if (a.linkType === 'po') {
      engA = 'The Defendant issued Purchase Order No. ' + blank(a.linkRef) + ' dated ' + fmtDate(a.linkDate) +
        ' to the Plaintiff, engaging the Plaintiff to ' + blank(a.linkDesc) + '.';
    } else if (a.linkType === 'quotation') {
      engA = 'The Plaintiff issued Quotation No. ' + blank(a.linkRef) + ' dated ' + fmtDate(a.linkDate) +
        ', which the Defendant accepted, for ' + blank(a.linkDesc) + '.';
    } else if (a.linkType === 'oral') {
      engA = 'The parties reached an oral agreement in or around ' + fmtDate(a.linkDate) + ' under which the Plaintiff was to ' + blank(a.linkDesc) + '.';
    } else {
      engA = 'The Defendant requested, and the Plaintiff agreed to provide, ' + blank(a.linkDesc, 'goods and/or services') + '.';
    }
    if (C.refs.contract) {
      engA += ' I refer to ' + C.refs.text(C.refs.contract) + ' of Documents (“BOD”), which is a true copy of that document.';
    }
    html += qa(engQ, engA);

    html += qa('Did the Plaintiff carry out its side of the bargain?',
      'Yes. The Plaintiff duly ' + subject(a, 'supplied') + ' as agreed.' +
      (a.performed === 'complaints'
        ? ' The Defendant raised ' + blank(a.complaintsDesc) + (a.complaintsResponse ? ', which the Plaintiff addressed, ' + esc(a.complaintsResponse) : '') + '. No complaint remained outstanding.' +
          (C.refs.resolution ? ' I refer to ' + C.refs.text(C.refs.resolution) + ', which evidences the resolution.' : '')
        : ' At no time did the Defendant complain about, object to, or reject ' + subject(a, 'noun') + '.'));

    if (a.hasCreditNote === 'yes') {
      html += qa('Did the Plaintiff allow the Defendant any reduction?',
        'Yes. The Plaintiff issued a credit note' + (a.creditNoteRef ? ' No. ' + blank(a.creditNoteRef) : '') +
        ' dated ' + fmtDate(a.creditNoteDate) + ' allowing a reduction of ' + rm(a.creditNoteAmount) +
        (a.creditNoteReason ? ' in respect of ' + esc(a.creditNoteReason) : '') + '.' +
        (C.refs.creditNote ? ' I refer to ' + C.refs.text(C.refs.creditNote) + '.' : '') +
        ' The sum claimed is net of that reduction, the Plaintiff claims only what is properly due.');
    }

    if (a.hasInvoices === 'yes' && C.invoices.length) {
      var invA = 'Yes. The Plaintiff issued the following invoice' + (C.invoices.length > 1 ? 's' : '') + ' to the Defendant: ' +
        C.invoices.map(function (i) {
          var s = 'Invoice No. ' + blank(i.no) + ' dated ' + fmtDate(i.date) + ' for ' + rmPlain(i.amount);
          var d = C.refs.invoice(i.no);
          if (d) s += ' (' + C.refs.text(d) + ')';
          return s;
        }).join('; ') + '. The total invoiced is ' + rm(C.invTotal) + '.' +
        (a.creditDays ? ' Each invoice was payable ' + (a.creditDays === '0' ? 'on presentation' : 'within ' + esc(a.creditDays) + ' days of its date') + '.' : '') +
        ' These invoices are true copies from the Plaintiff’s records.';
      html += qa('Did the Plaintiff invoice the Defendant?', invA);
    } else {
      html += qa('How was the sum owed by the Defendant recorded?',
        blank(a.basisNoInvoice, 'The sum was agreed between the parties') + '. The amount payable is ' + rm(a.debtAmount) + '.');
    }

    if (C.payments.length) {
      html += qa('Did the Defendant make any payment?',
        'Yes, in part. The Defendant paid: ' + C.payments.map(function (p) {
          return rmPlain(p.amount) + ' on ' + fmtDate(p.date) + (p.ref ? ' (' + esc(p.ref) + ')' : '');
        }).join('; ') + ', totalling ' + rm(C.payTotal) + '.' +
        (C.refs.payment ? ' I refer to ' + C.refs.text(C.refs.payment) + '.' : '') +
        ' The Defendant made these payments without protest, which shows the Defendant accepted the sums invoiced. After these payments, ' + rm(a.debtAmount) + ' remains unpaid.');
    } else {
      html += qa('Did the Defendant make any payment towards the sum claimed?',
        'No. The Defendant has not paid the sum claimed or any part of it.');
    }

    html += qa('What is the amount outstanding from the Defendant to the Plaintiff?',
      'The sum of ' + rm(a.debtAmount) + ' remains due and owing from the Defendant to the Plaintiff.');

    if (a.lodSent === 'yes') {
      html += qa('What did the Plaintiff do to recover the debt before filing this suit?',
        'The Plaintiff issued a letter of demand dated ' + fmtDate(a.lodDate) +
        (a.lodMode ? ' by ' + esc(a.lodMode) : '') +
        (C.refs.lod ? ', I refer to ' + C.refs.text(C.refs.lod) + ',' : '') +
        ' demanding payment. Despite the demand, the Defendant failed, refused and/or neglected to pay.');
    } else {
      html += qa('Did the Plaintiff ask the Defendant for payment before filing this suit?',
        'Yes, the Plaintiff requested payment on several occasions, but the Defendant failed, refused and/or neglected to pay.');
    }

    if (C.docs.length) {
      html += qa('I refer you to the Plaintiff’s Bundle of Documents, pages 1-' + C.totalPages + '. What are those documents?',
        'They are true copies of documents kept in and produced from the Plaintiff’s records in the ordinary course of business, being the contract and ordering documents, invoices, proof of performance, payment records, the letter of demand and related correspondence in this matter.');
    }

    html += qa('What does the Plaintiff seek in this action?',
      'The Plaintiff seeks judgment against the Defendant for the sum of ' + rm(a.debtAmount) +
      ', together with interest and costs, as set out in the Statement of Claim.');

    html += '<p style="margin-top:2em">I confirm that the contents of this Witness Statement are true to the best of my knowledge, information and belief.</p>' +
      '<div class="doc__sig" style="max-width:300px;margin-top:3em"><div class="doc__sig-line"></div>' +
      '<p><strong>' + W + '</strong><br>' + blank(a.witnessRole) + ' of the Plaintiff<br>Date: ____________</p></div>';

    html += notice('witness statement');
    return html + '</div>';
  }

  /* ================================================ bundle of documents == */

  function renderBundle(a, C) {
    var html = '<div class="doc doc--court">' + caption(a) +
      title2('IKATAN DOKUMEN PLAINTIF', 'PLAINTIFF’S BUNDLE OF DOCUMENTS');

    if (!C.docs.length) {
      html += '<p style="text-align:center;margin:3em 0">No documents uploaded yet, add your invoices, contract, payment records and letter of demand in the interview to build the bundle.</p>';
      html += notice('bundle of documents');
      return html + '</div>';
    }

    /* Index. */
    html += '<h2 style="text-align:center;margin:1.6em 0 .8em">INDEKS / INDEX</h2>';
    html += '<table class="doc__table"><thead><tr><th style="width:44px">No.</th><th style="width:110px">Date</th><th>Description of Document</th><th style="width:80px">Page(s)</th></tr></thead><tbody>';
    C.docs.forEach(function (d) {
      html += '<tr><td>' + d.tab + '</td><td>' + (d.date ? fmtDate(d.date) : 'Undated') + '</td>' +
        '<td>' + blank(d.desc || d.name) + '</td>' +
        '<td>' + (d.p1 === d.p2 ? d.p1 : d.p1 + '-' + d.p2) + '</td></tr>';
    });
    html += '</tbody></table>';

    if (C.missing.length) {
      html += '<div class="doc__missing"><p><strong>Still to be included before filing:</strong></p><ul>' +
        C.missing.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></div>';
    }

    /* Exhibit pages. Embedded images each get a clean page; documents that
       will be physically inserted are listed compactly instead of each
       burning a near-empty page. */
    var flow = [];
    var pages = [];
    C.docs.forEach(function (d) {
      if (d.dataUrl && /^image\//.test(d.mime || '')) pages.push(d);
      else flow.push(d);
    });

    if (flow.length) {
      html += '<h2 style="margin:1.8em 0 .5em">Documents to insert when compiling the bundle</h2>' +
        '<p style="font-size:.92em;margin-bottom:.6em">Print each file and insert it at its page position:</p>' +
        '<table class="doc__table"><tbody>';
      flow.forEach(function (d) {
        var pageWord = d.p1 === d.p2 ? 'p. ' + d.p1 : 'pp. ' + d.p1 + '-' + d.p2;
        html += '<tr><td style="width:44px">' + d.tab + '</td>' +
          '<td>' + blank(d.desc || d.name) + '<br><span style="font-size:.85em;color:#555">' + blank(d.name) +
          (d.dataUrl ? '' : ', not attached in this session') + '</span></td>' +
          '<td style="width:90px">' + pageWord + '</td></tr>';
      });
      html += '</tbody></table>';
    }

    pages.forEach(function (d) {
      html += '<div class="doc__exhibit doc__exhibit--page">' +
        '<br clear="all" class="doc__wordbreak">' +
        '<div class="doc__exhibit-head"><span><strong>' + d.tab + '.</strong> ' + blank(d.desc || d.name) + '</span>' +
        '<span>' + (d.date ? fmtDate(d.date) : 'Undated') + ' &nbsp;·&nbsp; ' + (d.p1 === d.p2 ? 'p. ' + d.p1 : 'pp. ' + d.p1 + '-' + d.p2) + '</span></div>' +
        '<img class="doc__exhibit-img" src="' + d.dataUrl + '" alt="' + blank(d.desc || d.name) + '">' +
        '</div>';
    });

    html += notice('bundle of documents');
    return html + '</div>';
  }

  /* ================================================ judgment in default == */
  /* Stage 2 of the debt-recovery lifecycle: the defendant was served and
     never responded. Liquidated demand, so final judgment, in default of
     appearance (O.13 ROC 2012) or of defence (O.19) depending on whether an
     appearance was entered. */

  function renderJid(a, C) {
    var ofDefence = a.appearanceEntered === 'yes';
    var html = '<div class="doc doc--court">' + caption(a) +
      title2(ofDefence ? 'PENGHAKIMAN INGKAR PEMBELAAN' : 'PENGHAKIMAN INGKAR KEHADIRAN',
             ofDefence ? 'JUDGMENT IN DEFAULT OF DEFENCE' : 'JUDGMENT IN DEFAULT OF APPEARANCE');

    html += '<p style="margin-top:1.6em">' + (ofDefence
      ? 'The Defendant having entered an appearance herein but having failed to serve a defence within the time limited,'
      : 'No appearance having been entered by the Defendant herein, the Writ of Summons and Statement of Claim having been duly served on the Defendant on ' +
        fmtDate(a.serviceDate) + (a.serviceMode ? ' by ' + esc(a.serviceMode) : '') + ' as appears from the Affidavit of Service filed herein,') +
      ' and the time limited having expired;</p>';

    html += '<p style="margin-top:1.2em"><strong>IT IS THIS DAY ADJUDGED</strong> that the Defendant do pay the Plaintiff:</p>' +
      '<ol class="doc__prayer">' +
      '<li>the sum of ' + rm(a.debtAmount) + ';</li>' +
      '<li>interest on the said sum at the rate of 5% per annum from ' +
        (a.writDate ? fmtDate(a.writDate) : 'the date of the Writ herein') +
        ' until the date of full realisation, pursuant to section 11 of the Civil Law Act 1956; and</li>' +
      '<li>costs of ' + (a.costsAmount ? rm(a.costsAmount) : 'RM ____________ (as per the applicable scale)') + '.</li>' +
      '</ol>';

    html += '<p style="margin-top:2em">Dated this ______ day of ____________ 20____.</p>' +
      '<div class="doc__sig" style="max-width:300px;margin-top:3em"><div class="doc__sig-line"></div>' +
      '<p><strong>' + court(a).registrar + '</strong><br>' + court(a).seat + ', ' + blank(a.courtTown) +
      '<br><em>(Meterai Mahkamah / Seal of the Court)</em></p></div>' +
      '<p style="margin-top:2.5em;font-size:.92em">This Judgment is entered at the request of ' + blank(a.pName) +
      ', whose address for service is ' + blank(a.pAddress).replace(/\n/g, ', ') + '.</p>';

    html += notice('judgment in default');
    return html + '</div>';
  }

  function renderAffidavit(a, C) {
    var server = a.serverName ? a : null;
    var html = '<div class="doc doc--court">' + caption(a) +
      title2('AFIDAVIT PENYAMPAIAN', 'AFFIDAVIT OF SERVICE');

    html += '<p style="margin-top:1.6em">I, <strong>' + blank(a.serverName) + '</strong> (NRIC No. ' + blank(a.serverNric) +
      '), of full age, ' + (a.serverRole ? esc(a.serverRole) + ' of the Plaintiff' : 'process server') +
      ', affirm and say as follows:</p>';

    var n = 0;
    var next = function () { return ++n; };
    html += numPara(next(), 'I am duly authorised by the Plaintiff to effect service of documents in this action and to affirm this Affidavit.');
    html += numPara(next(), 'On ' + fmtDate(a.serviceDate) + ', I served the sealed copy of the Writ of Summons and Statement of Claim herein on the Defendant, <strong>' +
      blank(a.dName) + '</strong>, at ' + blank(a.dAddress).replace(/\n/g, ', ') +
      (a.serviceMode ? ', by ' + esc(a.serviceMode) : '') + '.');
    html += numPara(next(), 'Annexed hereto and marked as Exhibit “A” is a true copy of the Writ of Summons and Statement of Claim so served' +
      (a.serviceMode === 'registered post' ? ', together with the registered-post posting receipt and tracking record' : '') + '.');
    html += numPara(next(), 'To the best of my knowledge, information and belief, the Defendant has not entered any appearance in this action as at the date of this Affidavit.');

    html += '<div class="doc__missing" style="margin-top:2em"><p><strong>Jurat, affirm before a Commissioner for Oaths:</strong></p>' +
      '<p style="margin-top:.6em">Affirmed at ____________________ )<br>' +
      'this ______ day of ____________ 20____ )<br>' +
      'by the abovenamed ' + blank(a.serverName) + ' )</p>' +
      '<div class="doc__sig" style="max-width:280px;margin-top:2em"><div class="doc__sig-line"></div>' +
      '<p><strong>Before me,</strong><br>Commissioner for Oaths / Pesuruhjaya Sumpah</p></div></div>';

    html += notice('affidavit of service');
    return html + '</div>';
  }

  /* ------------------------------- Order 14, summary judgment -- */
  /* The standard fast route where the debt is plainly owed: once the
     Defendant enters appearance, the Plaintiff applies for judgment without
     trial. Two documents, taken out together: the Summons in Chambers and
     the Affidavit in Support that carries the merits. */

  function interestWords(a) {
    return a.interest === 'contractual'
      ? 'at the rate of ' + blank(a.contractualRate, '__') + '% per annum from the due date(s) until the date of full realisation'
      : 'at the rate of 5% per annum from the date of the Writ herein until the date of full realisation, pursuant to section 11 of the Civil Law Act 1956';
  }

  function renderSjSummons(a, C) {
    var CT = court(a);
    var html = '<div class="doc doc--court">' + caption(a) +
      title2('SAMAN DALAM KAMAR', 'SUMMONS IN CHAMBERS');

    html += '<p style="margin-top:1.4em">Upon the application of the abovenamed Plaintiff and upon reading the Affidavit in Support of <strong>' +
      blank(a.witnessName) + '</strong> affirmed on the ______ day of ____________ 20____, and upon hearing counsel for the parties;</p>';

    html += '<p><strong>LET ALL PARTIES</strong> concerned attend before the ' + CT.registrar.split(' / ')[0] +
      ' of this Honourable Court at ' + blank(a.courtTown) + ' on the ______ day of ____________ 20____ at ______ o’clock, ' +
      'on the hearing of an application on the part of the Plaintiff for the following orders:</p>';

    html += '<ol class="doc__prayer">' +
      '<li>That final judgment be entered against the Defendant for the sum of ' + rm(a.debtAmount) +
        ' being the amount due and owing to the Plaintiff, pursuant to <strong>Order 14 rule 1 of the Rules of Court 2012</strong>;</li>' +
      '<li>That the Defendant do pay interest on the said sum ' + interestWords(a) + ';</li>' +
      '<li>That the Defendant do pay the costs of this application and of this action; and</li>' +
      '<li>Such further or other relief as this Honourable Court deems fit and proper.</li>' +
      '</ol>';

    html += '<p style="margin-top:1.6em">Dated this ______ day of ____________ 20____.</p>';

    html += '<div class="doc__sig-grid" style="margin-top:2.5em">' +
      '<div class="doc__sig"><div class="doc__sig-line"></div><p><strong>' + CT.registrar + '</strong><br>' +
        CT.seat + ', ' + blank(a.courtTown) + '<br><em>(Meterai Mahkamah / Seal of the Court)</em></p></div>' +
      '<div class="doc__sig"><div class="doc__sig-line"></div><p><strong>' + blank(a.pName) +
        '</strong><br>Plaintiff / Solicitors for the Plaintiff</p></div>' +
      '</div>';

    html += '<p style="margin-top:1.8em;font-size:.92em">This Summons is taken out by the Plaintiff, whose address for service is ' +
      blank(a.pAddress).replace(/\n/g, ', ') + '.</p>';

    html += '<p style="margin-top:1em;font-size:.92em"><strong>NOTE:</strong> If the Defendant does not attend, personally or by counsel, ' +
      'at the time and place stated above, such order will be made as the Court thinks just and expedient.</p>';

    html += notice('summons in chambers');
    return html + '</div>';
  }

  function renderSjAffidavit(a, C) {
    var html = '<div class="doc doc--court">' + caption(a) +
      title2('AFIDAVIT SOKONGAN', 'AFFIDAVIT IN SUPPORT');

    html += '<p style="margin-top:1.4em">I, <strong>' + blank(a.witnessName) + '</strong> (NRIC No. ' +
      blank(a.witnessNric) + '), of full age and of ' + blank(a.pAddress).replace(/\n/g, ', ') +
      ', do solemnly affirm and say as follows:</p>';

    var n = 0;
    var next = function () { return ++n; };

    html += numPara(next(), 'I am the ' + (a.witnessRole ? esc(a.witnessRole) : 'Director') +
      ' of the Plaintiff and am duly authorised to affirm this Affidavit on its behalf. The facts deposed to herein are within my own knowledge, save where otherwise appears, and are true.');

    html += numPara(next(), 'The Writ of Summons and Statement of Claim herein were filed on ' +
      (a.writDate ? fmtDate(a.writDate) : '______________') + ' and served on the Defendant on ' +
      (a.serviceDate ? fmtDate(a.serviceDate) : '______________') + '.');

    html += numPara(next(), 'The Defendant entered appearance on ' +
      (a.appearanceDate ? fmtDate(a.appearanceDate) : '______________') + '.');

    html += numPara(next(), 'The Plaintiff’s claim is for ' + rm(a.debtAmount) +
      ' being the price of ' + subject(a, 'noun') + ' sold and delivered, or services rendered, by the Plaintiff to the Defendant at the Defendant’s request, ' +
      'as particularised in the Statement of Claim. Annexed hereto and marked as <strong>Exhibit “A”</strong> is a copy of the Statement of Claim.');

    if ((a.invoices || []).length) {
      html += numPara(next(), 'The said sum is evidenced by the invoices rendered to the Defendant, copies of which are annexed hereto and marked as <strong>Exhibit “B”</strong>. ' +
        'The invoices were duly delivered to the Defendant and no dispute was raised as to their correctness at the material time.');
    }

    if (a.lodSent === 'yes') {
      html += numPara(next(), 'By a letter of demand dated ' + (a.lodDate ? fmtDate(a.lodDate) : '______________') +
        ', a copy of which is annexed hereto and marked as <strong>Exhibit “C”</strong>, the Plaintiff demanded payment of the said sum. The Defendant has failed, refused and or neglected to pay the same.');
    }

    if (a.priorPayments === 'yes') {
      html += numPara(next(), 'The Defendant has made part payment towards the said sum, which payments have been duly credited to the Defendant’s account. ' +
        'The sum now claimed is the balance remaining due after such credit. The part payment is, in the premises, an acknowledgement of the debt.');
    }

    if (a.hasCreditNote === 'yes') {
      html += numPara(next(), 'A credit note dated ' + (a.creditNoteDate ? fmtDate(a.creditNoteDate) : '______________') +
        ' in the sum of ' + rm(a.creditNoteAmount) + ' was issued to the Defendant, and the sum claimed herein is net of that reduction.');
    }

    html += numPara(next(), 'The Defendant is justly and truly indebted to the Plaintiff in the sum of ' + rm(a.debtAmount) +
      ', which sum remains wholly due and owing as at the date hereof.');

    html += numPara(next(), 'I verily believe that <strong>the Defendant has no defence to the Plaintiff’s claim</strong>, and that appearance was entered solely for the purpose of delay.');

    html += numPara(next(), 'In the premises, I humbly pray that final judgment be entered against the Defendant in terms of the Summons in Chambers herein, ' +
      'pursuant to Order 14 rule 1 of the Rules of Court 2012, with interest and costs.');

    html += '<div class="doc__missing" style="margin-top:2em"><p><strong>Jurat, affirm before a Commissioner for Oaths:</strong></p>' +
      '<p style="margin-top:.6em">Affirmed at ____________________ )<br>' +
      'this ______ day of ____________ 20____ )<br>' +
      'by the abovenamed ' + blank(a.witnessName) + ' )</p>' +
      '<div class="doc__sig" style="max-width:280px;margin-top:2em"><div class="doc__sig-line"></div>' +
      '<p><strong>Before me,</strong><br>Commissioner for Oaths / Pesuruhjaya Sumpah</p></div></div>';

    html += '<div class="doc__missing" style="margin-top:1.6em"><p><strong>Before filing, confirm:</strong> the Defendant has entered appearance; ' +
      'the claim is a liquidated demand within Order 14; and the exhibits are certified copies. ' +
      'Order 14 does not apply to claims founded on libel, slander, malicious prosecution, false imprisonment or fraud.</p></div>';

    html += notice('affidavit in support');
    return html + '</div>';
  }

  /* ------------------------------------------------------------ exports -- */

  global.LG_LIT = {
    STATES: STATES,
    DOC_CATS: DOC_CATS,
    court: court,
    courtLevelFor: courtLevelFor,
    compute: compute,
    fmtDate: fmtDate,
    rm: rm,
    render: {
      writ: renderWrit,
      claim: renderClaim,
      reply: renderReply,
      chronology: renderChronology,
      witness: renderWitness,
      bundle: renderBundle,
      jid: renderJid,
      affidavit: renderAffidavit,
      sjsummons: renderSjSummons,
      sjaffidavit: renderSjAffidavit
    }
  };

})(window);
