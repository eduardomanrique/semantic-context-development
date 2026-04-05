# Reimbursement Invariants

The following constraints are the initial semantic baseline and should hold unless explicitly revised.

## Request integrity

- an expense claim starts in `DRAFT`
- an expense claim must have a non-empty description to be submitted
- an expense claim must have an amount greater than zero to be submitted
- an expense claim must have a category to be submitted
- the reimbursable total for the first story is the claim amount because each claim represents exactly one expense
- only authenticated users may access protected claim or user-management flows
- each authenticated user has exactly one role from `ADMIN`, `EMPLOYEE`, `MANAGER`, or `FINANCE`
- only admins may create new users
- there is no self-service signup in the current slice
- a manager may review only a `SUBMITTED` claim
- manager review outcomes are limited to `APPROVED` and `REJECTED` in the current slice
- only the owner of a `REJECTED` claim may reopen it
- reopening a rejected claim returns it to `DRAFT`
- a reopened rejected claim becomes a corrected draft and is not submission-eligible
- a finance user may mark a claim as paid only when it is `APPROVED`
- employees may list and view only their own claims
- managers and finance users may list and view all claims
- claim lists are ordered newest first in the current slice
- decision outcomes must be explainable from recorded review or approval actions

## Evidence and auditability

- every approval, rejection, return, and payment outcome must be auditable
- the system must preserve the original claimant submission and subsequent decision history, including rejection and reopen events
- a request must not reach a paid state without a prior approval outcome for the paid amount
- a paid claim must record who marked it paid and when
- user creation and authenticated access control decisions must be attributable to persisted user records

## State consistency

- a claim in `DRAFT` can be edited only by its owner
- once a claim becomes `SUBMITTED`, the employee can no longer edit it
- a claim in `REJECTED` is read-only until its owner reopens it
- once reopened from `REJECTED`, the claim is editable again but remains a corrected draft
- once a claim becomes `APPROVED`, it becomes read-only for everyone in the current slice
- manager review immediately changes claim status from `SUBMITTED` to either `APPROVED` or `REJECTED`
- a reopened corrected draft cannot be submitted or reviewed again in the current slice
- reopening a rejected claim clears the current-cycle review state but must not erase prior audit history
- finance payment immediately changes claim status from `APPROVED` to `PAID`
- a paid claim is terminal in the current slice
- a claim cannot be both currently rejected and currently paid at the same time
- only `EMPLOYEE` users may create, edit, submit, or reopen their own claims
- only `MANAGER` users may review submitted claims
- only `FINANCE` users may mark approved claims as paid
- `ADMIN` users do not participate in claim-state transitions in the current slice

## Open invariant questions

- whether evidence will become mandatory for all categories or only some
- whether payment failures may be retried under the same payment record or require a new one
- whether future edit history after rejection or return should be preserved at claim level or field level
- whether the default admin credential should remain static outside local or demo environments
