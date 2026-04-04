# Reimbursement Lifecycle

## Baseline flow

1. An employee creates an expense claim in `DRAFT` state.
2. The employee enters or updates the claim description, amount, and category while the claim remains in `DRAFT`.
3. The employee may save the draft without submitting it.
4. The employee submits the claim only when all required fields are valid.
5. The system changes the claim status to `SUBMITTED`.
6. After submission, the claim becomes read-only to the employee.
7. Later review, approval, and payment behavior will extend this lifecycle in future stories.

## Baseline states

- `DRAFT` — the claim is being prepared and can still be edited by its owner
- `SUBMITTED` — the claim has been formally submitted and is no longer editable by its owner
- `returned` — the request needs claimant correction or additional information
- `approved` — the request or all payable items were approved
- `partially_approved` — some but not all claimed amount was approved
- `rejected` — the request is denied with no payable amount
- `payment_pending` — an approved amount is awaiting payment execution
- `paid` — payment succeeded
- `payment_failed` — payment was attempted but did not complete successfully

## Exceptional paths

- a draft claim cannot be submitted with an empty description
- a draft claim cannot be submitted with an amount less than or equal to zero
- a draft claim cannot be submitted without a category
- an employee cannot edit a submitted claim
- a payment may fail after approval, requiring follow-up without changing the approval decision itself

## Open semantic decisions

- whether a returned request resumes as `draft` or retains a distinct `returned` state until resubmission
- whether later approval occurs at claim level only or needs finer-grained structure
- whether cancellation by the claimant is allowed after submission
