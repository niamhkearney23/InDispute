/**
 * A stand-in for Supabase, good enough to drive the real app for visual QA.
 *
 * Speaks the slice of GoTrue and PostgREST that the app actually uses, and
 * serves fixtures rather than running SQL. This is for rendering pages at
 * device viewports -- it deliberately does NOT validate query correctness.
 */
import http from 'node:http';

const PORT = 54321;

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const USER_ID = '11111111-1111-1111-1111-111111111111';
const USER = {
  id: USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@lawgistics.test',
  app_metadata: { provider: 'email' },
  user_metadata: { display_name: 'Niamh' },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const EXP = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
const ACCESS_TOKEN = [
  b64url({ alg: 'HS256', typ: 'JWT' }),
  b64url({ sub: USER_ID, role: 'authenticated', aud: 'authenticated', exp: EXP, email: USER.email }),
  'signature-not-verified-by-this-mock',
].join('.');

const SESSION = {
  access_token: ACCESS_TOKEN,
  token_type: 'bearer',
  expires_in: 86400,
  expires_at: EXP,
  refresh_token: 'mock-refresh-token',
  user: USER,
};

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

const domains = [
  { id: 'd1', slug: 'court-system', name: 'Court System', sort_order: 0 },
  { id: 'd2', slug: 'civil-procedure', name: 'Civil Procedure', sort_order: 1 },
  { id: 'd3', slug: 'evidence', name: 'Evidence', sort_order: 2 },
  { id: 'd4', slug: 'advocacy', name: 'Advocacy', sort_order: 3 },
  { id: 'd5', slug: 'drafting', name: 'Drafting', sort_order: 4 },
  { id: 'd6', slug: 'legal-reasoning', name: 'Legal Reasoning', sort_order: 5 },
];

const conceptMastery = [
  ['Court hierarchy', 'd1', 88, 9],
  ['Appellate structure', 'd1', 74, 6],
  ['Subpoenas', 'd2', 41, 7],
  ['Discovery', 'd2', 38, 5],
  ['Interlocutory applications', 'd2', 52, 4],
  ['Hearsay', 'd3', 61, 8],
  ['Client legal privilege', 'd3', 57, 5],
  ['Cross-examination', 'd4', 33, 6],
  ['The rule in Browne v Dunn', 'd4', 29, 4],
  ['Affidavits', 'd5', 26, 5],
  ['Ratio and obiter', 'd6', 81, 7],
].map(([name, domain_id, mastery, attempts], i) => ({
  mastery,
  attempts,
  correct: Math.round((attempts * mastery) / 100),
  confident_and_wrong: i % 4 === 0 ? 2 : 0,
  last_seen_at: '2026-08-06T09:00:00Z',
  concepts: { id: `c${i}`, slug: `concept-${i}`, name, domain_id },
}));

const skillMastery = [
  ['procedural-sequencing', 'Procedural sequencing', 48, 12],
  ['evidence-analysis', 'Evidence analysis', 71, 14],
  ['attention-to-detail', 'Attention to detail', 62, 11],
  ['strategic-reasoning', 'Strategic reasoning', 77, 9],
  ['argument-construction', 'Argument construction', 55, 10],
  ['oral-communication', 'Oral communication', 31, 7],
  ['written-communication', 'Written communication', 44, 8],
  ['professional-judgment', 'Professional judgment', 68, 6],
].map(([slug, name, mastery, attempts]) => ({
  mastery,
  attempts,
  skills: { slug, name },
}));

const FACT = {
  id: 'f1',
  title: 'The most enforced rule in Australian cross-examination comes from an 1893 case that was never fully reported.',
  body: 'Browne v Dunn (1893) 6 R 67 is a House of Lords decision recorded in an obscure series. It holds that if you intend to contradict a witness or impugn their credit, you must put that case to them so they can answer it. It is cited in Australian courts constantly, more than a century later.',
  why_it_matters:
    'Breach it and you may lose the very submission your case was built around, or find the witness recalled at your client’s expense.',
  jurisdiction: 'AU_GENERAL',
  court: null,
  source_reference: 'Browne v Dunn (1893) 6 R 67',
  source_url: null,
  status: 'published',
  sort_order: 0,
  verification_status: 'requires_review',
  slug: 'fact-browne-v-dunn-1893',
};

const SESSION_ID = '99999999-9999-9999-9999-999999999999';

const deliveryQuestions = [
  {
    question_id: 'aaaaaaaa-0000-4000-8000-000000000001',
    question_version_id: 'bbbbbbbb-0000-4000-8000-000000000001',
    slug: 'cp-fishing-expedition',
    domain_id: 'd2',
    domain_slug: 'civil-procedure',
    domain_name: 'Civil Procedure',
    version: 1,
    question_type: 'scenario',
    scenario:
      'You act for a defendant. The plaintiff has issued a subpoena to your client’s accountant seeking "all documents relating to the defendant’s financial affairs for the past ten years". The pleaded case concerns a single alleged breach of contract in the most recent financial year.',
    stem: 'What is the strongest basis on which to apply to set the subpoena aside?',
    options: [
      { id: 'a', text: 'The accountant is not a party to the proceeding' },
      {
        id: 'b',
        text: 'The subpoena is oppressive and lacks a legitimate forensic purpose; it is a fishing expedition',
      },
      { id: 'c', text: 'Accountants’ records are inherently privileged from production' },
      { id: 'd', text: 'The plaintiff has not yet completed discovery' },
    ],
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    court: null,
  },
  {
    question_id: 'aaaaaaaa-0000-4000-8000-000000000002',
    question_version_id: 'bbbbbbbb-0000-4000-8000-000000000002',
    slug: 'cs-vic-magistrates',
    domain_id: 'd1',
    domain_slug: 'court-system',
    domain_name: 'Court System',
    version: 1,
    question_type: 'multiple_choice',
    scenario: null,
    stem: 'Which court is the intermediate court in the Victorian hierarchy?',
    options: [
      { id: 'a', text: 'The District Court of Victoria' },
      { id: 'b', text: 'The County Court of Victoria' },
      { id: 'c', text: 'The Victorian Civil and Administrative Tribunal' },
      { id: 'd', text: 'The Federal Circuit and Family Court of Australia' },
    ],
    difficulty: 1,
    jurisdiction: 'VIC',
    court: 'County Court of Victoria',
  },
];

const TABLES = {
  profiles: [
    {
      id: USER_ID,
      email: USER.email,
      display_name: 'Niamh',
      career_stage: 'junior_lawyer',
      improvement_goals: ['litigation_knowledge', 'advocacy'],
      daily_goal_minutes: 10,
      home_jurisdiction: 'VIC',
      timezone: 'Australia/Melbourne',
      onboarded_at: '2026-02-01T00:00:00Z',
      diagnostic_completed_at: '2026-02-01T00:20:00Z',
      is_admin: true,
    },
  ],
  xp_events: Array.from({ length: 43 }, () => ({ amount: 10 })),
  user_streaks: [{ user_id: USER_ID, current_streak: 6, longest_streak: 11 }],
  user_concept_mastery: conceptMastery,
  user_skill_mastery: skillMastery,
  review_schedule: [
    { concept_id: 'c2', next_review_at: '2026-08-06T00:00:00Z', concepts: { name: 'Subpoenas' } },
    { concept_id: 'c5', next_review_at: '2026-08-06T00:00:00Z', concepts: { name: 'Hearsay' } },
    {
      concept_id: 'c4',
      next_review_at: '2026-08-07T00:00:00Z',
      concepts: { name: 'Interlocutory applications' },
    },
  ],
  domains,
  daily_facts: [FACT],
  diagnostic_results: [
    {
      id: 'dr1',
      user_id: USER_ID,
      session_id: SESSION_ID,
      domain_scores: {
        'court-system': 84,
        'legal-reasoning': 78,
        evidence: 59,
        'civil-procedure': 43,
        advocacy: 31,
        drafting: 28,
      },
      skill_scores: { 'evidence-analysis': 66 },
      priority_domains: ['drafting', 'advocacy', 'civil-procedure'],
      total_questions: 30,
      total_correct: 17,
      completed_at: '2026-02-01T00:20:00Z',
    },
  ],
  training_sessions: [
    {
      id: SESSION_ID,
      user_id: USER_ID,
      kind: 'daily',
      status: 'in_progress',
      total_answered: 10,
      correct_count: 8,
      xp_awarded: 135,
      completed_at: '2026-08-06T09:10:00Z',
    },
  ],
  training_session_questions: deliveryQuestions.map((q, i) => ({
    id: `tsq${i}`,
    session_id: SESSION_ID,
    question_id: q.question_id,
    question_version_id: q.question_version_id,
    position: i,
    answered_at: null,
  })),
  v_question_delivery: deliveryQuestions,
  concepts: conceptMastery.map((c) => c.concepts),
  skills: skillMastery.map((s) => ({ id: s.skills.slug, ...s.skills })),
  questions: [
    {
      id: 'q1',
      slug: 'cp-fishing-expedition',
      status: 'published',
      domain_id: 'd2',
      domains: { name: 'Civil Procedure' },
      question_versions: {
        version: 1,
        stem: deliveryQuestions[0].stem,
        jurisdiction: 'AU_GENERAL',
        verification_status: 'requires_review',
        is_current: true,
      },
    },
    {
      id: 'q2',
      slug: 'cs-vic-magistrates',
      status: 'published',
      domain_id: 'd1',
      domains: { name: 'Court System' },
      question_versions: {
        version: 2,
        stem: deliveryQuestions[1].stem,
        jurisdiction: 'VIC',
        verification_status: 'human_verified',
        is_current: true,
      },
    },
  ],
  question_versions: [
    {
      id: 'bbbbbbbb-0000-4000-8000-000000000001',
      question_id: 'aaaaaaaa-0000-4000-8000-000000000001',
      version: 1,
      is_current: true,
      ...deliveryQuestions[0],
      correct_option_ids: ['b'],
      explanation: 'A subpoena must be directed to identified documents with an apparent relevance to the issues on the pleadings.',
      why_it_matters: 'Broad subpoenas impose real cost on your client and on third parties.',
      common_misconception: 'That anything relevant can be subpoenaed.',
      memory_trick: 'A subpoena proves a case. It does not go looking for one.',
      source_reference: null,
      source_url: null,
      source_checked_on: null,
      verification_status: 'requires_review',
    },
  ],
  question_concepts: [{ question_id: 'aaaaaaaa-0000-4000-8000-000000000001', concept_id: 'c0' }],
  question_skills: [{ question_id: 'aaaaaaaa-0000-4000-8000-000000000001', skill_id: 'procedural-sequencing' }],
  user_question_attempts: [],
  legal_sources: [],
};

/* -------------------------------------------------------------------------- */

let writeSeq = 1;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const send = (status, payload, headers = {}) => {
      const json = JSON.stringify(payload);
      res.writeHead(status, {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'content-range': `0-0/${Array.isArray(payload) ? payload.length : 1}`,
        ...headers,
      });
      res.end(json);
    };

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': '*',
      });
      return res.end();
    }

    // --- GoTrue -----------------------------------------------------------
    if (url.pathname === '/auth/v1/token') return send(200, SESSION);
    if (url.pathname === '/auth/v1/user') return send(200, USER);
    if (url.pathname === '/auth/v1/signup') return send(200, { ...SESSION, ...USER });
    if (url.pathname === '/auth/v1/logout') return send(204, {});

    // --- PostgREST --------------------------------------------------------
    if (url.pathname.startsWith('/rest/v1/')) {
      if (process.env.MOCK_DEBUG) {
        console.log(req.method, url.pathname + url.search, '| accept:', req.headers.accept);
      }
      const table = url.pathname.replace('/rest/v1/', '').split('?')[0];
      let rows = TABLES[table] ?? [];

      // Honour simple eq. filters. Without this, .maybeSingle() sees a
      // multi-row array and resolves to null, which the app correctly reads as
      // "not found" -- a mock artefact that looks exactly like an app bug.
      const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns']);
      for (const [key, value] of url.searchParams) {
        if (RESERVED.has(key) || !value.startsWith('eq.')) continue;
        const want = value.slice(3);
        rows = rows.filter((r) => String(r[key]) === want);
      }

      if (req.method !== 'GET') {
        const written = { id: 'cccccccc-0000-4000-8000-00000000000' + (writeSeq++ % 10), ...(rows[0] ?? {}) };
        const single = (req.headers.accept ?? '').includes('vnd.pgrst.object');
        return send(201, single ? written : [written]);
      }

      const wantsSingle = (req.headers.accept ?? '').includes('vnd.pgrst.object');
      if (wantsSingle) {
        return rows.length > 0 ? send(200, rows[0]) : send(406, { message: 'no rows' });
      }
      return send(200, rows);
    }

    send(404, { message: 'not mocked: ' + url.pathname });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`mock supabase on http://127.0.0.1:${PORT}\n`);
});
