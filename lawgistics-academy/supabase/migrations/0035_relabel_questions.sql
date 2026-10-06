-- =============================================================================
-- Every question's labels, reviewed strictly
-- =============================================================================
-- Scores by area and by topic are built from the labels on each question:
-- its area (domain), its topics (concepts) and its skills. Those labels were
-- attached loosely when the questions were drafted, and a rule that every
-- question must carry a skill forced one onto recall questions ("which court
-- sits in the middle" was tagged attention to detail). In October 2026 every
-- question was reviewed against one rule: a label stays only where answering
-- the question correctly genuinely depends on it. 201 of 203 changed.
--
-- The labels in the code are the same as these. This brings a database that
-- already has the questions up to date, since the app only loads content
-- the database does not have. Running it again changes nothing. A database
-- without the questions yet is unaffected; they arrive labelled correctly.
--
-- What learners have already been credited for under the old labels stays
-- in their record; new answers count under the new ones.
--
-- One statement, on purpose. The Supabase SQL editor can run each statement
-- on its own connection, so a scratch table made by one statement was gone
-- by the next ("relation relabel_0035 does not exist"). Here the list is part
-- of every statement that uses it, inside a single block.
-- =============================================================================

do $$
begin
  drop table if exists relabel_0035;
  create temporary table relabel_0035 (
    slug     text primary key,
    domain   text not null,
    concepts text[] not null,
    skills   text[] not null
  ) on commit drop;

  insert into relabel_0035 (slug, domain, concepts, skills) values
  ('my-cs-apex-court', 'court-system', array['my-court-structure', 'court-hierarchy']::text[], array[]::text[]),
  ('my-cs-two-high-courts', 'court-system', array['my-court-structure']::text[], array[]::text[]),
  ('my-cs-subordinate-courts', 'court-system', array['my-court-structure']::text[], array[]::text[]),
  ('my-cs-sessions-limit', 'court-system', array['my-monetary-jurisdiction']::text[], array[]::text[]),
  ('my-cs-magistrates-limit', 'court-system', array['my-monetary-jurisdiction']::text[], array[]::text[]),
  ('my-cs-syariah-separate', 'court-system', array['syariah-courts']::text[], array[]::text[]),
  ('my-cs-appeal-from-sessions', 'court-system', array['appellate-structure', 'my-court-structure']::text[], array[]::text[]),
  ('my-cs-leave-to-federal-court', 'court-system', array['appellate-structure', 'my-court-structure']::text[], array['procedural-sequencing']::text[]),
  ('my-cp-rules-of-court', 'civil-procedure', array['rules-of-court-2012']::text[], array[]::text[]),
  ('my-cp-writ-or-os', 'civil-procedure', array['originating-process']::text[], array['strategic-reasoning']::text[]),
  ('my-cp-writ-validity', 'civil-procedure', array['originating-process', 'rules-of-court-2012']::text[], array[]::text[]),
  ('my-cp-limitation-contract', 'civil-procedure', array['limitation-periods']::text[], array[]::text[]),
  ('my-cp-appearance-time', 'civil-procedure', array['originating-process', 'rules-of-court-2012']::text[], array[]::text[]),
  ('my-cp-default-judgment', 'civil-procedure', array['default-judgment']::text[], array['procedural-sequencing']::text[]),
  ('my-cp-order-14', 'civil-procedure', array['summary-judgment', 'rules-of-court-2012']::text[], array[]::text[]),
  ('my-cp-discovery', 'civil-procedure', array['discovery', 'rules-of-court-2012']::text[], array[]::text[]),
  ('my-cp-costs-follow-event', 'civil-procedure', array['costs']::text[], array[]::text[]),
  ('my-ev-evidence-act', 'evidence', array['evidence-act-1950']::text[], array[]::text[]),
  ('my-ev-relevance-code', 'evidence', array['evidence-act-1950', 'relevance']::text[], array[]::text[]),
  ('my-ev-expert-opinion', 'evidence', array['evidence-act-1950', 'opinion-evidence']::text[], array[]::text[]),
  ('my-ev-privilege', 'evidence', array['evidence-act-1950', 'client-legal-privilege']::text[], array[]::text[]),
  ('my-ev-without-prejudice', 'evidence', array['settlement-privilege']::text[], array[]::text[]),
  ('my-ev-burden', 'evidence', array['evidence-act-1950', 'onus-of-proof']::text[], array[]::text[]),
  ('my-ev-civil-standard', 'evidence', array['standard-of-proof']::text[], array[]::text[]),
  ('my-ad-leading-questions', 'evidence', array['questioning-rules', 'evidence-act-1950']::text[], array[]::text[]),
  ('my-ad-duty-to-court', 'advocacy', array['duty-to-court', 'candour-and-disclosure']::text[], array['professional-judgment']::text[]),
  ('my-ad-reexamination', 'advocacy', array['re-examination']::text[], array[]::text[]),
  ('my-ad-answer-the-bench', 'advocacy', array['oral-submissions']::text[], array['strategic-reasoning']::text[]),
  ('my-dr-statement-of-claim', 'drafting', array['drafting-pleadings', 'pleadings']::text[], array[]::text[]),
  ('my-dr-affidavit-content', 'drafting', array['affidavits']::text[], array[]::text[]),
  ('my-dr-prayer-for-relief', 'drafting', array['relief-claimed']::text[], array[]::text[]),
  ('my-lr-federal-court-binds', 'legal-reasoning', array['stare-decisis']::text[], array['argument-construction']::text[]),
  ('my-lr-ratio-obiter', 'legal-reasoning', array['ratio-and-obiter']::text[], array[]::text[]),
  ('my-lr-purposive-approach', 'legal-reasoning', array['statutory-interpretation']::text[], array[]::text[]),
  ('my-lr-elements-analysis', 'legal-reasoning', array['elements-analysis', 'issue-identification']::text[], array['argument-construction']::text[]),
  ('my-ad-objection-ground', 'advocacy', array['objections']::text[], array[]::text[]),
  ('my-ad-putting-your-case', 'advocacy', array['browne-v-dunn']::text[], array[]::text[]),
  ('my-dr-letter-of-demand', 'drafting', array['letters-of-demand']::text[], array[]::text[]),
  ('my-dr-chronology', 'drafting', array['chronologies']::text[], array[]::text[]),
  ('my-dr-written-submissions', 'drafting', array['written-submissions']::text[], array[]::text[]),
  ('my-lr-distinguishing', 'legal-reasoning', array['distinguishing']::text[], array[]::text[]),
  ('my-res-start-secondary', 'legal-research', array['research-strategy']::text[], array[]::text[]),
  ('my-res-current-legislation', 'legal-research', array['currency', 'authoritative-sources']::text[], array[]::text[]),
  ('my-res-noting-up', 'legal-research', array['noting-up']::text[], array[]::text[]),
  ('my-res-report-series', 'legal-research', array['authoritative-sources']::text[], array[]::text[]),
  ('my-res-search-terms', 'legal-research', array['search-technique']::text[], array[]::text[]),
  ('my-res-record-and-stop', 'legal-research', array['recording-research']::text[], array[]::text[]),
  ('ch-au-appeal-from-intermediate', 'court-system', array['court-hierarchy', 'appellate-structure']::text[], array[]::text[]),
  ('ch-au-where-hierarchies-meet', 'court-system', array['court-hierarchy', 'federal-jurisdiction']::text[], array[]::text[]),
  ('ch-au-small-claim-starts', 'court-system', array['monetary-jurisdiction']::text[], array[]::text[]),
  ('ch-my-apex', 'court-system', array['my-court-structure', 'court-hierarchy']::text[], array[]::text[]),
  ('ch-my-appeal-from-sessions', 'court-system', array['my-court-structure', 'appellate-structure']::text[], array[]::text[]),
  ('ch-my-two-high-courts', 'court-system', array['my-court-structure', 'court-hierarchy']::text[], array['attention-to-detail']::text[]),
  ('cp-subpoena-non-party-documents', 'civil-procedure', array['subpoenas']::text[], array[]::text[]),
  ('cp-conduct-money', 'civil-procedure', array['subpoenas']::text[], array[]::text[]),
  ('cp-fishing-expedition', 'civil-procedure', array['subpoenas']::text[], array['argument-construction', 'attention-to-detail']::text[]),
  ('cp-discovery-scope', 'civil-procedure', array['discovery']::text[], array[]::text[]),
  ('cp-pleadings-material-facts', 'civil-procedure', array['pleadings']::text[], array[]::text[]),
  ('cp-particulars-function', 'civil-procedure', array['particulars']::text[], array[]::text[]),
  ('cp-default-judgment', 'civil-procedure', array['default-judgment']::text[], array['procedural-sequencing']::text[]),
  ('cp-summary-judgment-vic-test', 'civil-procedure', array['summary-judgment']::text[], array[]::text[]),
  ('cp-limitation-contract-vic', 'civil-procedure', array['limitation-periods']::text[], array[]::text[]),
  ('cp-costs-follow-the-event', 'civil-procedure', array['costs']::text[], array[]::text[]),
  ('cp-indemnity-costs', 'civil-procedure', array['costs']::text[], array[]::text[]),
  ('cp-interlocutory-meaning', 'civil-procedure', array['interlocutory-applications']::text[], array[]::text[]),
  ('cp-service-purpose', 'civil-procedure', array['originating-process']::text[], array['procedural-sequencing']::text[]),
  ('ev-uniform-evidence-jurisdictions', 'evidence', array['uniform-evidence-acts']::text[], array[]::text[]),
  ('ev-relevance-threshold', 'evidence', array['relevance']::text[], array[]::text[]),
  ('ev-hearsay-definition', 'evidence', array['hearsay']::text[], array[]::text[]),
  ('ev-non-hearsay-purpose', 'evidence', array['hearsay']::text[], array['evidence-analysis']::text[]),
  ('ev-opinion-rule-expert', 'evidence', array['opinion-evidence']::text[], array[]::text[]),
  ('ev-advice-privilege', 'evidence', array['client-legal-privilege']::text[], array[]::text[]),
  ('ev-litigation-privilege-scenario', 'evidence', array['client-legal-privilege']::text[], array['evidence-analysis']::text[]),
  ('ev-without-prejudice', 'evidence', array['settlement-privilege']::text[], array[]::text[]),
  ('ev-civil-standard', 'evidence', array['standard-of-proof']::text[], array[]::text[]),
  ('ev-briginshaw', 'evidence', array['standard-of-proof']::text[], array[]::text[]),
  ('ev-onus-civil', 'evidence', array['onus-of-proof']::text[], array[]::text[]),
  ('ev-business-records', 'evidence', array['documentary-evidence', 'hearsay']::text[], array[]::text[]),
  ('ev-leading-questions-in-chief', 'evidence', array['questioning-rules']::text[], array[]::text[]),
  ('cs-final-court-of-appeal', 'court-system', array['court-hierarchy', 'appellate-structure']::text[], array[]::text[]),
  ('cs-special-leave', 'court-system', array['appellate-structure']::text[], array['procedural-sequencing']::text[]),
  ('cs-vic-intermediate-court', 'court-system', array['court-hierarchy']::text[], array[]::text[]),
  ('cs-nsw-intermediate-court', 'court-system', array['court-hierarchy']::text[], array[]::text[]),
  ('cs-act-no-intermediate', 'court-system', array['court-hierarchy']::text[], array[]::text[]),
  ('cs-vic-appeal-from-county', 'court-system', array['appellate-structure']::text[], array[]::text[]),
  ('cs-fcfcoa', 'court-system', array['federal-jurisdiction']::text[], array[]::text[]),
  ('cs-mode-of-address-judge', 'court-system', array['courtroom-conduct']::text[], array[]::text[]),
  ('cs-tribunal-not-court', 'court-system', array['tribunals']::text[], array[]::text[]),
  ('cs-leave-interlocutory-appeal', 'court-system', array['appellate-structure']::text[], array[]::text[]),
  ('cs-first-instance', 'court-system', array['court-terminology']::text[], array[]::text[]),
  ('cs-parties-terminology', 'court-system', array['court-terminology']::text[], array['attention-to-detail']::text[]),
  ('cs-vic-magistrates-jurisdictional-limit', 'court-system', array['monetary-jurisdiction']::text[], array[]::text[]),
  ('res-start-secondary', 'legal-research', array['research-strategy']::text[], array['procedural-sequencing']::text[]),
  ('res-currency-legislation', 'legal-research', array['currency']::text[], array[]::text[]),
  ('res-noting-up', 'legal-research', array['noting-up']::text[], array[]::text[]),
  ('res-authorised-report', 'legal-research', array['authoritative-sources']::text[], array[]::text[]),
  ('res-search-terms', 'legal-research', array['search-technique']::text[], array[]::text[]),
  ('res-record-what-you-did', 'legal-research', array['recording-research']::text[], array[]::text[]),
  ('res-when-to-stop', 'legal-research', array['knowing-when-to-stop']::text[], array[]::text[]),
  ('ad-browne-v-dunn', 'advocacy', array['browne-v-dunn']::text[], array[]::text[]),
  ('ad-cross-leading-permitted', 'advocacy', array['cross-examination', 'questioning-rules']::text[], array[]::text[]),
  ('ad-re-examination-scope', 'advocacy', array['re-examination']::text[], array[]::text[]),
  ('ad-paramount-duty', 'advocacy', array['duty-to-court']::text[], array[]::text[]),
  ('ad-adverse-authority', 'advocacy', array['candour-and-disclosure']::text[], array['professional-judgment']::text[]),
  ('ad-no-personal-opinion', 'advocacy', array['candour-and-disclosure']::text[], array[]::text[]),
  ('ad-objection-ground', 'advocacy', array['objections']::text[], array[]::text[]),
  ('ad-opening-purpose', 'advocacy', array['oral-submissions']::text[], array[]::text[]),
  ('ad-answering-judicial-question', 'advocacy', array['oral-submissions']::text[], array['strategic-reasoning']::text[]),
  ('ad-concession', 'advocacy', array['oral-submissions']::text[], array['strategic-reasoning']::text[]),
  ('ad-taking-instructions', 'advocacy', array['oral-submissions']::text[], array['professional-judgment']::text[]),
  ('ad-cross-purpose', 'advocacy', array['cross-examination']::text[], array[]::text[]),
  ('ad-witness-preparation-limit', 'advocacy', array['duty-to-court']::text[], array[]::text[]),
  ('lr-ratio-decidendi', 'legal-reasoning', array['ratio-and-obiter']::text[], array[]::text[]),
  ('lr-obiter-persuasive', 'legal-reasoning', array['ratio-and-obiter', 'stare-decisis']::text[], array[]::text[]),
  ('lr-stare-decisis-hierarchy', 'legal-reasoning', array['stare-decisis']::text[], array[]::text[]),
  ('lr-interstate-appellate', 'legal-reasoning', array['appellate-comity']::text[], array[]::text[]),
  ('lr-comity-single-judges', 'legal-reasoning', array['appellate-comity']::text[], array[]::text[]),
  ('lr-purposive-interpretation', 'legal-reasoning', array['statutory-interpretation']::text[], array[]::text[]),
  ('lr-extrinsic-materials', 'legal-reasoning', array['extrinsic-materials']::text[], array[]::text[]),
  ('lr-text-context-purpose', 'legal-reasoning', array['statutory-interpretation']::text[], array[]::text[]),
  ('lr-elements-analysis', 'legal-reasoning', array['elements-analysis']::text[], array['procedural-sequencing']::text[]),
  ('lr-distinguishing', 'legal-reasoning', array['distinguishing']::text[], array[]::text[]),
  ('lr-issue-identification', 'legal-reasoning', array['issue-identification', 'pleadings']::text[], array['attention-to-detail']::text[]),
  ('lr-analogical-reasoning', 'legal-reasoning', array['distinguishing']::text[], array['argument-construction']::text[]),
  ('lr-dissent-status', 'legal-reasoning', array['ratio-and-obiter']::text[], array[]::text[]),
  ('dr-affidavit-sworn-or-affirmed', 'drafting', array['affidavits']::text[], array[]::text[]),
  ('dr-affidavit-no-submissions', 'drafting', array['affidavits']::text[], array[]::text[]),
  ('dr-affidavit-information-and-belief', 'drafting', array['affidavits']::text[], array[]::text[]),
  ('dr-jurat', 'drafting', array['affidavit-formalities']::text[], array[]::text[]),
  ('dr-exhibit-vs-annexure', 'drafting', array['affidavit-formalities']::text[], array[]::text[]),
  ('dr-statutory-declaration', 'drafting', array['statutory-declarations']::text[], array[]::text[]),
  ('dr-letter-of-demand-elements', 'drafting', array['letters-of-demand']::text[], array['professional-judgment']::text[]),
  ('dr-prayer-for-relief', 'drafting', array['relief-claimed']::text[], array[]::text[]),
  ('dr-chronology-purpose', 'drafting', array['chronologies']::text[], array[]::text[]),
  ('dr-first-person-affidavit', 'drafting', array['affidavits']::text[], array[]::text[]),
  ('dr-alterations-initialled', 'drafting', array['affidavit-formalities']::text[], array[]::text[]),
  ('dr-written-submissions-structure', 'drafting', array['written-submissions']::text[], array[]::text[]),
  ('dr-pleading-a-contract-claim', 'drafting', array['drafting-pleadings']::text[], array[]::text[]),
  ('bas-what-is-a-hierarchy', 'court-system', array['court-hierarchy']::text[], array[]::text[]),
  ('bas-what-is-an-appeal', 'court-system', array['appellate-structure']::text[], array[]::text[]),
  ('bas-what-binding-means', 'legal-reasoning', array['stare-decisis']::text[], array[]::text[]),
  ('bas-trial-vs-appeal-court', 'court-system', array['appellate-structure']::text[], array[]::text[]),
  ('bas-what-is-jurisdiction', 'court-system', array['court-hierarchy']::text[], array[]::text[]),
  ('bas-first-instance', 'court-system', array['court-terminology']::text[], array[]::text[]),
  ('bas-who-decides-facts', 'court-system', array['court-terminology']::text[], array[]::text[]),
  ('bas-parties-names', 'court-system', array['court-terminology']::text[], array[]::text[]),
  ('adv-my-striking-out-no-evidence', 'civil-procedure', array['rules-of-court-2012', 'pleadings']::text[], array['attention-to-detail']::text[]),
  ('adv-my-adverse-inference-114g', 'evidence', array['evidence-act-1950']::text[], array['statutory-analysis']::text[]),
  ('adv-my-s91-92-oral-variation', 'evidence', array['evidence-act-1950', 'documentary-evidence']::text[], array['evidence-analysis']::text[]),
  ('adv-my-setting-aside-regular-irregular', 'civil-procedure', array['default-judgment', 'rules-of-court-2012']::text[], array['strategic-reasoning']::text[]),
  ('adv-my-order-14a-point-of-law', 'civil-procedure', array['rules-of-court-2012', 'summary-judgment']::text[], array['strategic-reasoning']::text[]),
  ('adv-my-mareva-requirements', 'civil-procedure', array['interlocutory-applications']::text[], array[]::text[]),
  ('adv-my-anton-piller-threshold', 'civil-procedure', array['interlocutory-applications']::text[], array[]::text[]),
  ('adv-my-federal-court-leave-criteria', 'court-system', array['appellate-structure', 'my-court-structure']::text[], array[]::text[]),
  ('adv-my-order-14-triable-issue', 'civil-procedure', array['summary-judgment', 'rules-of-court-2012']::text[], array[]::text[]),
  ('adv-my-limitation-fraud-postponement', 'civil-procedure', array['limitation-periods']::text[], array['strategic-reasoning']::text[]),
  ('adv-au-anshun-estoppel', 'civil-procedure', array['pleadings']::text[], array['attention-to-detail']::text[]),
  ('adv-au-house-v-king', 'court-system', array['appellate-structure']::text[], array[]::text[]),
  ('adv-au-browne-v-dunn-remedy', 'advocacy', array['browne-v-dunn']::text[], array[]::text[]),
  ('adv-au-dominant-purpose', 'evidence', array['client-legal-privilege']::text[], array['attention-to-detail', 'evidence-analysis']::text[]),
  ('adv-au-jones-v-dunkel-limit', 'evidence', array['onus-of-proof']::text[], array['evidence-analysis']::text[]),
  ('adv-au-briginshaw', 'evidence', array['standard-of-proof']::text[], array[]::text[]),
  ('adv-au-calderbank-vs-formal-offer', 'civil-procedure', array['costs']::text[], array[]::text[]),
  ('adv-au-expert-reasoning-exposed', 'evidence', array['opinion-evidence']::text[], array['evidence-analysis', 'attention-to-detail']::text[]),
  ('adv-au-security-for-costs-impecuniosity', 'civil-procedure', array['costs', 'interlocutory-applications']::text[], array[]::text[]),
  ('adv-au-without-prejudice-exception', 'evidence', array['settlement-privilege']::text[], array['evidence-analysis']::text[]),
  ('aic-approved-tools', 'ethics-and-ai', array['ai-policy']::text[], array[]::text[]),
  ('aic-vendor-terms', 'ethics-and-ai', array['ai-vendor-terms']::text[], array[]::text[]),
  ('aic-client-consent', 'ethics-and-ai', array['ai-client-consent']::text[], array['professional-judgment']::text[]),
  ('aic-incident-path', 'ethics-and-ai', array['ai-incident']::text[], array['professional-judgment']::text[]),
  ('aic-records', 'ethics-and-ai', array['ai-records']::text[], array[]::text[]),
  ('aic-supervision', 'ethics-and-ai', array['ai-supervision']::text[], array[]::text[]),
  ('my-aic-approved-tools', 'ethics-and-ai', array['ai-policy']::text[], array[]::text[]),
  ('my-aic-vendor-terms', 'ethics-and-ai', array['ai-vendor-terms']::text[], array[]::text[]),
  ('my-aic-incident-path', 'ethics-and-ai', array['ai-incident']::text[], array['professional-judgment']::text[]),
  ('my-aic-records', 'ethics-and-ai', array['ai-records']::text[], array[]::text[]),
  ('my-aic-supervision', 'ethics-and-ai', array['ai-supervision']::text[], array[]::text[]),
  ('ai-confidentiality-public-tool', 'ethics-and-ai', array['ai-confidentiality']::text[], array['professional-judgment']::text[]),
  ('ai-fabricated-citation', 'ethics-and-ai', array['ai-verification']::text[], array['professional-judgment']::text[]),
  ('ai-duty-to-court-paramount', 'ethics-and-ai', array['ai-supervision']::text[], array[]::text[]),
  ('ai-disclosure-to-court', 'ethics-and-ai', array['ai-candour']::text[], array['professional-judgment']::text[]),
  ('ai-affidavit-prohibition', 'ethics-and-ai', array['ai-candour', 'affidavits']::text[], array[]::text[]),
  ('ai-privilege-third-party', 'ethics-and-ai', array['ai-privilege']::text[], array[]::text[]),
  ('ai-competence-obligation', 'ethics-and-ai', array['ai-competence']::text[], array[]::text[]),
  ('ai-billing-time', 'ethics-and-ai', array['ai-billing']::text[], array['professional-judgment']::text[]),
  ('ai-advice-is-yours', 'ethics-and-ai', array['ai-supervision']::text[], array[]::text[]),
  ('ai-correcting-the-record', 'ethics-and-ai', array['ai-candour']::text[], array['professional-judgment']::text[]),
  ('my-ai-confidentiality', 'ethics-and-ai', array['ai-confidentiality']::text[], array['professional-judgment']::text[]),
  ('my-ai-fabricated-citation', 'ethics-and-ai', array['ai-verification']::text[], array['professional-judgment']::text[]),
  ('my-ai-bar-council-guidance', 'ethics-and-ai', array['ai-competence']::text[], array[]::text[]),
  ('my-ai-responsibility', 'ethics-and-ai', array['ai-supervision']::text[], array[]::text[]),
  ('my-ai-firm-policy', 'ethics-and-ai', array['ai-policy']::text[], array['professional-judgment']::text[]),
  ('my-ai-competence', 'ethics-and-ai', array['ai-competence']::text[], array[]::text[]),
  ('my-ai-jurisdiction-drift', 'ethics-and-ai', array['ai-competence']::text[], array[]::text[]),
  ('my-ai-correcting-the-record', 'ethics-and-ai', array['ai-candour']::text[], array['professional-judgment']::text[]),
  ('my-bas-what-is-a-hierarchy', 'court-system', array['court-hierarchy']::text[], array[]::text[]),
  ('my-bas-what-is-an-appeal', 'court-system', array['appellate-structure']::text[], array[]::text[]),
  ('my-bas-binding', 'legal-reasoning', array['stare-decisis']::text[], array[]::text[]),
  ('my-bas-two-high-courts-basic', 'court-system', array['my-court-structure']::text[], array[]::text[]),
  ('my-bas-syariah-basic', 'court-system', array['syariah-courts']::text[], array[]::text[]),
  ('my-bas-jurisdiction', 'court-system', array['court-terminology']::text[], array[]::text[]),
  ('my-bas-first-instance', 'court-system', array['court-terminology']::text[], array[]::text[]),
  ('my-bas-parties', 'court-system', array['court-terminology']::text[], array[]::text[]);

  update public.questions q
  set domain_id = d.id
  from relabel_0035 l
  join public.domains d on d.slug = l.domain
  where q.slug = l.slug
    and q.domain_id is distinct from d.id;

  delete from public.question_concepts qc
  using public.questions q, relabel_0035 l
  where qc.question_id = q.id
    and q.slug = l.slug;

  insert into public.question_concepts (question_id, concept_id)
  select q.id, c.id
  from relabel_0035 l
  join public.questions q on q.slug = l.slug
  cross join lateral unnest(l.concepts) as wanted(slug)
  join public.concepts c on c.slug = wanted.slug;

  delete from public.question_skills qs
  using public.questions q, relabel_0035 l
  where qs.question_id = q.id
    and q.slug = l.slug;

  insert into public.question_skills (question_id, skill_id)
  select q.id, s.id
  from relabel_0035 l
  join public.questions q on q.slug = l.slug
  cross join lateral unnest(l.skills) as wanted(slug)
  join public.skills s on s.slug = wanted.slug;

  drop table relabel_0035;
end
$$;
