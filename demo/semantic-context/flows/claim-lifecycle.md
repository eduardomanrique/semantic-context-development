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
- Rejection is terminal in v1
- Once a claim has been reviewed, the review decision cannot be changed in v1
- Employee editing remains limited to `draft` claims only

## Lifecycle details intentionally unresolved

- Whether returned-for-edit states exist
- Whether employees can edit or withdraw after submission
- Whether finance can reject, retry, or partially reimburse
- Whether claims can contain multiple line items or attachments
