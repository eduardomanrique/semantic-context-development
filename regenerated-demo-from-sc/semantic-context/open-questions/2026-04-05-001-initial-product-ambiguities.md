# Initial Product Ambiguities

Created during repository initialization from the first project description.

## Resolved since initialization

- Category values are free-form in v1.
- Amount values are positive decimals with up to two fractional digits in v1.
- The regenerated implementation stack is a Python server-rendered web application with SQLite persistence.

## Workflow and lifecycle

1. What exact claim states should exist beyond create, submit, approve, and reimburse?
2. Can finance perform any decision other than completing reimbursement for approved claims?
3. Can employees withdraw submitted claims before manager review?
4. Will future versions support reversing or correcting a paid claim?
5. Will future versions add manager-driven return-for-edit states distinct from rejection?

## Claim contents and validation

4. Are tax rules or reimbursement caps in scope later?

## Roles and permissions

5. Can one user hold multiple roles?
6. Which claims can a given manager review outside the seeded demo scope?
7. Which claims can finance users access outside the seeded demo scope?

## Technical and operational choices

8. Is the system single-tenant and for local/demo use only, or should multi-user behavior be exercised realistically?
9. What auditability expectations exist for approval and reimbursement actions?

## Testing follow-up

User Story 1 implementation-level tests are defined in `semantic-context/trace/user-story-1.md`.
User Story 2 implementation-level tests are defined in `semantic-context/trace/user-story-2.md`.
User Story 3 implementation-level tests are defined in `semantic-context/trace/user-story-3.md`.
User Story 4 implementation-level tests are defined in `semantic-context/trace/user-story-4.md`.
Remaining questions apply to later stories.
