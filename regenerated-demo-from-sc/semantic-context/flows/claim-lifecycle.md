# Claim Lifecycle Skeleton

## Intended lifecycle at initialization

The initial request establishes the following directional flow:

1. Claim creation by employee
2. Claim submission by employee
3. Review by manager
4. Manager decision on whether the claim moves forward
5. Reimbursement completion by finance after approval

## Lifecycle boundaries known so far

- Finance action must occur only after approval.
- Manager review happens after submission.
- Employees initiate the process by creating claims.

## V1 lifecycle for User Story 1

The first implemented lifecycle is:

1. Employee signs in through a seeded demo login
2. Employee creates a draft claim with the required fields
3. Employee may edit the draft claim before submission
4. Employee submits the draft claim for review
5. Claim becomes submitted and is no longer editable by the employee

## User Story 1 state model

- `draft`
- `submitted`

## User Story 1 transition rules

- Only employees can create claims
- A new claim starts in `draft`
- Only the employee who created the claim can edit that draft
- Only a `draft` claim can be submitted
- Submission changes the state to `submitted`
- A `submitted` claim cannot be edited by the employee

## User Story 2 lifecycle additions

The second implemented lifecycle extends review from the submitted state:

1. A manager opens the queue of submitted claims
2. A manager opens a submitted claim to inspect its details
3. The manager chooses either approve or reject
4. The manager may optionally record a review note
5. The claim transitions to either `approved` or `rejected`
6. Once reviewed, the decision is locked in v1

## User Story 2 state model

- `draft`
- `submitted`
- `approved`
- `rejected`

## User Story 2 transition rules

- Any seeded manager may review any submitted claim in the demo scope
- Only a `submitted` claim may be reviewed by a manager
- Manager review with decision `approve` changes the state to `approved`
- Manager review with decision `reject` changes the state to `rejected`
- Once a claim has been reviewed, the review decision cannot be changed in v1
- Employee editing remains limited to `draft` claims only

## User Story 3 lifecycle additions

The third implemented lifecycle extends finance completion from the approved state:

1. A finance user opens the queue of approved claims
2. A finance user opens an approved claim to inspect its details
3. The finance user marks the approved claim as paid
4. The finance user may optionally record a payment note
5. The system records the payment timestamp automatically
6. Once paid, the claim is locked in v1 with no undo

## User Story 3 state model

- `draft`
- `submitted`
- `approved`
- `rejected`
- `paid`

## User Story 3 transition rules

- Any seeded finance user may mark any approved claim as paid in the demo scope
- Only an `approved` claim may transition to `paid`
- Marking a claim as paid records the finance user and payment timestamp
- Draft, submitted, and rejected claims cannot be marked as paid
- Once a claim is `paid`, the payment completion cannot be changed in v1

## User Story 4 lifecycle additions

The fourth implemented lifecycle adds correction and resubmission for rejected claims:

1. The employee opens one of their rejected claims
2. The employee starts editing that rejected claim
3. Starting the edit reopens the same claim from `rejected` to `draft`
4. The employee edits the reopened draft
5. The employee resubmits the reopened draft
6. The claim returns to `submitted` and must go through manager review again
7. Earlier manager review notes remain visible as historical context

## User Story 4 state model

- `draft`
- `submitted`
- `approved`
- `rejected`
- `paid`

## User Story 4 transition rules

- Only the employee who owns the rejected claim may reopen it
- Reopening a rejected claim transitions it from `rejected` to `draft`
- A reopened draft may be edited using the same draft edit rules
- A reopened draft may be resubmitted through the normal submission path
- After resubmission, the claim must go through manager review again
- Previous manager review notes remain visible as historical context
- Paid claims remain immutable

## Lifecycle details intentionally unresolved

- Whether manager-driven returned-for-edit states exist separately from employee reopening of rejections
- Whether employees can edit or withdraw after submission
- Whether finance can reject, retry, partially reimburse, or reverse payment
- Whether claims can contain multiple line items or attachments
