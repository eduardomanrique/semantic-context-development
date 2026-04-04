# Reimbursement Invariants

The following constraints are the initial semantic baseline and should hold unless explicitly revised.

## Request integrity

- an expense claim starts in `DRAFT`
- an expense claim must have a non-empty description to be submitted
- an expense claim must have an amount greater than zero to be submitted
- an expense claim must have a category to be submitted
- the reimbursable total for the first story is the claim amount because each claim represents exactly one expense
- decision outcomes must be explainable from recorded review or approval actions

## Evidence and auditability

- every approval, rejection, return, and payment outcome must be auditable
- the system must preserve the original claimant submission and subsequent decision history
- a request must not reach a paid state without a prior approval outcome for the paid amount

## State consistency

- a claim in `DRAFT` can be edited only by its owner
- once a claim becomes `SUBMITTED`, the employee can no longer edit it
- terminal rejection and successful payment cannot both be true for the same request state at the same time

## Open invariant questions

- whether evidence will become mandatory for all categories or only some
- whether payment failures may be retried under the same payment record or require a new one
- whether edits after a future return flow preserve version history at claim level or field level
