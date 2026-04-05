# User Story 4 Decisions

Timestamp: 2026-04-05

## User-confirmed scope

- the same claim is reopened
- `rejected` transitions to `draft` when the employee starts editing
- the employee can edit and resubmit
- the previous manager review note remains visible as historical context
- after resubmission, the claim must go through manager review again
- paid claims remain immutable

## Confirmed test expectations

- employee can reopen their rejected claim to draft
- employee can edit a reopened claim
- employee can resubmit a reopened claim
- historical review notes remain visible after reopening and resubmission
- manager can review the resubmitted claim again
- employee cannot reopen another employee's rejected claim
- paid claims cannot be reopened or edited
