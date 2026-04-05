# Expense Claims Domain

## Core concepts

### Expense claim

A claim is a reimbursement request created by an employee for one or more expenses incurred for work-related purposes.

For the first implementation slice, a claim contains exactly one expense entry.

The required claim fields in v1 are:

- title
- expense date
- amount
- category
- description

In v1, category is free-form text.

In v1, amount is entered as a positive decimal value with up to two fractional digits.

Currency is out of scope in v1.

Receipts and file attachments are out of scope in v1.

### Review decision

A manager evaluates a submitted claim and determines whether it should move forward in the reimbursement process.

For the second implementation slice, manager review has exactly two outcomes:

- approve
- reject

The resulting claim states are:

- `submitted` -> `approved`
- `submitted` -> `rejected`

In the fourth implementation slice, rejected claims are no longer terminal. The same claim may be reopened by the employee for correction and resubmitted for a fresh manager review cycle.

Review notes are optional in v1.

### Reimbursement completion

Finance performs the final step that completes reimbursement after a claim has been approved.

For the third implementation slice, finance completion transitions a claim from `approved` to `paid`.

Only approved claims may be marked as paid in v1.

Payment notes are optional in v1.

The payment timestamp is recorded automatically when finance marks the claim as paid.

## Actors and responsibilities

### Employee

- Creates expense claims
- Submits claims for review
- Can edit only draft claims they created
- Cannot edit a claim after submission
- Can reopen their own rejected claim for editing
- Can resubmit a reopened claim for a new manager review cycle

### Manager

- Reviews submitted claims
- Decides whether a submitted claim should move forward
- Can inspect all expense details on any submitted claim in the seeded demo scope
- Can optionally record a review note with the decision
- Cannot change the decision after a claim has been reviewed
- Previous review notes remain visible as historical context if a rejected claim is later reopened and resubmitted

### Finance user

- Completes reimbursement for approved claims
- Can inspect approved claims in the seeded demo scope
- Can optionally record a payment note when marking a claim as paid
- Cannot undo the paid state in v1

## Known unknowns

Richer finance controls, richer claim routing rules, and broader security rules remain unresolved outside the current implementation slices and are tracked in open questions until later stories require them.
