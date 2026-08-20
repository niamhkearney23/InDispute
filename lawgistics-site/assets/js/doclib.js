/* ==========================================================================
   Lawgistics, document library
   Guided-question definitions and drafting logic for the document creator.
   Each entry: steps (question groups) + render(answers) -> document HTML.
   Drafted for Malaysian practice; generated documents carry a review notice.
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

  function paras(text) {
    return String(text || '').split('\n').filter(function (l) { return l.trim(); })
      .map(function (l) { return '<p>' + esc(l.trim()) + '</p>'; }).join('');
  }

  /* Shared renderer: numbered clauses + signature blocks. */
  function agreement(opts) {
    var html = '<div class="doc">';
    html += '<h1 class="doc__title">' + esc(opts.title) + '</h1>';
    if (opts.dated) html += '<p class="doc__dated">Dated ' + opts.dated + '</p>';

    html += '<div class="doc__parties"><h2>Parties</h2><ol>';
    opts.parties.forEach(function (p) { html += '<li>' + p + '</li>'; });
    html += '</ol></div>';

    if (opts.recitals && opts.recitals.length) {
      html += '<div class="doc__recitals"><h2>Background</h2>';
      opts.recitals.forEach(function (r) { html += '<p>' + r + '</p>'; });
      html += '</div>';
    }

    html += '<p class="doc__operative">The parties agree as follows:</p>';

    opts.clauses.forEach(function (c, i) {
      html += '<section class="doc__clause"><h2>' + (i + 1) + '. ' + esc(c.h) + '</h2>';
      c.body.forEach(function (b, j) {
        html += '<p><span class="doc__num">' + (i + 1) + '.' + (j + 1) + '</span> ' + b + '</p>';
      });
      html += '</section>';
    });

    html += '<div class="doc__sigs"><h2>Signed by the parties</h2><div class="doc__sig-grid">';
    opts.signatures.forEach(function (s) {
      html += '<div class="doc__sig"><div class="doc__sig-line"></div>' +
        '<p><strong>' + s.name + '</strong><br>' + s.role + '<br>Date: ____________</p></div>';
    });
    html += '</div></div>';

    html += '<p class="doc__notice">Generated with Lawgistics. This template reflects common Malaysian practice but is not legal advice, have it reviewed before signing if the stakes are high.</p>';
    html += '</div>';
    return html;
  }

  /* ------------------------------------------------------------------- */

  global.LG_DOCS = {

    /* ==================================================== employment == */
    'employment-contract': {
      title: 'Employment Contract',
      description: 'A full-term employment contract aligned with the Employment Act 1955.',
      steps: [
        { title: 'The employer', fields: [
          { key: 'employerName', label: 'Company name', type: 'text', required: true, placeholder: 'e.g. Harbour Cafe Sdn Bhd' },
          { key: 'employerRegNo', label: 'Registration no. (SSM)', type: 'text', placeholder: '20230100xxxx' },
          { key: 'employerAddress', label: 'Registered address', type: 'textarea', required: true }
        ]},
        { title: 'The employee', fields: [
          { key: 'employeeName', label: 'Full name', type: 'text', required: true },
          { key: 'employeeNric', label: 'NRIC / passport no.', type: 'text', required: true },
          { key: 'employeeAddress', label: 'Address', type: 'textarea', required: true }
        ]},
        { title: 'Role & term', fields: [
          { key: 'jobTitle', label: 'Job title', type: 'text', required: true, placeholder: 'e.g. Operations Manager' },
          { key: 'startDate', label: 'Start date', type: 'date', required: true },
          { key: 'probationMonths', label: 'Probation period', type: 'select', options: [['0', 'No probation'], ['3', '3 months'], ['6', '6 months']], value: '3' },
          { key: 'workLocation', label: 'Place of work', type: 'text', required: true, placeholder: 'e.g. Kuala Lumpur office' },
          { key: 'workingHours', label: 'Working hours', type: 'text', value: '9:00am to 6:00pm, Monday to Friday', help: 'The Employment Act caps normal hours at 45 per week.' }
        ]},
        { title: 'Pay & leave', fields: [
          { key: 'monthlySalary', label: 'Monthly salary (RM)', type: 'number', required: true },
          { key: 'annualLeave', label: 'Annual leave (days/year)', type: 'number', value: '14', help: 'Statutory minimum is 8-16 days depending on service length.' },
          { key: 'sickLeave', label: 'Paid sick leave (days/year)', type: 'number', value: '14' }
        ]},
        { title: 'Protections & notice', fields: [
          { key: 'nonSolicitMonths', label: 'Non-solicitation after leaving', type: 'select', options: [['0', 'None'], ['6', '6 months'], ['12', '12 months']], value: '6', help: 'Non-competes are generally void under s.28 Contracts Act 1950, non-solicitation is the enforceable alternative.' },
          { key: 'noticeWeeks', label: 'Notice period (either side)', type: 'select', options: [['4', '4 weeks'], ['8', '8 weeks'], ['12', '12 weeks']], value: '4' }
        ]}
      ],
      render: function (a) {
        var probation = Number(a.probationMonths) || 0;
        var nonSolicit = Number(a.nonSolicitMonths) || 0;
        var clauses = [
          { h: 'Appointment', body: [
            'The Company employs the Employee as <strong>' + blank(a.jobTitle) + '</strong>, and the Employee accepts the employment, on the terms of this Agreement.',
            'Employment commences on ' + fmtDate(a.startDate) + '.'
          ]},
          probation > 0 ? { h: 'Probation', body: [
            'The first ' + probation + ' months of employment are a probationary period. The Company may extend probation once, by written notice, for up to the same length again.',
            'During probation either party may terminate this Agreement on two (2) weeks’ written notice. Confirmation of employment will be communicated in writing.'
          ] } : null,
          { h: 'Duties', body: [
            'The Employee shall perform the duties reasonably assigned to the role, devote their working time and attention to the Company’s business, and comply with the Company’s lawful policies as amended from time to time.',
            'The Employee shall not, without the Company’s prior written consent, engage in any other employment or business that conflicts with the Company’s interests.'
          ]},
          { h: 'Place and hours of work', body: [
            'The Employee’s normal place of work is ' + blank(a.workLocation) + '. The Company may require reasonable travel in the course of duties.',
            'Normal working hours are ' + blank(a.workingHours) + ', subject always to the limits in the Employment Act 1955. Overtime, where applicable, is payable at statutory rates.'
          ]},
          { h: 'Remuneration', body: [
            'The Employee’s salary is ' + rm(a.monthlySalary) + ' per month, payable in arrears no later than the seventh day of the following month.',
            'The Company shall make, and may deduct, the statutory contributions and deductions required by law, including EPF, SOCSO, EIS, and monthly tax deduction (PCB).'
          ]},
          { h: 'Leave', body: [
            'The Employee is entitled to ' + blank(a.annualLeave, '____') + ' days’ paid annual leave per year of service, or the statutory minimum under the Employment Act 1955 if greater, to be taken at times agreed with the Company.',
            'The Employee is entitled to ' + blank(a.sickLeave, '____') + ' days’ paid sick leave per year (or the statutory minimum if greater), and to hospitalisation leave and public holidays as provided by law.'
          ]},
          { h: 'Confidentiality', body: [
            'The Employee shall keep confidential all information of the Company that is not public, including customer lists, pricing, know-how, and business plans, and shall use it only for the Company’s benefit.',
            'This obligation continues after employment ends, for so long as the information remains confidential.'
          ]},
          nonSolicit > 0 ? { h: 'Non-solicitation', body: [
            'For ' + nonSolicit + ' months after employment ends, the Employee shall not solicit or entice away any customer or employee of the Company with whom the Employee had material dealings in the final twelve (12) months of employment.',
            'The parties consider this restriction reasonable to protect the Company’s legitimate business interests.'
          ] } : null,
          { h: 'Termination', body: [
            'After confirmation, either party may terminate this Agreement by giving ' + (Number(a.noticeWeeks) || 4) + ' weeks’ written notice, or payment of salary in lieu, without prejudice to any longer minimum notice required by section 12 of the Employment Act 1955.',
            'The Company may terminate without notice for misconduct, after due inquiry, in accordance with law.',
            'On termination the Employee shall return all Company property, documents, and data.'
          ]},
          { h: 'General', body: [
            'This Agreement is the entire agreement between the parties on its subject matter and supersedes prior discussions.',
            'Any variation must be in writing and signed by both parties.'
          ]},
          { h: 'Governing law', body: [
            'This Agreement is governed by the laws of Malaysia, and the parties submit to the jurisdiction of the Malaysian courts.'
          ]}
        ].filter(Boolean);

        return agreement({
          title: 'Employment Contract',
          dated: fmtDate(a.startDate),
          parties: [
            '<strong>' + blank(a.employerName) + '</strong>' +
              (a.employerRegNo ? ' (Company No. ' + esc(a.employerRegNo) + ')' : '') +
              ', of ' + blank(a.employerAddress) + ' (the “Company”); and',
            '<strong>' + blank(a.employeeName) + '</strong> (NRIC/Passport No. ' + blank(a.employeeNric) + '), of ' + blank(a.employeeAddress) + ' (the “Employee”).'
          ],
          clauses: clauses,
          signatures: [
            { name: blank(a.employerName), role: 'For and on behalf of the Company' },
            { name: blank(a.employeeName), role: 'The Employee' }
          ]
        });
      }
    },

    /* ====================================================== mutual NDA == */
    'nda-mutual': {
      title: 'Non-Disclosure Agreement (Mutual)',
      description: 'Two-way confidentiality for deals, due diligence, and partnerships.',
      steps: [
        { title: 'First party', fields: [
          { key: 'p1Name', label: 'Name / company', type: 'text', required: true },
          { key: 'p1RegNo', label: 'Registration / NRIC no.', type: 'text' },
          { key: 'p1Address', label: 'Address', type: 'textarea', required: true }
        ]},
        { title: 'Second party', fields: [
          { key: 'p2Name', label: 'Name / company', type: 'text', required: true },
          { key: 'p2RegNo', label: 'Registration / NRIC no.', type: 'text' },
          { key: 'p2Address', label: 'Address', type: 'textarea', required: true }
        ]},
        { title: 'The deal', fields: [
          { key: 'purpose', label: 'Purpose of the disclosure', type: 'textarea', required: true, placeholder: 'e.g. evaluating a proposed distribution partnership for the Malaysian market', help: 'Be specific, information may only be used for this purpose.' },
          { key: 'effectiveDate', label: 'Effective date', type: 'date', required: true },
          { key: 'termYears', label: 'Confidentiality period', type: 'select', options: [['1', '1 year'], ['2', '2 years'], ['3', '3 years'], ['5', '5 years']], value: '3' }
        ]}
      ],
      render: function (a) {
        var years = Number(a.termYears) || 3;
        return agreement({
          title: 'Mutual Non-Disclosure Agreement',
          dated: fmtDate(a.effectiveDate),
          parties: [
            '<strong>' + blank(a.p1Name) + '</strong>' + (a.p1RegNo ? ' (No. ' + esc(a.p1RegNo) + ')' : '') + ', of ' + blank(a.p1Address) + '; and',
            '<strong>' + blank(a.p2Name) + '</strong>' + (a.p2RegNo ? ' (No. ' + esc(a.p2RegNo) + ')' : '') + ', of ' + blank(a.p2Address) + '.'
          ],
          recitals: [
            'Each party may disclose confidential information to the other for the purpose of: ' + blank(a.purpose) + ' (the “Purpose”).'
          ],
          clauses: [
            { h: 'Confidential Information', body: [
              '“Confidential Information” means any non-public information disclosed by one party (the “Discloser”) to the other (the “Recipient”) in connection with the Purpose, whether written, oral, electronic, or observed, and includes business plans, financials, customer information, pricing, and technical material.',
              'Confidential Information does not include information that: (a) is or becomes public other than through the Recipient’s breach; (b) the Recipient already lawfully held without restriction; (c) is lawfully received from a third party free of restriction; or (d) the Recipient develops independently without using the Discloser’s information.'
            ]},
            { h: 'Obligations', body: [
              'The Recipient shall keep Confidential Information confidential, protect it with at least the care it applies to its own confidential information (and no less than reasonable care), and use it only for the Purpose.',
              'The Recipient may disclose Confidential Information to its directors, employees, and professional advisers who need it for the Purpose and are bound by obligations of confidence no less strict than this Agreement. The Recipient remains responsible for their compliance.',
              'If disclosure is required by law or a regulator, the Recipient may disclose the minimum required, and shall (where lawful) give the Discloser prompt notice to allow a protective response.'
            ]},
            { h: 'Term', body: [
              'This Agreement takes effect on ' + fmtDate(a.effectiveDate) + ' and the obligations of confidence continue for ' + years + ' year' + (years === 1 ? '' : 's') + ' from the date of each disclosure, and indefinitely for trade secrets.'
            ]},
            { h: 'Return or destruction', body: [
              'On the Discloser’s written request, the Recipient shall promptly return or destroy all Confidential Information and certify it has done so, save for copies required by law or automatic archival, which remain subject to this Agreement.'
            ]},
            { h: 'No licence; no obligation', body: [
              'No licence or other right in the Confidential Information is granted beyond the limited right to use it for the Purpose. Neither party is obliged to proceed with any transaction.'
            ]},
            { h: 'Remedies', body: [
              'Each party acknowledges that damages may not adequately compensate a breach of this Agreement, and that the Discloser may seek injunctive relief in addition to any other remedy.'
            ]},
            { h: 'Governing law', body: [
              'This Agreement is governed by the laws of Malaysia, and the parties submit to the jurisdiction of the Malaysian courts.'
            ]}
          ],
          signatures: [
            { name: blank(a.p1Name), role: 'Authorised signatory' },
            { name: blank(a.p2Name), role: 'Authorised signatory' }
          ]
        });
      }
    },

    /* ================================================ service agreement == */
    'service-agreement': {
      title: 'Service Agreement',
      description: 'Scope, payment, IP, termination, and a liability cap that protects you.',
      steps: [
        { title: 'The provider', fields: [
          { key: 'providerName', label: 'Provider name / company', type: 'text', required: true },
          { key: 'providerRegNo', label: 'Registration no.', type: 'text' },
          { key: 'providerAddress', label: 'Address', type: 'textarea', required: true }
        ]},
        { title: 'The client', fields: [
          { key: 'clientName', label: 'Client name / company', type: 'text', required: true },
          { key: 'clientRegNo', label: 'Registration no.', type: 'text' },
          { key: 'clientAddress', label: 'Address', type: 'textarea', required: true }
        ]},
        { title: 'Scope of work', fields: [
          { key: 'services', label: 'Services to be provided', type: 'textarea', required: true, placeholder: 'Describe deliverables, not activities, e.g. “design and deliver five responsive page templates, two revision rounds each”.', help: 'Anything outside this list is a paid variation.' },
          { key: 'startDate', label: 'Start date', type: 'date', required: true },
          { key: 'revisionRounds', label: 'Revision rounds included', type: 'select', options: [['1', 'One'], ['2', 'Two'], ['3', 'Three']], value: '2' }
        ]},
        { title: 'Fees & payment', fields: [
          { key: 'feeBasis', label: 'Fee structure', type: 'select', options: [['fixed', 'Fixed fee for the scope'], ['monthly', 'Monthly retainer'], ['hourly', 'Hourly rate']], value: 'fixed' },
          { key: 'feeAmount', label: 'Amount (RM)', type: 'number', required: true },
          { key: 'paymentDays', label: 'Invoices payable within', type: 'select', options: [['7', '7 days'], ['14', '14 days'], ['30', '30 days']], value: '14' },
          { key: 'deposit', label: 'Upfront deposit (%)', type: 'select', options: [['0', 'None'], ['30', '30%'], ['50', '50%']], value: '50' }
        ]},
        { title: 'Protections', fields: [
          { key: 'ipOwner', label: 'Who owns the deliverables?', type: 'select', options: [['client', 'Client, on full payment'], ['provider', 'Provider, client gets a licence']], value: 'client', help: 'Under the Copyright Act 1987 the creator owns commissioned work unless assigned in writing.' },
          { key: 'liabilityCap', label: 'Liability cap', type: 'select', options: [['paid', 'Total fees paid'], ['12m', 'Fees paid in the last 12 months']], value: 'paid' },
          { key: 'noticeDays', label: 'Termination notice', type: 'select', options: [['14', '14 days'], ['30', '30 days']], value: '30' }
        ]}
      ],
      render: function (a) {
        var basis = { fixed: 'a fixed fee of ' + rm(a.feeAmount) + ' for the Services',
                      monthly: 'a monthly retainer of ' + rm(a.feeAmount),
                      hourly: 'an hourly rate of ' + rm(a.feeAmount) }[a.feeBasis || 'fixed'];
        var deposit = Number(a.deposit) || 0;
        var payClauses = [
          'The Client shall pay the Provider ' + basis + '. All amounts are exclusive of any applicable taxes, which are payable in addition.',
          'Invoices are payable within ' + (Number(a.paymentDays) || 14) + ' days of the invoice date. Overdue amounts bear simple interest at 8% per year from the due date until payment.'
        ];
        if (deposit > 0) payClauses.splice(1, 0,
          'A deposit of ' + deposit + '% of the fee is payable on signing and the Provider is not obliged to commence work before it is received. The deposit is applied against the final invoice.');

        return agreement({
          title: 'Service Agreement',
          dated: fmtDate(a.startDate),
          parties: [
            '<strong>' + blank(a.providerName) + '</strong>' + (a.providerRegNo ? ' (No. ' + esc(a.providerRegNo) + ')' : '') + ', of ' + blank(a.providerAddress) + ' (the “Provider”); and',
            '<strong>' + blank(a.clientName) + '</strong>' + (a.clientRegNo ? ' (No. ' + esc(a.clientRegNo) + ')' : '') + ', of ' + blank(a.clientAddress) + ' (the “Client”).'
          ],
          clauses: [
            { h: 'Services', body: [
              'The Provider shall provide the following services (the “Services”), commencing on ' + fmtDate(a.startDate) + ': ' + blank(a.services) + '.',
              'The Services include ' + ({ 1: 'one round', 2: 'two rounds', 3: 'three rounds' }[Number(a.revisionRounds)] || 'two rounds') + ' of revisions per deliverable. Work outside the Services is a variation, to be scoped and priced in writing before it begins.'
            ]},
            { h: 'Fees and payment', body: payClauses },
            { h: 'Client obligations', body: [
              'The Client shall provide the information, materials, decisions, and approvals reasonably needed for the Services without undue delay. Time lost to the Client’s delay extends affected deadlines accordingly.'
            ]},
            { h: 'Intellectual property', body: a.ipOwner === 'provider' ? [
              'The Provider retains all intellectual property rights in the deliverables. On full payment, the Provider grants the Client a perpetual, non-exclusive licence to use the deliverables for the Client’s business purposes.',
              'Each party retains its pre-existing materials; the Provider may reuse general know-how, techniques, and tools.'
            ] : [
              'On receipt of full payment, the Provider assigns to the Client all intellectual property rights in the deliverables created specifically for the Client under this Agreement.',
              'The Provider retains its pre-existing materials and general know-how, and grants the Client a licence to use any pre-existing materials embedded in the deliverables.'
            ]},
            { h: 'Confidentiality', body: [
              'Each party shall keep the other’s non-public information confidential and use it only for this Agreement. This obligation survives termination.'
            ]},
            { h: 'Liability', body: [
              'Neither party is liable for indirect or consequential loss, or loss of profit, revenue, or data.',
              'Each party’s total liability under this Agreement is capped at ' + (a.liabilityCap === '12m' ? 'the fees paid by the Client in the twelve (12) months before the claim arose' : 'the total fees paid by the Client under this Agreement') + '. Nothing limits liability for fraud or any liability that cannot be limited by law.'
            ]},
            { h: 'Termination', body: [
              'Either party may terminate this Agreement on ' + (Number(a.noticeDays) || 30) + ' days’ written notice, or immediately if the other party materially breaches this Agreement and fails to remedy the breach within fourteen (14) days of written notice.',
              'On termination the Client shall pay for all Services performed to the date of termination, and clauses which by their nature survive (including confidentiality, IP, and liability) continue.'
            ]},
            { h: 'General', body: [
              'This Agreement is the entire agreement on its subject matter. Variations must be in writing. Neither party may assign it without the other’s consent, not to be unreasonably withheld.'
            ]},
            { h: 'Governing law and disputes', body: [
              'This Agreement is governed by the laws of Malaysia. The parties shall first attempt in good faith to resolve any dispute by negotiation between senior representatives, failing which the Malaysian courts have jurisdiction.'
            ]}
          ],
          signatures: [
            { name: blank(a.providerName), role: 'The Provider' },
            { name: blank(a.clientName), role: 'The Client' }
          ]
        });
      }
    },

    /* ================================================ letter of demand == */
    'letter-of-demand': {
      title: 'Letter of Demand',
      description: 'A formal pre-litigation demand that preserves your position.',
      steps: [
        { title: 'You (the creditor)', fields: [
          { key: 'senderName', label: 'Your name / company', type: 'text', required: true },
          { key: 'senderAddress', label: 'Your address', type: 'textarea', required: true },
          { key: 'signatoryName', label: 'Signatory name', type: 'text', required: true },
          { key: 'signatoryTitle', label: 'Signatory title', type: 'text', placeholder: 'e.g. Director' }
        ]},
        { title: 'The debtor', fields: [
          { key: 'debtorName', label: 'Debtor name / company', type: 'text', required: true },
          { key: 'debtorAddress', label: 'Debtor address', type: 'textarea', required: true }
        ]},
        { title: 'The debt', fields: [
          { key: 'amount', label: 'Amount owed (RM)', type: 'number', required: true },
          { key: 'basis', label: 'What is the debt for?', type: 'textarea', required: true, placeholder: 'e.g. goods sold and delivered under invoices INV-1041 and INV-1052 dated 3 May 2026 and 21 May 2026' },
          { key: 'dueDate', label: 'Original due date', type: 'date', required: true },
          { key: 'letterDate', label: 'Date of this letter', type: 'date', required: true },
          { key: 'deadlineDays', label: 'Deadline to pay', type: 'select', options: [['7', '7 days'], ['14', '14 days'], ['21', '21 days']], value: '14' }
        ]}
      ],
      render: function (a) {
        var days = Number(a.deadlineDays) || 14;
        return '<div class="doc doc--letter">' +
          '<p class="doc__from">' + blank(a.senderName) + '<br>' + blank(a.senderAddress).replace(/\n/g, '<br>') + '</p>' +
          '<p class="doc__dated" style="text-align:left">' + fmtDate(a.letterDate) + '</p>' +
          '<p>' + blank(a.debtorName) + '<br>' + blank(a.debtorAddress).replace(/\n/g, '<br>') + '</p>' +
          '<p><strong>BY HAND / REGISTERED POST / EMAIL</strong></p>' +
          '<h1 class="doc__re">RE: LETTER OF DEMAND, OUTSTANDING SUM OF ' + rm(a.amount).toUpperCase() + '</h1>' +
          '<p>We refer to the above matter.</p>' +
          '<p>The sum of <strong>' + rm(a.amount) + '</strong> is due and owing from you to ' + blank(a.senderName) + ' in respect of ' + blank(a.basis) + '. Payment fell due on ' + fmtDate(a.dueDate) + '. Despite reminders, the sum remains unpaid.</p>' +
          '<p><strong>TAKE NOTICE</strong> that we hereby demand payment of the sum of ' + rm(a.amount) + ' in full within <strong>' + days + ' (' + ({7:'seven',14:'fourteen',21:'twenty-one'}[days] || days) + ') days</strong> of the date of this letter.</p>' +
          '<p>If payment in full is not received within the stipulated period, we shall commence legal proceedings against you for recovery of the sum, together with interest and costs, without further reference to you. All our rights are expressly reserved.</p>' +
          '<p>Payment should be made to ' + blank(a.senderName) + '. If you dispute the sum claimed, state your grounds in writing within the same period.</p>' +
          '<p>Yours faithfully,</p>' +
          '<div class="doc__sig" style="max-width:280px"><div class="doc__sig-line"></div>' +
          '<p><strong>' + blank(a.signatoryName) + '</strong><br>' + blank(a.signatoryTitle, '') + '<br>' + blank(a.senderName) + '</p></div>' +
          '<p class="doc__notice">Generated with Lawgistics. This template reflects common Malaysian practice but is not legal advice, have it reviewed before sending if the stakes are high.</p>' +
          '</div>';
      }
    },

    /* ===================================================== offer letter == */
    'offer-letter': {
      title: 'Offer Letter',
      description: 'A conditional offer of employment, the contract follows once accepted.',
      steps: [
        { title: 'The company', fields: [
          { key: 'companyName', label: 'Company name', type: 'text', required: true },
          { key: 'companyAddress', label: 'Company address', type: 'textarea', required: true },
          { key: 'signatoryName', label: 'Signatory name', type: 'text', required: true },
          { key: 'signatoryTitle', label: 'Signatory title', type: 'text', placeholder: 'e.g. Director' }
        ]},
        { title: 'The candidate', fields: [
          { key: 'candidateName', label: 'Candidate name', type: 'text', required: true },
          { key: 'candidateAddress', label: 'Candidate address', type: 'textarea', required: true }
        ]},
        { title: 'The offer', fields: [
          { key: 'jobTitle', label: 'Job title', type: 'text', required: true },
          { key: 'monthlySalary', label: 'Monthly salary (RM)', type: 'number', required: true },
          { key: 'startDate', label: 'Proposed start date', type: 'date', required: true },
          { key: 'probationMonths', label: 'Probation period', type: 'select', options: [['0', 'No probation'], ['3', '3 months'], ['6', '6 months']], value: '3' },
          { key: 'conditions', label: 'Offer conditional on', type: 'select', options: [['none', 'Nothing, unconditional'], ['references', 'Satisfactory references'], ['checks', 'References and background checks']], value: 'references' },
          { key: 'letterDate', label: 'Date of this letter', type: 'date', required: true },
          { key: 'expiryDays', label: 'Offer open for', type: 'select', options: [['3', '3 days'], ['7', '7 days'], ['14', '14 days']], value: '7' }
        ]}
      ],
      render: function (a) {
        var cond = { none: '', references: 'This offer is conditional on the Company receiving references satisfactory to it.',
                     checks: 'This offer is conditional on satisfactory references and completion of background checks.' }[a.conditions || 'none'];
        var probation = Number(a.probationMonths) || 0;
        return '<div class="doc doc--letter">' +
          '<p class="doc__from">' + blank(a.companyName) + '<br>' + blank(a.companyAddress).replace(/\n/g, '<br>') + '</p>' +
          '<p class="doc__dated" style="text-align:left">' + fmtDate(a.letterDate) + '</p>' +
          '<p>' + blank(a.candidateName) + '<br>' + blank(a.candidateAddress).replace(/\n/g, '<br>') + '</p>' +
          '<p><strong>PRIVATE &amp; CONFIDENTIAL</strong></p>' +
          '<h1 class="doc__re">RE: OFFER OF EMPLOYMENT, ' + blank(a.jobTitle).toUpperCase() + '</h1>' +
          '<p>Dear ' + blank(a.candidateName) + ',</p>' +
          '<p>We are pleased to offer you employment with ' + blank(a.companyName) + ' as <strong>' + blank(a.jobTitle) + '</strong>, on the following principal terms:</p>' +
          '<p>1. <strong>Commencement.</strong> Your employment will commence on ' + fmtDate(a.startDate) + '.</p>' +
          '<p>2. <strong>Salary.</strong> Your salary will be ' + rm(a.monthlySalary) + ' per month, subject to statutory contributions and deductions (EPF, SOCSO, EIS, and PCB).</p>' +
          (probation > 0 ? '<p>3. <strong>Probation.</strong> The first ' + probation + ' months are a probationary period.</p>' : '') +
          '<p>' + (probation > 0 ? '4' : '3') + '. <strong>Full terms.</strong> The detailed terms of employment will be set out in an employment contract to be signed on or before your start date. If there is any inconsistency, the employment contract prevails.</p>' +
          (cond ? '<p>' + (probation > 0 ? '5' : '4') + '. <strong>Conditions.</strong> ' + cond + '</p>' : '') +
          '<p>This offer remains open for ' + (Number(a.expiryDays) || 7) + ' days from the date of this letter, after which it lapses automatically. To accept, sign and return the acknowledgement below.</p>' +
          '<p>We look forward to welcoming you to the team.</p>' +
          '<p>Yours sincerely,</p>' +
          '<div class="doc__sig" style="max-width:280px"><div class="doc__sig-line"></div>' +
          '<p><strong>' + blank(a.signatoryName) + '</strong><br>' + blank(a.signatoryTitle, '') + '<br>' + blank(a.companyName) + '</p></div>' +
          '<h2 style="margin-top:36px">Acceptance</h2>' +
          '<p>I, ' + blank(a.candidateName) + ', accept the offer of employment on the terms set out above.</p>' +
          '<div class="doc__sig" style="max-width:280px"><div class="doc__sig-line"></div>' +
          '<p><strong>' + blank(a.candidateName) + '</strong><br>Date: ____________</p></div>' +
          '<p class="doc__notice">Generated with Lawgistics. This template reflects common Malaysian practice but is not legal advice, have it reviewed before signing if the stakes are high.</p>' +
          '</div>';
      }
    },

    /* ==================================================== one-way NDA == */
    'nda-one-way': {
      title: 'Non-Disclosure Agreement (One-Way)',
      description: 'Protects information you disclose to a contractor, employee, or investor.',
      steps: [
        { title: 'The discloser', fields: [
          { key: 'dName', label: 'Your name / company', type: 'text', required: true },
          { key: 'dRegNo', label: 'Registration / NRIC no.', type: 'text' },
          { key: 'dAddress', label: 'Address', type: 'textarea', required: true }
        ]},
        { title: 'The recipient', fields: [
          { key: 'rName', label: 'Recipient name / company', type: 'text', required: true },
          { key: 'rRegNo', label: 'Registration / NRIC no.', type: 'text' },
          { key: 'rAddress', label: 'Address', type: 'textarea', required: true }
        ]},
        { title: 'The disclosure', fields: [
          { key: 'purpose', label: 'Purpose of the disclosure', type: 'textarea', required: true, placeholder: 'e.g. evaluating whether to engage the Recipient to develop our ordering app' },
          { key: 'effectiveDate', label: 'Effective date', type: 'date', required: true },
          { key: 'termYears', label: 'Confidentiality period', type: 'select', options: [['1', '1 year'], ['2', '2 years'], ['3', '3 years'], ['5', '5 years']], value: '3' }
        ]}
      ],
      render: function (a) {
        var years = Number(a.termYears) || 3;
        return agreement({
          title: 'Non-Disclosure Agreement',
          dated: fmtDate(a.effectiveDate),
          parties: [
            '<strong>' + blank(a.dName) + '</strong>' + (a.dRegNo ? ' (No. ' + esc(a.dRegNo) + ')' : '') + ', of ' + blank(a.dAddress) + ' (the “Discloser”); and',
            '<strong>' + blank(a.rName) + '</strong>' + (a.rRegNo ? ' (No. ' + esc(a.rRegNo) + ')' : '') + ', of ' + blank(a.rAddress) + ' (the “Recipient”).'
          ],
          recitals: [
            'The Discloser intends to disclose confidential information to the Recipient for the purpose of: ' + blank(a.purpose) + ' (the “Purpose”).'
          ],
          clauses: [
            { h: 'Confidential Information', body: [
              '“Confidential Information” means any non-public information disclosed by the Discloser to the Recipient in connection with the Purpose, whether written, oral, electronic, or observed, and includes business plans, financials, customer information, pricing, know-how, and technical material.',
              'Confidential Information does not include information that: (a) is or becomes public other than through the Recipient’s breach; (b) the Recipient already lawfully held without restriction; (c) is lawfully received from a third party free of restriction; or (d) the Recipient develops independently without using the Discloser’s information.'
            ]},
            { h: 'Obligations', body: [
              'The Recipient shall keep the Confidential Information confidential, protect it with no less than reasonable care, and use it only for the Purpose.',
              'The Recipient may disclose Confidential Information to its directors, employees, and professional advisers who need it for the Purpose and are bound by obligations of confidence no less strict than this Agreement, and remains responsible for their compliance.',
              'If disclosure is required by law or a regulator, the Recipient may disclose the minimum required, and shall (where lawful) give the Discloser prompt notice.'
            ]},
            { h: 'Term', body: [
              'This Agreement takes effect on ' + fmtDate(a.effectiveDate) + ' and the obligations of confidence continue for ' + years + ' year' + (years === 1 ? '' : 's') + ' from the date of each disclosure, and indefinitely for trade secrets.'
            ]},
            { h: 'Return or destruction', body: [
              'On the Discloser’s written request, the Recipient shall promptly return or destroy all Confidential Information and certify it has done so, save for copies required by law, which remain subject to this Agreement.'
            ]},
            { h: 'No licence; remedies', body: [
              'No licence or other right is granted beyond the limited right to use the Confidential Information for the Purpose.',
              'The Recipient acknowledges that damages may not adequately compensate a breach, and the Discloser may seek injunctive relief in addition to any other remedy.'
            ]},
            { h: 'Governing law', body: [
              'This Agreement is governed by the laws of Malaysia, and the parties submit to the jurisdiction of the Malaysian courts.'
            ]}
          ],
          signatures: [
            { name: blank(a.dName), role: 'The Discloser' },
            { name: blank(a.rName), role: 'The Recipient' }
          ]
        });
      }
    },

    /* ============================================================= MOU == */
    'mou': {
      title: 'Memorandum of Understanding',
      description: 'Records the shape of a deal before the definitive agreements are signed.',
      steps: [
        { title: 'First party', fields: [
          { key: 'p1Name', label: 'Name / company', type: 'text', required: true },
          { key: 'p1Address', label: 'Address', type: 'textarea', required: true }
        ]},
        { title: 'Second party', fields: [
          { key: 'p2Name', label: 'Name / company', type: 'text', required: true },
          { key: 'p2Address', label: 'Address', type: 'textarea', required: true }
        ]},
        { title: 'The collaboration', fields: [
          { key: 'purpose', label: 'What are you exploring together?', type: 'textarea', required: true, placeholder: 'e.g. a joint distribution arrangement for the Klang Valley' },
          { key: 'keyTerms', label: 'Key commercial terms agreed so far', type: 'textarea', required: true, placeholder: 'One per line, revenue split, territories, who does what…' },
          { key: 'effectiveDate', label: 'Effective date', type: 'date', required: true },
          { key: 'termMonths', label: 'MOU expires after', type: 'select', options: [['6', '6 months'], ['12', '12 months'], ['24', '24 months']], value: '12' },
          { key: 'exclusive', label: 'Exclusive negotiations?', type: 'select', options: [['no', 'No, either side may talk to others'], ['yes', 'Yes, exclusive while this MOU runs']], value: 'no' }
        ]}
      ],
      render: function (a) {
        var months = Number(a.termMonths) || 12;
        var clauses = [
          { h: 'Purpose', body: [
            'The parties wish to explore: ' + blank(a.purpose) + ' (the “Proposed Collaboration”), and record in this MOU their current understanding.'
          ]},
          { h: 'Key terms', body: String(a.keyTerms || '').split('\n').filter(function (l) { return l.trim(); })
              .map(function (l) { return esc(l.trim()); })
              .concat(['The detailed terms will be set out in definitive agreements to be negotiated in good faith.']) },
          { h: 'Status of this MOU', body: [
            'This MOU records intentions only and is not legally binding, except for this clause and the clauses headed Confidentiality' + (a.exclusive === 'yes' ? ', Exclusivity' : '') + ', Costs, and Governing law, which are binding.',
            'Neither party is obliged to enter into any definitive agreement.'
          ]},
          { h: 'Confidentiality', body: [
            'Each party shall keep the existence and contents of the discussions, and any information exchanged, confidential and use them only to evaluate and progress the Proposed Collaboration. This obligation survives the end of this MOU for three (3) years.'
          ]},
          a.exclusive === 'yes' ? { h: 'Exclusivity', body: [
            'While this MOU is in force, neither party shall solicit or negotiate a substantially similar collaboration with any third party.'
          ] } : null,
          { h: 'Term', body: [
            'This MOU takes effect on ' + fmtDate(a.effectiveDate) + ' and ends ' + months + ' months later, or earlier on signature of definitive agreements or on fourteen (14) days’ written notice by either party.'
          ]},
          { h: 'Costs', body: [
            'Each party bears its own costs of the discussions and of preparing this MOU and any definitive agreements.'
          ]},
          { h: 'Governing law', body: [
            'This MOU is governed by the laws of Malaysia.'
          ]}
        ].filter(Boolean);
        return agreement({
          title: 'Memorandum of Understanding',
          dated: fmtDate(a.effectiveDate),
          parties: [
            '<strong>' + blank(a.p1Name) + '</strong>, of ' + blank(a.p1Address) + '; and',
            '<strong>' + blank(a.p2Name) + '</strong>, of ' + blank(a.p2Address) + '.'
          ],
          clauses: clauses,
          signatures: [
            { name: blank(a.p1Name), role: 'First party' },
            { name: blank(a.p2Name), role: 'Second party' }
          ]
        });
      }
    },

    /* ========================================== shareholders' agreement == */
    'shareholders-agreement': {
      title: 'Shareholders’ Agreement',
      description: 'What happens when the founders disagree, decided while everyone still agrees.',
      steps: [
        { title: 'The company', fields: [
          { key: 'companyName', label: 'Company name', type: 'text', required: true },
          { key: 'companyRegNo', label: 'Registration no. (SSM)', type: 'text' },
          { key: 'companyAddress', label: 'Registered address', type: 'textarea', required: true }
        ]},
        { title: 'Shareholders', fields: [
          { key: 's1Name', label: 'First shareholder', type: 'text', required: true },
          { key: 's1Pct', label: 'First shareholder %', type: 'number', required: true, half: false },
          { key: 's2Name', label: 'Second shareholder', type: 'text', required: true },
          { key: 's2Pct', label: 'Second shareholder %', type: 'number', required: true }
        ]},
        { title: 'Governance', fields: [
          { key: 'boardSeats', label: 'Board composition', type: 'select', options: [['each', 'Each shareholder appoints one director'], ['prop', 'Directors in proportion to shareholding']], value: 'each' },
          { key: 'reservedThreshold', label: 'Reserved matters need', type: 'select', options: [['75', '75% shareholder approval'], ['100', 'Unanimous approval']], value: '75' },
          { key: 'dragPct', label: 'Drag-along threshold', type: 'select', options: [['75', '75%'], ['90', '90%']], value: '75', help: 'Holders above this level can require the rest to join a sale of the whole company.' },
          { key: 'deadlock', label: 'Deadlock resolution', type: 'select', options: [['buyout', 'Mediation, then buy-out offer mechanism'], ['windup', 'Mediation, then voluntary winding up']], value: 'buyout' },
          { key: 'effectiveDate', label: 'Effective date', type: 'date', required: true }
        ]}
      ],
      render: function (a) {
        var th = a.reservedThreshold === '100' ? 'the unanimous approval of the shareholders' : 'the approval of shareholders holding at least seventy-five per cent (75%) of the shares';
        return agreement({
          title: 'Shareholders’ Agreement',
          dated: fmtDate(a.effectiveDate),
          parties: [
            '<strong>' + blank(a.s1Name) + '</strong> (holding ' + blank(a.s1Pct, '__') + '% of the shares); and',
            '<strong>' + blank(a.s2Name) + '</strong> (holding ' + blank(a.s2Pct, '__') + '% of the shares),',
            'together the shareholders of <strong>' + blank(a.companyName) + '</strong>' + (a.companyRegNo ? ' (Company No. ' + esc(a.companyRegNo) + ')' : '') + ', of ' + blank(a.companyAddress) + ' (the “Company”).'
          ],
          recitals: [
            'The shareholders wish to regulate their relationship as members of the Company and the conduct of its affairs, supplementing the Companies Act 2016 and the Company’s constitution (if any).'
          ],
          clauses: [
            { h: 'Board and management', body: [
              a.boardSeats === 'prop'
                ? 'Directors shall be appointed in proportion to shareholding, with each shareholder entitled to appoint and remove its proportionate number of directors by written notice.'
                : 'Each shareholder is entitled to appoint one (1) director, and to remove and replace that director by written notice to the Company.',
              'The business of the Company shall be managed by the board, subject to the reserved matters below. Board meetings require at least seven (7) days’ notice and a quorum including one director appointed by each shareholder.'
            ]},
            { h: 'Reserved matters', body: [
              'None of the following may occur without ' + th + ': (a) amending the constitution; (b) issuing or reorganising shares; (c) borrowing above RM100,000 in aggregate; (d) selling or encumbering the whole or a substantial part of the business or assets; (e) entering any transaction with a shareholder or a person connected to a shareholder; (f) declaring dividends otherwise than under this Agreement; (g) appointing or removing the auditor; and (h) winding up the Company voluntarily.'
            ]},
            { h: 'Transfers and pre-emption', body: [
              'No shareholder may transfer shares except under this Agreement. A shareholder wishing to sell shall first offer them to the other shareholders in proportion to their holdings, at the price offered by a bona fide third-party purchaser or as agreed, and the offer shall remain open for thirty (30) days.',
              'Any transfer requires the transferee to sign a deed of adherence to this Agreement.'
            ]},
            { h: 'Drag-along and tag-along', body: [
              'If shareholders holding at least ' + (a.dragPct === '90' ? 'ninety per cent (90%)' : 'seventy-five per cent (75%)') + ' of the shares accept a bona fide offer for the entire issued share capital, they may require the remaining shareholders to sell on the same terms.',
              'If a shareholder sells shares carrying more than fifty per cent (50%) of the total shares, the remaining shareholders may require the purchaser to buy their shares on the same terms.'
            ]},
            { h: 'Dividends', body: [
              'Subject to the solvency requirements of the Companies Act 2016 and the reasonable working-capital needs of the business, the board shall consider a distribution of available profits after each financial year.'
            ]},
            { h: 'Deadlock', body: [
              'A deadlock arises where a reserved matter or board resolution fails on two consecutive occasions over at least thirty (30) days. The shareholders shall first refer the deadlock to mediation.',
              a.deadlock === 'windup'
                ? 'If mediation fails within sixty (60) days, the shareholders shall procure the voluntary winding up of the Company and distribution of its assets.'
                : 'If mediation fails within sixty (60) days, either shareholder may serve a notice offering to buy the other’s shares at a stated price; the recipient must, within thirty (30) days, either accept the offer or buy the offeror’s shares at the same price per share.'
            ]},
            { h: 'Confidentiality and protection of the business', body: [
              'Each shareholder shall keep the Company’s affairs confidential, and while a shareholder and for twelve (12) months after ceasing to be one shall not solicit the Company’s customers, suppliers, or employees.'
            ]},
            { h: 'Relationship with the constitution', body: [
              'As between the shareholders, this Agreement prevails over the constitution, and the shareholders shall exercise their votes to give effect to it, including by amending the constitution where necessary.'
            ]},
            { h: 'Term', body: [
              'This Agreement continues until the shareholders agree in writing to end it, the Company is wound up, or one shareholder comes to hold all the shares.'
            ]},
            { h: 'Governing law', body: [
              'This Agreement is governed by the laws of Malaysia, and the parties submit to the jurisdiction of the Malaysian courts.'
            ]}
          ],
          signatures: [
            { name: blank(a.s1Name), role: 'Shareholder' },
            { name: blank(a.s2Name), role: 'Shareholder' }
          ]
        });
      }
    },

    /* ================================================ board resolution == */
    'board-resolution': {
      title: 'Board Resolution',
      description: 'A directors’ circular resolution, signed, no meeting required.',
      steps: [
        { title: 'The company', fields: [
          { key: 'companyName', label: 'Company name', type: 'text', required: true },
          { key: 'companyRegNo', label: 'Registration no. (SSM)', type: 'text', required: true }
        ]},
        { title: 'The resolution', fields: [
          { key: 'resolutionType', label: 'Resolution type', type: 'select', options: [
            ['bank', 'Open a bank account'],
            ['director', 'Appoint a director'],
            ['agreement', 'Approve entry into an agreement'],
            ['custom', 'Custom resolution']], value: 'bank' },
          { key: 'details', label: 'Details', type: 'textarea', required: true, placeholder: 'Bank: name the bank and authorised signatories. Director: name and NRIC. Agreement: describe the agreement and counterparty. Custom: full text of the resolution.' },
          { key: 'resolutionDate', label: 'Date of resolution', type: 'date', required: true },
          { key: 'director1', label: 'Director 1 (name)', type: 'text', required: true },
          { key: 'director2', label: 'Director 2 (name)', type: 'text', help: 'Leave blank for a sole-director company.' }
        ]}
      ],
      render: function (a) {
        var intro = {
          bank: 'a bank account be opened in the name of the Company, on the terms set out below, and that the bank be furnished with certified copies of this resolution:',
          director: 'the person named below be and is hereby appointed a director of the Company with effect from the date of this resolution:',
          agreement: 'the Company be and is hereby authorised to enter into the agreement described below, and that any director be authorised to sign it and all documents ancillary to it for and on behalf of the Company:',
          custom: 'the following be and is hereby resolved:'
        }[a.resolutionType || 'custom'];
        var sigs = '';
        [a.director1, a.director2].forEach(function (d) {
          if (!String(d || '').trim()) return;
          sigs += '<div class="doc__sig"><div class="doc__sig-line"></div><p><strong>' + esc(d) + '</strong><br>Director<br>Date: ____________</p></div>';
        });
        return '<div class="doc">' +
          '<h1 class="doc__title">Directors’ Circular Resolution</h1>' +
          '<p class="doc__dated">' + blank(a.companyName) + (a.companyRegNo ? ' (Company No. ' + esc(a.companyRegNo) + ')' : '') + '</p>' +
          '<p>Circular resolution in writing of the directors of the Company, passed pursuant to the Companies Act 2016 and the Company’s constitution (if any) on ' + fmtDate(a.resolutionDate) + '.</p>' +
          '<h2>IT WAS RESOLVED THAT:</h2>' +
          '<p>' + esc(intro) + '</p>' +
          paras(a.details) +
          '<p>This resolution may be signed in any number of counterparts, each of which is an original, and takes effect when signed by all the directors.</p>' +
          '<div class="doc__sig-grid">' + (sigs || '<div class="doc__sig"><div class="doc__sig-line"></div><p><strong>____________</strong><br>Director</p></div>') + '</div>' +
          '<p class="doc__notice">Generated with Lawgistics. This template reflects common Malaysian practice but is not legal advice, have it reviewed before signing if the stakes are high.</p>' +
          '</div>';
      }
    },

    /* =============================================== tenancy agreement == */
    'tenancy-agreement': {
      title: 'Tenancy Agreement',
      description: 'Residential or commercial tenancy with deposits and repairs set out clearly.',
      steps: [
        { title: 'The landlord', fields: [
          { key: 'landlordName', label: 'Landlord name', type: 'text', required: true },
          { key: 'landlordId', label: 'NRIC / registration no.', type: 'text' },
          { key: 'landlordAddress', label: 'Address', type: 'textarea', required: true }
        ]},
        { title: 'The tenant', fields: [
          { key: 'tenantName', label: 'Tenant name', type: 'text', required: true },
          { key: 'tenantId', label: 'NRIC / registration no.', type: 'text' },
          { key: 'tenantAddress', label: 'Address', type: 'textarea', required: true }
        ]},
        { title: 'The premises', fields: [
          { key: 'propertyAddress', label: 'Property address', type: 'textarea', required: true },
          { key: 'use', label: 'Permitted use', type: 'select', options: [['residential', 'Residential'], ['commercial', 'Commercial']], value: 'residential' }
        ]},
        { title: 'The terms', fields: [
          { key: 'termMonths', label: 'Term', type: 'select', options: [['12', '12 months'], ['24', '24 months'], ['36', '36 months']], value: '12' },
          { key: 'monthlyRent', label: 'Monthly rent (RM)', type: 'number', required: true },
          { key: 'startDate', label: 'Commencement date', type: 'date', required: true },
          { key: 'securityMonths', label: 'Security deposit', type: 'select', options: [['2', '2 months’ rent'], ['3', '3 months’ rent']], value: '2' },
          { key: 'utilityDeposit', label: 'Utilities deposit', type: 'select', options: [['0.5', 'Half a month’s rent'], ['1', 'One month’s rent']], value: '0.5' },
          { key: 'renewal', label: 'Option to renew?', type: 'select', options: [['yes', 'Yes, one further term at market rent'], ['no', 'No']], value: 'yes' }
        ]}
      ],
      render: function (a) {
        var months = Number(a.termMonths) || 12;
        var rent = Number(a.monthlyRent) || 0;
        var sec = (Number(a.securityMonths) || 2) * rent;
        var util = (Number(a.utilityDeposit) || 0.5) * rent;
        var clauses = [
          { h: 'Letting', body: [
            'The Landlord lets and the Tenant takes the premises at ' + blank(a.propertyAddress) + ' (the “Premises”) for ' + (a.use === 'commercial' ? 'commercial' : 'residential') + ' use only.'
          ]},
          { h: 'Term', body: [
            'The tenancy is for a fixed term of ' + months + ' months commencing on ' + fmtDate(a.startDate) + '.'
          ]},
          { h: 'Rent', body: [
            'The rent is ' + rm(a.monthlyRent) + ' per month, payable in advance by the seventh (7th) day of each calendar month.',
            'Rent unpaid for fourteen (14) days after its due date bears interest at 8% per year until paid, without prejudice to the Landlord’s other rights.'
          ]},
          { h: 'Deposits', body: [
            'On signing, the Tenant shall pay a security deposit of ' + rm(sec) + ' and a utilities deposit of ' + rm(util) + '.',
            'The deposits are not rent. The Landlord shall refund them within thirty (30) days after the tenancy ends, less any sums properly deducted for unpaid rent, unpaid utilities, or damage beyond fair wear and tear.'
          ]},
          { h: 'Tenant’s obligations', body: [
            'The Tenant shall pay all utilities and service charges for the Premises, keep the interior in good and tenantable repair (fair wear and tear excepted), and promptly report defects to the Landlord.',
            'The Tenant shall not make structural alterations, sublet, or part with possession of the Premises without the Landlord’s prior written consent, and shall not use the Premises for any unlawful purpose.'
          ]},
          { h: 'Landlord’s obligations', body: [
            'The Landlord shall keep the structure, roof, and external walls in good repair, pay the quit rent and assessment, and allow the Tenant quiet enjoyment of the Premises while the Tenant performs this Agreement.'
          ]},
          { h: 'Default and termination', body: [
            'If the rent is unpaid for twenty-one (21) days after its due date, or the Tenant materially breaches this Agreement and fails to remedy the breach within fourteen (14) days of written notice, the Landlord may re-enter the Premises and this tenancy ends, without prejudice to accrued rights.',
            'If the Premises are destroyed or made unfit for use other than by the Tenant’s fault, either party may end the tenancy by written notice and the deposits (less proper deductions) and prepaid rent shall be refunded.'
          ]},
          a.renewal === 'yes' ? { h: 'Option to renew', body: [
            'If the Tenant has performed this Agreement, the Tenant may, by not less than two (2) months’ written notice before the term ends, renew the tenancy for one further term of ' + months + ' months at the prevailing market rent, on the same terms except this option.'
          ] } : null,
          { h: 'Stamping', body: [
            'This Agreement shall be stamped in accordance with the Stamp Act 1949. The stamp duty and one copy are customarily borne by the Tenant, unless the parties agree otherwise.'
          ]},
          { h: 'Governing law', body: [
            'This Agreement is governed by the laws of Malaysia.'
          ]}
        ].filter(Boolean);
        return agreement({
          title: 'Tenancy Agreement',
          dated: fmtDate(a.startDate),
          parties: [
            '<strong>' + blank(a.landlordName) + '</strong>' + (a.landlordId ? ' (No. ' + esc(a.landlordId) + ')' : '') + ', of ' + blank(a.landlordAddress) + ' (the “Landlord”); and',
            '<strong>' + blank(a.tenantName) + '</strong>' + (a.tenantId ? ' (No. ' + esc(a.tenantId) + ')' : '') + ', of ' + blank(a.tenantAddress) + ' (the “Tenant”).'
          ],
          clauses: clauses,
          signatures: [
            { name: blank(a.landlordName), role: 'The Landlord' },
            { name: blank(a.tenantName), role: 'The Tenant' }
          ]
        });
      }
    },

    /* ============================================ settlement agreement == */
    'settlement-agreement': {
      title: 'Settlement Agreement',
      description: 'Full and final settlement, the dispute ends when the money moves.',
      steps: [
        { title: 'First party', fields: [
          { key: 'p1Name', label: 'Name / company (receiving payment)', type: 'text', required: true },
          { key: 'p1Address', label: 'Address', type: 'textarea', required: true }
        ]},
        { title: 'Second party', fields: [
          { key: 'p2Name', label: 'Name / company (paying)', type: 'text', required: true },
          { key: 'p2Address', label: 'Address', type: 'textarea', required: true }
        ]},
        { title: 'The settlement', fields: [
          { key: 'dispute', label: 'What is the dispute about?', type: 'textarea', required: true, placeholder: 'e.g. unpaid invoices INV-1041 and INV-1052 for goods delivered in May 2026' },
          { key: 'sum', label: 'Settlement sum (RM)', type: 'number', required: true },
          { key: 'structure', label: 'Payment structure', type: 'select', options: [['lump', 'One lump sum'], ['2', 'Two equal monthly instalments'], ['3', 'Three equal monthly instalments']], value: 'lump' },
          { key: 'firstPayment', label: 'First payment due', type: 'date', required: true },
          { key: 'confidential', label: 'Keep the settlement confidential?', type: 'select', options: [['yes', 'Yes'], ['no', 'No']], value: 'yes' },
          { key: 'effectiveDate', label: 'Date of agreement', type: 'date', required: true }
        ]}
      ],
      render: function (a) {
        var n = a.structure === '2' ? 2 : a.structure === '3' ? 3 : 1;
        var sum = Number(a.sum) || 0;
        var pay = n === 1
          ? 'The Payer shall pay the Recipient the settlement sum of ' + rm(a.sum) + ' in one payment on or before ' + fmtDate(a.firstPayment) + '.'
          : 'The Payer shall pay the Recipient the settlement sum of ' + rm(a.sum) + ' in ' + n + ' equal monthly instalments of ' + rm(sum / n) + ', the first on or before ' + fmtDate(a.firstPayment) + ' and each subsequent instalment on the same day of each following month.';
        var clauses = [
          { h: 'Settlement payment', body: [ pay,
            'Payment shall be made to the account nominated in writing by the Recipient, and time is of the essence.'
          ]},
          { h: 'Full and final settlement', body: [
            'On receipt of the settlement sum in full, the parties release each other from all claims, demands, and liabilities arising out of or connected with the Dispute, whether known or unknown at the date of this Agreement.',
            'This Agreement may be pleaded as a complete bar to any proceedings concerning the Dispute.'
          ]},
          { h: 'No admission', body: [
            'This Agreement is entered into to compromise a disputed claim and is not an admission of liability by either party.'
          ]},
          { h: 'Default', body: [
            'If any payment is not made within seven (7) days of its due date, the entire unpaid balance becomes immediately due, and the release above does not take effect until it is paid in full.'
          ]},
          a.confidential === 'yes' ? { h: 'Confidentiality', body: [
            'The parties shall keep the terms of this Agreement confidential, save for disclosures to professional advisers, as required by law, or to enforce this Agreement.'
          ] } : null,
          { h: 'Costs', body: [
            'Each party bears its own legal costs in connection with the Dispute and this Agreement.'
          ]},
          { h: 'Governing law', body: [
            'This Agreement is governed by the laws of Malaysia, and the parties submit to the jurisdiction of the Malaysian courts.'
          ]}
        ].filter(Boolean);
        return agreement({
          title: 'Settlement Agreement',
          dated: fmtDate(a.effectiveDate),
          parties: [
            '<strong>' + blank(a.p1Name) + '</strong>, of ' + blank(a.p1Address) + ' (the “Recipient”); and',
            '<strong>' + blank(a.p2Name) + '</strong>, of ' + blank(a.p2Address) + ' (the “Payer”).'
          ],
          recitals: [
            'A dispute has arisen between the parties concerning: ' + blank(a.dispute) + ' (the “Dispute”). The parties have agreed to settle the Dispute on the terms of this Agreement.'
          ],
          clauses: clauses,
          signatures: [
            { name: blank(a.p1Name), role: 'The Recipient' },
            { name: blank(a.p2Name), role: 'The Payer' }
          ]
        });
      }
    },

    /* ================================================= website terms == */
    'website-terms': {
      title: 'Website Terms & Conditions',
      description: 'Terms of use for a Malaysian business website, no signature needed.',
      steps: [
        { title: 'The business', fields: [
          { key: 'companyName', label: 'Business name', type: 'text', required: true },
          { key: 'regNo', label: 'Registration no.', type: 'text' },
          { key: 'websiteUrl', label: 'Website address', type: 'text', required: true, placeholder: 'https://…' },
          { key: 'contactEmail', label: 'Contact email', type: 'text', required: true }
        ]},
        { title: 'The site', fields: [
          { key: 'offering', label: 'What does the site do?', type: 'select', options: [
            ['info', 'Information / marketing only'],
            ['services', 'Sells services'],
            ['goods', 'Sells physical goods']], value: 'services' },
          { key: 'refundDays', label: 'Refund window (goods/services)', type: 'select', options: [['none', 'No returns unless faulty'], ['7', '7 days'], ['14', '14 days']], value: '7' },
          { key: 'effectiveDate', label: 'Effective date', type: 'date', required: true }
        ]}
      ],
      render: function (a) {
        var sells = a.offering === 'goods' || a.offering === 'services';
        var refund = a.refundDays === 'none'
          ? 'We do not accept returns or cancellations except where the goods or services are faulty or not as described, in which case your statutory rights under the Consumer Protection Act 1999 apply.'
          : 'You may cancel and request a refund within ' + esc(a.refundDays) + ' days of purchase, provided any goods are returned unused and in their original condition. Your statutory rights under the Consumer Protection Act 1999 are unaffected.';
        var s = 0;
        function h(t) { s++; return '<h2>' + s + '. ' + esc(t) + '</h2>'; }
        return '<div class="doc">' +
          '<h1 class="doc__title">Website Terms &amp; Conditions</h1>' +
          '<p class="doc__dated">' + blank(a.websiteUrl) + ', effective ' + fmtDate(a.effectiveDate) + '</p>' +
          h('Who we are') +
          '<p>This website is operated by ' + blank(a.companyName) + (a.regNo ? ' (Registration No. ' + esc(a.regNo) + ')' : '') + ' (“we”, “us”). You can contact us at ' + blank(a.contactEmail) + '.</p>' +
          h('Acceptance of these terms') +
          '<p>By using this site you agree to these terms. If you do not agree, do not use the site. We may update these terms from time to time; the version published on the site applies.</p>' +
          h('Use of the site') +
          '<p>You agree not to misuse the site, including by attempting unauthorised access, scraping at scale, introducing malicious code, or using the site for unlawful purposes. We may suspend access for misuse.</p>' +
          (sells ? h('Orders and payment') +
            '<p>All orders are offers to purchase which we may accept or decline. Prices are in Ringgit Malaysia and, where applicable, inclusive of service tax. A contract forms when we confirm your order. Obvious pricing errors do not bind us.</p>' +
            h('Cancellations and refunds') + '<p>' + refund + '</p>' : '') +
          h('Intellectual property') +
          '<p>The content of this site, text, graphics, logos, and design, belongs to us or our licensors. You may view and print content for your own use, but may not reproduce or exploit it commercially without our written consent.</p>' +
          h('Third-party links') +
          '<p>Links to third-party sites are provided for convenience. We do not control and are not responsible for their content or practices.</p>' +
          h('Disclaimer and limitation of liability') +
          '<p>The site and its content are provided on an “as is” basis. To the fullest extent permitted by law, we exclude liability for indirect or consequential loss, and our total liability in connection with the site' + (sells ? ' or any purchase' : '') + ' is limited to the amounts you paid us in the twelve (12) months before the claim arose. Nothing limits liability that cannot lawfully be limited.</p>' +
          h('Personal data') +
          '<p>We process personal data in accordance with our Privacy Notice, issued under the Personal Data Protection Act 2010, available on this site.</p>' +
          h('Governing law') +
          '<p>These terms are governed by the laws of Malaysia, and the Malaysian courts have exclusive jurisdiction.</p>' +
          '<p class="doc__notice">Generated with Lawgistics. This template reflects common Malaysian practice but is not legal advice, have it reviewed before publishing if the stakes are high.</p>' +
          '</div>';
      }
    },

    /* ============================================ PDPA privacy notice == */
    'pdpa-privacy-notice': {
      title: 'PDPA Privacy Notice',
      description: 'The privacy notice the Personal Data Protection Act 2010 requires.',
      steps: [
        { title: 'The business', fields: [
          { key: 'companyName', label: 'Business name', type: 'text', required: true },
          { key: 'regNo', label: 'Registration no.', type: 'text' },
          { key: 'contactEmail', label: 'Privacy contact email', type: 'text', required: true },
          { key: 'contactAddress', label: 'Business address', type: 'textarea', required: true }
        ]},
        { title: 'The data', fields: [
          { key: 'dataTypes', label: 'Personal data you collect', type: 'textarea', required: true, value: 'Name and contact details\nBilling and payment information\nOrder and transaction history\nTechnical data such as IP address and browser type' },
          { key: 'purposes', label: 'What you use it for', type: 'textarea', required: true, value: 'Processing orders and delivering our products and services\nBilling, receipts, and account management\nResponding to enquiries and providing support\nSending service updates and, with consent, marketing\nComplying with legal and regulatory obligations' },
          { key: 'thirdParties', label: 'Who you share it with', type: 'textarea', required: true, value: 'Payment processors\nDelivery and logistics providers\nIT and hosting service providers acting on our instructions' },
          { key: 'effectiveDate', label: 'Effective date', type: 'date', required: true }
        ]}
      ],
      render: function (a) {
        function list(v) {
          var items = String(v || '').split('\n').filter(function (l) { return l.trim(); });
          return '<ul>' + items.map(function (l) { return '<li>' + esc(l.trim()) + '</li>'; }).join('') + '</ul>';
        }
        var s = 0;
        function h(t) { s++; return '<h2>' + s + '. ' + esc(t) + '</h2>'; }
        return '<div class="doc">' +
          '<h1 class="doc__title">Privacy Notice</h1>' +
          '<p class="doc__dated">' + blank(a.companyName) + ', effective ' + fmtDate(a.effectiveDate) + '</p>' +
          '<p>This notice is issued by ' + blank(a.companyName) + (a.regNo ? ' (Registration No. ' + esc(a.regNo) + ')' : '') + ' of ' + blank(a.contactAddress) + ' under the Personal Data Protection Act 2010 (“PDPA”), and explains how we handle personal data in commercial transactions.</p>' +
          h('Personal data we collect') + list(a.dataTypes) +
          h('How we use it') + list(a.purposes) +
          h('Who we disclose it to') + list(a.thirdParties) +
          '<p>We do not sell personal data. Disclosure otherwise occurs only where required by law.</p>' +
          h('Retention and security') +
          '<p>We keep personal data only as long as needed for the purposes above or as required by law, and protect it with practical security measures appropriate to its sensitivity.</p>' +
          h('Your rights') +
          '<p>Under the PDPA you may request access to and correction of your personal data, limit its processing, and withdraw consent to direct marketing at any time, by writing to ' + blank(a.contactEmail) + '. We may charge a modest fee for access requests as permitted by the PDPA.</p>' +
          h('Contact') +
          '<p>Questions about this notice go to ' + blank(a.contactEmail) + '.</p>' +
          '<h2>Notis Privasi (Ringkasan Bahasa Malaysia)</h2>' +
          '<p>Notis ini dikeluarkan oleh ' + blank(a.companyName) + ' di bawah Akta Perlindungan Data Peribadi 2010. Kami mengumpul data peribadi anda (seperti nama, butiran hubungan, dan maklumat pembayaran) untuk memproses transaksi, memberikan perkhidmatan, dan mematuhi undang-undang. Anda berhak mengakses dan membetulkan data peribadi anda, dan menarik balik persetujuan untuk pemasaran langsung, dengan menghubungi ' + blank(a.contactEmail) + '. Versi penuh dalam Bahasa Malaysia boleh didapati atas permintaan.</p>' +
          '<p class="doc__notice">Generated with Lawgistics. Section 7 PDPA requires this notice in both English and Bahasa Malaysia, a summary in BM is included; obtain a full BM version before relying on it. Not legal advice.</p>' +
          '</div>';
      }
    },

    /* ========================================== contractor agreement == */
    'contractor-agreement': {
      title: 'Freelancer / Contractor Agreement',
      description: 'Engages an independent contractor without creating an employment relationship.',
      steps: [
        { title: 'The client', fields: [
          { key: 'clientName', label: 'Client name / company', type: 'text', required: true },
          { key: 'clientRegNo', label: 'Registration no.', type: 'text' },
          { key: 'clientAddress', label: 'Address', type: 'textarea', required: true }
        ]},
        { title: 'The contractor', fields: [
          { key: 'contractorName', label: 'Contractor name / company', type: 'text', required: true },
          { key: 'contractorId', label: 'NRIC / registration no.', type: 'text' },
          { key: 'contractorAddress', label: 'Address', type: 'textarea', required: true }
        ]},
        { title: 'The engagement', fields: [
          { key: 'services', label: 'Services / deliverables', type: 'textarea', required: true, placeholder: 'Describe deliverables, not hours, e.g. “design and deliver brand identity: logo, palette, and brand guide”.' },
          { key: 'startDate', label: 'Start date', type: 'date', required: true },
          { key: 'feeBasis', label: 'Fee structure', type: 'select', options: [['fixed', 'Fixed fee'], ['monthly', 'Monthly'], ['hourly', 'Hourly rate']], value: 'fixed' },
          { key: 'feeAmount', label: 'Amount (RM)', type: 'number', required: true },
          { key: 'invoiceDays', label: 'Invoices payable within', type: 'select', options: [['7', '7 days'], ['14', '14 days'], ['30', '30 days']], value: '14' },
          { key: 'noticeDays', label: 'Termination notice', type: 'select', options: [['14', '14 days'], ['30', '30 days']], value: '14' }
        ]}
      ],
      render: function (a) {
        var basis = { fixed: 'a fixed fee of ' + rm(a.feeAmount),
                      monthly: 'a monthly fee of ' + rm(a.feeAmount),
                      hourly: 'an hourly rate of ' + rm(a.feeAmount) }[a.feeBasis || 'fixed'];
        return agreement({
          title: 'Independent Contractor Agreement',
          dated: fmtDate(a.startDate),
          parties: [
            '<strong>' + blank(a.clientName) + '</strong>' + (a.clientRegNo ? ' (No. ' + esc(a.clientRegNo) + ')' : '') + ', of ' + blank(a.clientAddress) + ' (the “Client”); and',
            '<strong>' + blank(a.contractorName) + '</strong>' + (a.contractorId ? ' (No. ' + esc(a.contractorId) + ')' : '') + ', of ' + blank(a.contractorAddress) + ' (the “Contractor”).'
          ],
          clauses: [
            { h: 'Engagement', body: [
              'The Client engages the Contractor as an independent contractor to provide, commencing on ' + fmtDate(a.startDate) + ': ' + blank(a.services) + ' (the “Services”).'
            ]},
            { h: 'Fees and invoicing', body: [
              'The Client shall pay the Contractor ' + basis + '. Invoices are payable within ' + (Number(a.invoiceDays) || 14) + ' days of the invoice date.',
              'The fees are inclusive of all of the Contractor’s costs unless agreed otherwise in writing.'
            ]},
            { h: 'Relationship of the parties', body: [
              'The Contractor is an independent contractor, and nothing in this Agreement creates an employment, agency, or partnership relationship. The Contractor has no authority to bind the Client.',
              'The Contractor is solely responsible for its own income tax and, where applicable, its own EPF and SOCSO arrangements, and shall indemnify the Client against any claim that statutory employer contributions were payable in respect of the Contractor.'
            ]},
            { h: 'Manner of performance', body: [
              'The Contractor controls the manner, method, and hours of performing the Services, provided the Services meet the agreed specifications and deadlines, and shall use its own equipment unless agreed otherwise.',
              'The Contractor may not subcontract or delegate the Services without the Client’s prior written consent.'
            ]},
            { h: 'Intellectual property', body: [
              'On receipt of full payment, the Contractor assigns to the Client all intellectual property rights in the deliverables created specifically for the Client under this Agreement.',
              'The Contractor retains its pre-existing materials and general know-how, and grants the Client a licence to use any pre-existing materials embedded in the deliverables.'
            ]},
            { h: 'Confidentiality', body: [
              'The Contractor shall keep the Client’s non-public information confidential, use it only to perform the Services, and return or destroy it when the engagement ends. This obligation survives termination.'
            ]},
            { h: 'Termination', body: [
              'Either party may terminate this Agreement on ' + (Number(a.noticeDays) || 14) + ' days’ written notice, or immediately for material breach not remedied within seven (7) days of written notice.',
              'On termination the Client shall pay for Services properly performed to the date of termination.'
            ]},
            { h: 'Liability', body: [
              'Neither party is liable for indirect or consequential loss. Each party’s total liability under this Agreement is capped at the total fees paid or payable in the twelve (12) months before the claim arose.'
            ]},
            { h: 'Governing law', body: [
              'This Agreement is governed by the laws of Malaysia, and the parties submit to the jurisdiction of the Malaysian courts.'
            ]}
          ],
          signatures: [
            { name: blank(a.clientName), role: 'The Client' },
            { name: blank(a.contractorName), role: 'The Contractor' }
          ]
        });
      }
    }
  };

  global.LG_DOC_HELPERS = { fmtDate: fmtDate, rm: rm };

})(window);
