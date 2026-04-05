# Initial Product Ambiguities

Created during repository initialization from the first project description.

## Workflow and lifecycle

1. What exact claim states should exist beyond create, submit, approve, and reimburse?
2. Can finance perform any decision other than completing reimbursement for approved claims?
3. Can employees withdraw submitted claims before manager review?
4. Will future versions support returning rejected claims for revision and resubmission?

## Claim contents and validation

5. Are category values fixed or free-form in v1?
6. What precision and formatting rules should amount follow beyond being present and positive?
7. Are tax rules or reimbursement caps in scope later?

## Roles and permissions

9. How are employees, managers, and finance users authenticated?
10. Can one user hold multiple roles?
11. Which claims can a given manager review?
12. Which claims can finance users access?

## Technical and operational choices

13. What stack should be used for frontend, backend, and persistence?
14. Is the system single-tenant and for local/demo use only, or should multi-user behavior be exercised realistically?
15. What auditability expectations exist for approval and reimbursement actions?

## Testing follow-up

User Story 1 implementation-level tests are defined in `semantic-context/trace/user-story-1.md`.
User Story 2 implementation-level tests are defined in `semantic-context/trace/user-story-2.md`.
Remaining questions apply to later stories.
