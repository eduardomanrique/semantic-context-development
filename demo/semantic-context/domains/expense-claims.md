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

Rejected claims are terminal in v1.

Review notes are optional in v1.

### Reimbursement completion

Finance performs the final step that completes reimbursement after a claim has been approved.

## Actors and responsibilities

### Employee

- Creates expense claims
- Submits claims for review
- Can edit only draft claims they created
- Cannot edit a claim after submission

### Manager

- Reviews submitted claims
- Decides whether a submitted claim should move forward
- Can inspect all expense details on any submitted claim in the seeded demo scope
- Can optionally record a review note with the decision
- Cannot change the decision after a claim has been reviewed

### Finance user

- Completes reimbursement for approved claims

## Known unknowns

Finance completion details, richer claim routing rules, and broader security rules remain unresolved outside the first two implementation slices and are tracked in open questions until later stories require them.
