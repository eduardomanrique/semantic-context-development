# Claim Invariants

## User Story 1 invariants

1. Every claim has exactly one expense entry in v1.
2. Every claim must include title, expense date, amount, category, and description.
3. Amount must be present, positive, and limited to at most two fractional digits in v1.
4. Every claim is owned by the employee who created it.
5. A newly created claim starts in `draft`.
6. Only a `draft` claim may transition to `submitted`.
7. Once a claim is `submitted`, the employee can no longer edit it.
8. Users without the employee role cannot create claims.
9. Users cannot create claims on behalf of another employee.
10. Category is required and free-form in v1.

## User Story 2 invariants

11. Only a manager can review a submitted claim.
12. Only a `submitted` claim may transition to `approved` or `rejected`.
13. A manager review decision is limited to approve or reject.
14. Once a claim is `approved` or `rejected`, the decision is locked in v1.
15. Review notes are optional and do not change the review outcome.

## User Story 3 invariants

16. Only a finance user can mark an approved claim as paid.
17. Only an `approved` claim may transition to `paid`.
18. Draft, submitted, and rejected claims cannot be marked as paid.
19. Once a claim is `paid`, payment completion is locked in v1.
20. Payment notes are optional and do not change payment eligibility.
21. The payment timestamp is recorded automatically when a claim becomes `paid`.

## User Story 4 invariants

22. Only the employee who owns a rejected claim may reopen it.
23. Reopening a rejected claim transitions it to `draft`.
24. A reopened claim is the same claim, not a replacement claim.
25. Historical manager review notes remain visible after reopening and resubmission.
26. After resubmission, the reopened claim must go through manager review again.
27. Paid claims remain immutable.
