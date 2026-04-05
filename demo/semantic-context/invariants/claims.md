# Claim Invariants

## User Story 1 invariants

1. Every claim has exactly one expense entry in v1.
2. Every claim must include title, expense date, amount, category, and description.
3. Amount must be present and positive.
4. Every claim is owned by the employee who created it.
5. A newly created claim starts in `draft`.
6. Only a `draft` claim may transition to `submitted`.
7. Once a claim is `submitted`, the employee can no longer edit it.
8. Users without the employee role cannot create claims.
9. Users cannot create claims on behalf of another employee.

## User Story 2 invariants

10. Only a manager can review a submitted claim.
11. Only a `submitted` claim may transition to `approved` or `rejected`.
12. A manager review decision is limited to approve or reject.
13. Once a claim is `approved` or `rejected`, the decision is locked in v1.
14. Rejected claims are terminal in v1.
15. Review notes are optional and do not change the review outcome.
