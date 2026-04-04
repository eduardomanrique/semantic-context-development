# Decision: Story 1 claim model

## Status

Accepted for the initial product slice.

## Decision

For the first implemented story, the system uses an `Expense claim` model instead of a multi-expense reimbursement request.

An expense claim:

- is owned by exactly one employee
- represents exactly one expense
- contains `description`, `amount`, and `category` directly on the claim
- starts in `DRAFT`
- may be edited only while in `DRAFT`
- may be submitted only when all required fields are valid
- becomes `SUBMITTED` after successful submission
- becomes read-only to the employee after submission

## Rationale

The story explicitly narrows scope to a single expense per claim and excludes attachments, receipts, comments, and approval workflow details beyond submission.

Recording this as a decision prevents accidental implementation drift back to the earlier provisional multi-expense model.
