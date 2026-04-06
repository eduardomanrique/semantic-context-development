# Demo walkthrough

This document describes the demo more as a practical sequence of steps than as a theoretical explanation.

The starting point was an empty project folder containing only the generated `AGENTS.md` file.

## What we did

From the point where the agent behavior was already working correctly, the demo followed the human interaction sequence below:

1. give the initial high-level project description
2. send User Story 1 and answer the model's clarification questions
3. send User Story 2 and answer the model's clarification questions
4. send User Story 3 and answer the model's clarification questions
5. send an invalid story on purpose and verify that it gets blocked
6. send a real business-rule change and answer the model's clarification questions
7. ask business-rule questions and verify that answers come from the Semantic Context
8. regenerate the app in another stack from the Semantic Context

## Step 1 — Give the initial high-level project description

The demo started from a short natural-language prompt describing a small expense reimbursement app.

The prompt said, in essence:

- employees create claims and submit them
- managers review them
- finance completes reimbursement after approval
- keep the app small, but include frontend, backend, and persistence

This first prompt deliberately looked like a build request.

Because the agent behavior was already correct at this point, the model treated that first prompt as initialization only.

So, within this same first interaction, the model:

- created the `semantic-context/` structure
- recorded the initial project description
- recorded open ambiguities as open questions
- created a ready state for the first concrete task

That means repository initialization was not a separate human step after the first prompt. It was the model's correct response to that first prompt.

The initialized repository already contained:

- `semantic-context/` as the canonical project memory
- `history/` as raw interaction history
- initial Semantic Context artifacts such as `vision.md`, domain files, flow/lifecycle files, and open ambiguity records

## Step 2 — User Story 1

### Story sent by the human

As an employee, I want to create an expense claim with the relevant expense details and submit it for review, so that I can request reimbursement.

### Clarification questions from the model

Only the ambiguities needed for this story were resolved.

Those confirmations came as answers to clarification questions asked by the model before implementation.

The confirmed choices were:

- one claim represents a single expense in v1
- required fields: title, expense date, amount, category, description
- currency out of scope
- receipts out of scope
- `draft -> submitted`
- editing allowed only in `draft`
- after submission, the employee cannot edit or withdraw
- seeded demo users are acceptable
- the technical stack for this slice was explicitly accepted

### Result

The first working slice was implemented with:

- frontend
- backend
- persistence
- seeded demo users
- employee claim creation and submission

This was also the first point where the implementation summary started to explicitly report the main technical decisions used in the slice.

## Step 3 — User Story 2

### Story sent by the human

As a manager, I want to open submitted expense claims, inspect their details, and make a review decision, so that the claim can either move forward or be rejected according to the review outcome.

### Clarification questions from the model
These were answers to clarification questions asked by the model before implementation.
The confirmed choices were:

- manager outcomes are `approve` and `reject`
- `submitted -> approved`
- `submitted -> rejected`
- rejected claims are terminal in that slice
- any seeded manager can review any submitted claim
- manager decisions are locked in v1

### Result

The second slice added:

- manager queue of submitted claims
- manager detail view
- approve / reject actions
- persisted review metadata
- backend-enforced manager authorization

## Step 4 — User Story 3

### Story sent by the human

As a finance user, I want to mark an approved claim as paid, so that the reimbursement workflow can be completed.

### Clarification questions from the model
These were answers to clarification questions asked by the model before implementation.
The confirmed choices were:

- `approved -> paid`
- any seeded finance user can mark any approved claim as paid
- payment note optional
- paid timestamp recorded automatically
- once paid, the transition is locked in v1
- only approved claims can be paid

### Result

The third slice added:

- finance queue of approved claims
- payment flow
- paid state in the lifecycle
- payment metadata
- employee-visible paid status

## Step 5 — Try an invalid story on purpose

After the first three stories, the demo intentionally sent an invalid change.

The invalid story was essentially:

- finance should be able to mark a **submitted** claim as paid

This conflicted with the existing lifecycle.

The agent correctly:

- detected the conflict
- pointed to the relevant Semantic Context artifacts
- refused to implement it blindly
- asked whether this was an intentional policy change

That invalid change was then explicitly rejected as only a conflict test.

## Step 6 — Change a business rule

### Story sent by the human

As an employee, I want to edit a rejected claim and resubmit it, so that I can correct problems and request reimbursement again.

### Clarification questions from the model
These were answers to clarification questions asked by the model before implementation.
The confirmed choices were:

- the same claim is reopened
- `rejected -> draft` when revision begins
- the employee can edit and resubmit
- previous manager note remains visible as historical context
- the claim goes through manager review again after resubmission
- paid claims remain immutable

### Result

The implementation added:

- explicit reopen action
- rejected-to-draft transition
- preserved review history
- repeat review cycles on the same claim
- UI for revising a rejected claim

This was a good test because it changed the lifecycle meaningfully instead of just adding an isolated feature.

## Step 7 — Ask business-rule questions

After several stories and one real rule change, the demo tested whether the project could answer business questions from the Semantic Context.

Questions included things like:

- can an employee edit a submitted claim?
- what states can a claim go through?
- can finance pay a rejected claim?
- what happens when a rejected claim is revised?
- are previous manager notes preserved?
- can any manager review any submitted claim?

The answers were consistent with the current Semantic Context.

## Step 8 — Regenerate in another stack

The demo also included regeneration.

The original demo implementation was done in Node.js. After that, a version of the application was recreated in Python from the Semantic Context rather than by copying the original codebase. To do that, we created a new folder and copied only the `semantic-context/` directory and the `AGENTS.md` file into it.

Because that new folder already contained `semantic-context/` and `AGENTS.md`, the agent did not treat it as a brand-new uninitialized project. That meant the first prompt in the regenerated project could go directly into implementation instead of repeating the initialization phase.

That regeneration was requested with just one prompt, and that prompt only said that the new implementation should be done in Python, after the Semantic Context had already been established. It does not prove perfect regeneration in general. But it was an important part of the experiment because it tested the idea that the project meaning should survive beyond one concrete implementation and be strong enough to support a fresh implementation in another stack.

## What the demo showed

The demo showed, in practical terms, that the repository could:

- initialize Semantic Context before coding
- evolve through small user stories
- clarify only the ambiguities needed for each story
- block semantically invalid changes before implementation
- update the Semantic Context before meaningful rule changes
- answer business-rule questions from Semantic Context
- surface main technical decisions instead of leaving them implicit
- regenerate the app in another stack from the maintained project meaning

## What the demo did not show

The demo did not prove that this method is universally better, or that it scales cleanly to every kind of project.

It was a small practical experiment.

## Where to inspect it

If you want to inspect the demo in detail:

- read the main `README.md`
- read the manifesto
- inspect the demo `history/` directory
- inspect the `semantic-context/` files
- compare the demo project and the regenerated project

That combination is the real output of the demo.
