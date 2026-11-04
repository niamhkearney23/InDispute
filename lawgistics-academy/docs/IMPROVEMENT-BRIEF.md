# Lawgistics Academy: focused improvement brief

Prepared 4 November 2026. Use in the existing Academy coding session.

This brief adapts the attached prompting article to the current application. It defines who the change serves, the data it uses, the permissions it respects, the workflow it improves and the evidence needed to call it complete.

Reference reviewed: `niamhkearney23/InDispute`, `main` at `b48e65c17d9e62c9eb78d1553eb0135479899074`. Repository inspection does not verify production configuration, deployed behaviour or current database content. Recheck the active checkout and deployment before further work.

## First improvement in this change

The coach's work board previously listed every post newest first. A new task with no submissions could appear above older work awaiting feedback.

The page now places posts with unmarked submissions first, followed by unanswered conversations, then other posts. It preserves the existing order within each group. It uses the existing server-calculated counts and the existing coach guard. A post needing both actions appears once.

Actions say **Mark work**, **Reply**, **Mark and reply**, or **Edit**. The summary calls pending threads conversations because the count is per conversation, not per message. This change does not claim oldest-submission ordering: the summary does not supply that timestamp.

## Copy this into the existing coding session

You are improving the existing Lawgistics Academy in `lawgistics-academy` within `niamhkearney23/InDispute`.

The goal is a junior who knows what to do next, can hand work in reliably, receives useful lawyer feedback and has an honest record of what was assessed. The buyer is a firm training its juniors. Improve the current learning loop through small changes, each with an observable result.

### 1. Establish the current state

Read applicable instructions, `CLAUDE.md`, `README.md`, the package scripts, the relevant routes and their server services. Identify the exact checkout, commit, available migrations and deployment target.

Map each requested behaviour to existing code and classify it as implemented, tested here, deployed and verified, or blocked. Extend what exists. A repository test count is not evidence of today's production behaviour. Never apply the older repository default branch over a newer Academy implementation.

Use the existing Next.js, TypeScript, Tailwind, Supabase and Vercel architecture. Check the installed versions and current services rather than replacing the stack.

### 2. Preserve the product's actual rules

- Malaysia is the currently visible offering. Retain Australian content and existing Australian accounts, with jurisdiction separation; do not reopen Australia as part of this improvement.
- Invited interns have flexible homework. Confirmed litigation trainees have the programme and morning rounds. Do not give interns trainee obligations.
- Trainee rounds follow the existing server-side Kuala Lumpur schedule and holiday rules. Use the established cohort functions and precise hour boundaries.
- Keep learner, coach, firm administrator and content administrator permissions distinct. Firm administration is not permission to edit or verify legal content. Preserve staff MFA, server checks, RLS, access gates and existing review permissions.
- One firm per deployment remains the architecture. Do not introduce shared multi-firm tenancy for this work.
- Legal content requires the existing named review and publication process. AI does not verify or publish it. Content changes invalidate the relevant approval. Missing or expired approval must not become usable content through a new page.
- Reuse actual attempts, submissions, marks, current content and cohort records. Demonstration records must never appear to be a trainee's real history.
- Preserve the existing score and certification rules. Multiple-choice answers do not prove advocacy or drafting ability. A reading line is not proof that a book was read.
- Keep the current ivory, navy and taupe design, Newsreader and Figtree, existing colour tokens and mobile navigation. No em dashes.
- Keep the current production and staging restrictions. Prepare reviewable changes and verify them in the permitted environment.

### 3. Complete one workflow at a time

Audit these in order and fix confirmed gaps without duplicating working features:

| Workflow | Concrete behaviour to inspect | Completion evidence |
| --- | --- | --- |
| Join and begin | The intended learner can accept an invitation or register, complete onboarding and reach their permitted work. Pending trainee approval is clearly explained. | One invited intern and one confirmed trainee complete the real permitted flow in an isolated test environment. |
| Today | Coach note, relevant homework, current round where applicable, saved work and returned feedback have clear priorities. A blocked activity explains its actual reason. | Test intern, trainee, pending approval, holiday, closed questions and returned-work states; no impossible primary action. |
| Hand in | The task, instructions, due date and existing upload limits are clear. Success appears only after persistence. A failed submission preserves recoverable work and explains a useful next step. | Refresh and a second permitted session show the saved hand-in. Repeat clicks, expired sign-in and a failed request do not create false success or duplicate attempts. |
| Coach feedback | Work needing a mark or reply appears before ordinary posts. The coach can read the intended attempt and record feedback using existing permissions and verdicts. | Pending work is discoverable, marking persists and the intended learner sees the correct result. Intern and firm-admin accounts cannot invoke coach actions. |
| Refine and learn | Returned work has a clear next action and links to the relevant checked teaching or coach feedback. Preserve the original attempt and use the existing supported retry behaviour. | The learner can distinguish the original submission, its feedback and any permitted later attempt. Do not invent a resubmission mechanism where the schema does not support one. |
| Progress | Display the evidence actually held: answered questions, assessed matters, recorded supervisor decisions and existing certification requirements. | UI statements reconcile to persisted records; participation, self-declaration and lawyer assessment remain distinguishable. |

For each chosen change, state the user problem, exact fields and services involved, allowed actor, expected state transitions and acceptance checks before editing. Make ordinary implementation decisions and continue through implementation and verification. Ask only when a real product decision is missing.

### 4. Make legal review useful

Run the existing Malaysian content review plan. Distinguish items a lawyer can review from experience, items needing citation checks and items without an adequate source. Show the lawyer a short, prioritised set to review through the current sign-off tools.

Software may organise this work. It cannot supply a lawyer's signature. Do not bypass content gates to make a demo or a training round look complete. A coach's own permitted sessions, reading and homework should keep working where their existing rules allow them.

### 5. Check the actual changed behaviour

Run the relevant existing tests, typecheck, lint and build where the full checkout and dependencies are available. Use the real isolated Supabase checks for changed persistence or access rules. Rehearse any new migration on an isolated copy before a live update, regenerating combined SQL through the project's script.

For interface changes, exercise the actual action as well as rendering the page. Use the existing device checks and verify narrow phones, readable focus states, keyboard operation, loading, empty and failed-request states as relevant. Use the marker checks when changing marked exercises.

Report commands and outcomes honestly. Identify a blocked check and what it needs. Do not substitute mocked rendering for a real Auth, Storage or database test. Do not add broad tests that merely restate simple markup.

### 6. Report a concrete result

Finish each slice with:

- The user-facing behaviour changed and why.
- Files and migrations changed, if any.
- Checks actually run and their outcomes.
- Branch or pull request and deployment status.
- Any remaining blocker and its exact next action.

Keep separate what is designed, coded, tested, merged, migrated, configured, deployed and verified by a client. Continue to the next confirmed gap only after the current slice is reviewable.

## Targeted follow-ups

Use only the follow-up that matches an observed problem.

**If Today is confusing:** Trace which existing condition selects each visible action. Remove contradictory or duplicate actions, preserve role and cohort rules and show one clear next step for the state being fixed. Test that state and the adjacent boundary.

**If a hand-in appears to disappear:** Reproduce it through the actual form. Trace client state, authentication, server validation, the database write and the subsequent read. Fix the cause, retain the user's recoverable input and prove the saved submission survives refresh.

**If feedback is slow to find:** Start with the prioritised marking page in this change. Confirm its counts and links against real records. Only add age or overdue ordering when its timestamp and meaning exist in the server data.

**If someone looks more competent than the evidence supports:** Trace that label to the saved assessment and existing rule. Correct the claim. Do not derive speaking or writing competence from question-bank tags or self-ticked completion.

**If an AI exercise fails:** Exercise the real submission button with the existing marker checks. Preserve the submission and show the actual retry or coach path. Distinguish AI comments from lawyer assessment and preserve the existing source and review gates.
