# Trace For User Story 4

## User story

As an employee, I want to edit a rejected claim and resubmit it, so that I can correct problems and request reimbursement again.

## Expected behaviors

1. The employee who owns a rejected claim can reopen it for editing.
2. Reopening the claim transitions it from `rejected` to `draft`.
3. The employee can edit the reopened draft.
4. The employee can resubmit the reopened draft.
5. After resubmission, the claim returns to `submitted` and must go through manager review again.
6. Previous manager review notes remain visible as historical context after reopening and resubmission.
7. Paid claims remain immutable.

## Proposed automated tests

- Employee can reopen their rejected claim to draft
- Employee can edit a reopened claim
- Employee can resubmit a reopened claim
- Historical review notes remain visible after reopening and resubmission
- Manager can review the resubmitted claim again
- Employee cannot reopen another employee's rejected claim
- Paid claims cannot be reopened or edited

## Implementation areas

- Backend API for explicit rejected-claim reopening plus preserved review history
- Persistence for historical review cycles
- Frontend employee flow for reopening, editing, resubmitting, and viewing review history
