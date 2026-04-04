# Initial Traceability

This file links intended behavior to the semantic source while the system is still being defined.

## Intended behavior areas

- story 1 claim creation maps to [vision.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/vision.md), [reimbursement-domain.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/domains/reimbursement-domain.md), and [reimbursement-lifecycle.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/flows/reimbursement-lifecycle.md)
- story 1 draft editing rules map to [2026-04-05-story-1-single-expense-claim.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/decisions/2026-04-05-story-1-single-expense-claim.md), [reimbursement-lifecycle.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/flows/reimbursement-lifecycle.md), and [reimbursement-invariants.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/invariants/reimbursement-invariants.md)
- story 1 submission validation maps to [2026-04-05-story-1-single-expense-claim.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/decisions/2026-04-05-story-1-single-expense-claim.md), [reimbursement-invariants.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/invariants/reimbursement-invariants.md), and [reimbursement-lifecycle.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/flows/reimbursement-lifecycle.md)
- the current web application delivery form maps to [2026-04-05-fastapi-in-memory-implementation.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/decisions/2026-04-05-fastapi-in-memory-implementation.md) and [vision.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/vision.md)
- the current full web app delivery form maps to [2026-04-05-full-web-app-ui-and-backend.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/decisions/2026-04-05-full-web-app-ui-and-backend.md) and [vision.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/vision.md)
- later review and approval behavior maps to [reimbursement-domain.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/domains/reimbursement-domain.md), [reimbursement-lifecycle.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/flows/reimbursement-lifecycle.md), and [reimbursement-invariants.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/invariants/reimbursement-invariants.md)
- later payment eligibility and outcomes map to [reimbursement-lifecycle.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/flows/reimbursement-lifecycle.md) and [reimbursement-invariants.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/invariants/reimbursement-invariants.md)

## Current testing posture

Executable tests should cover at least the following story 1 expectations:

- new claims start in `DRAFT`
- owners can edit claims while in `DRAFT`
- submission is blocked when `description` is empty
- submission is blocked when `amount` is less than or equal to zero
- submission is blocked when `category` is missing
- successful submission changes status to `SUBMITTED`
- employees cannot edit a claim after submission

Each executable test should link back to:

- semantic definition
- planned test coverage
- implementation area

## Story 1 implementation trace

- semantic definition:
  [2026-04-05-story-1-single-expense-claim.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/decisions/2026-04-05-story-1-single-expense-claim.md)
- web application shape:
  [2026-04-05-fastapi-in-memory-implementation.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/decisions/2026-04-05-fastapi-in-memory-implementation.md)
- full web app shape:
  [2026-04-05-full-web-app-ui-and-backend.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/decisions/2026-04-05-full-web-app-ui-and-backend.md)
- implementation area:
  [app.py](/Users/eduardokmanrique/Work/semantic-context-development/demo/expense_reimbursement/app.py)
- domain implementation area:
  [expense_claim.py](/Users/eduardokmanrique/Work/semantic-context-development/demo/expense_reimbursement/domain/expense_claim.py)
- frontend implementation area:
  [index.html](/Users/eduardokmanrique/Work/semantic-context-development/demo/expense_reimbursement/frontend/index.html)
- executable tests:
  [test_api.py](/Users/eduardokmanrique/Work/semantic-context-development/demo/tests/test_api.py)
