# Reimbursement Lifecycle

## Baseline flow

1. An employee creates an expense claim in `DRAFT` state.
2. The employee enters or updates the claim description, amount, and category while the claim remains in `DRAFT`.
3. The employee may save the draft without submitting it.
4. The employee submits the claim only when all required fields are valid.
5. The system changes the claim status to `SUBMITTED`.
6. After submission, the claim becomes read-only to the employee.
7. A manager may review the claim only while it is `SUBMITTED`.
8. The manager chooses either `APPROVED` or `REJECTED`.
9. The system immediately changes the claim status to the chosen review outcome.
10. If the manager rejects the claim, the owner may later reopen it.
11. Reopening a rejected claim returns it to `DRAFT`.
12. Once reopened, the owner may edit the claim again as a corrected draft.
13. A corrected draft cannot be submitted again for review in the current slice.
14. The system preserves prior submission, review, reopen, and payment events for auditability.
15. A finance user may mark the claim as paid only while it is `APPROVED`.
16. The system immediately changes the claim status to `PAID`.
17. The system records which finance user marked the claim as paid and when.
18. Approved and paid claims remain read-only in the current slice.
19. Paid claims remain terminal in the current slice.
20. Users may list claims visible to them.
21. Claim lists are ordered with newest claims first.
22. Employee claim visibility is limited to their own claims, while managers and finance users can see all claims.

## Baseline states

- `DRAFT` — the claim is being prepared and can still be edited by its owner
- a reopened rejected claim also returns to `DRAFT`, but only as a corrected draft that is not submission-eligible
- `SUBMITTED` — the claim has been formally submitted and is no longer editable by its owner but may be reviewed by a manager
- `APPROVED` — a manager reviewed the submitted claim and moved it forward
- `REJECTED` — a manager reviewed the submitted claim and decided it should not move forward in its current form, but the owner may reopen it
- `PAID` — a finance user marked the approved claim as paid and completed the current reimbursement flow
- `payment_failed` — payment was attempted but did not complete successfully

## Exceptional paths

- a draft claim cannot be submitted with an empty description
- a draft claim cannot be submitted with an amount less than or equal to zero
- a draft claim cannot be submitted without a category
- an employee cannot edit a submitted claim
- a manager cannot review a claim unless it is `SUBMITTED`
- only the owner of a rejected claim may reopen it
- a claim cannot be reopened unless it is `REJECTED`
- a corrected draft created by reopening a rejected claim cannot be submitted again in the current slice
- a finance user cannot mark a claim as paid unless it is `APPROVED`
- once a claim becomes `APPROVED` or `PAID`, it cannot be edited, reopened, or reviewed again in the current slice
- once a claim becomes `PAID`, it cannot be changed again in the current slice
- an employee cannot view another employee's claim in the current slice
- claim listing does not yet support filtering in the current slice

## Open semantic decisions

- whether a future explicit return workflow should replace corrected-draft reopen semantics with a distinct `RETURNED` state
- whether later approval remains claim-level only or needs finer-grained structure
- whether cancellation by the claimant is allowed after submission
