# Reimbursement Domain

## Core entities

### Worker

A person who may incur business expenses and submit reimbursement requests, either for themselves or, if later permitted, on behalf of another worker.

### Employee

The initial claimant type for the system.

For the current slice, an employee may create, save, edit, and submit their own expense claims.

For story 4 visibility:

- an employee may list and view only their own claims

### Manager

A manager may review any submitted expense claim in the current slice.

For story 2:

- any manager may review any submitted claim
- a manager review chooses either `APPROVED` or `REJECTED`
- no review reason or comment is captured yet
- if a claim is rejected, the owner may later reopen it only for correction in draft form

For story 4 visibility:

- a manager may list and view all claims

### Finance user

A finance user may complete reimbursement processing for approved claims in the current slice.

For story 3:

- any finance user may mark any approved claim as paid
- payment moves the claim directly from `APPROVED` to `PAID`
- payment captures who marked the claim as paid and when
- no reversal or unpaid transition exists yet

For story 4 visibility:

- a finance user may list and view all claims

### Expense claim

A claim for reimbursement of exactly one business expense incurred by an employee.

An expense claim has:

- an owner employee
- a description
- an amount
- a category
- a lifecycle status
- a creation moment
- a submission timestamp once formally submitted
- a reviewing manager identifier once reviewed
- a paying finance user identifier once paid
- a payment timestamp once paid
- a creation timestamp
- a submission timestamp once submitted
- an audit event history that preserves submission, review, reopen, and payment transitions
- a corrected-draft semantic after reopen that remains editable but not submission-eligible

### Claim status

The current lifecycle state of an expense claim.

The current statuses are:

- `DRAFT`
- `SUBMITTED`
- `APPROVED`
- `REJECTED`
- `PAID`

### Expense item

A single claimed expense within a reimbursement request.

An expense item has:

- a category
- an amount
- a currency
- a date incurred
- a business justification
- one or more evidence attachments when required by policy
- an approved amount once reviewed

### Evidence attachment

Evidence supporting an expense item, such as a receipt, invoice, or other approved proof of purchase.

### Reviewer

A role responsible for evaluating completeness, policy compliance, and legitimacy of claimed expenses.

### Approver

A role authorized to make approval or rejection decisions for reimbursement requests or individual expense items.

### Payment record

A record that an approved reimbursement amount was scheduled, processed, completed, failed, or reversed.

### User

An authenticated application user with exactly one system role.

A user has:

- a unique username
- a password credential stored in protected form
- exactly one role from `ADMIN`, `EMPLOYEE`, `MANAGER`, or `FINANCE`
- an active identity used as the canonical actor identifier in the claim workflow

### Admin user

An admin user manages user access in the current slice.

For the current slice:

- only admins may create new users
- admins are not part of the claim workflow unless a later story changes that semantic model
- the system seeds a default admin user with username `admin` and password `admin`

## Semantic relationships

- an employee creates an expense claim
- an expense claim currently represents exactly one expense rather than a container of multiple expenses
- a manager reviews a submitted claim and changes it immediately to `APPROVED` or `REJECTED`
- the owner of a rejected claim may reopen it, returning it to `DRAFT` for editing only as a corrected draft
- a finance user marks an approved claim as `PAID`
- paid claims may later correspond to richer payment records, but the current slice captures only direct paid completion
- employees may see only their own claims, while managers and finance users may see all claims
- authenticated username replaces explicit viewer or actor identifiers in protected claim flows
- admin users create other users, but do not create, review, or pay claims in the current slice

## Domain questions still open

- whether reviewer and approver are distinct roles
- whether the later workflow remains single-stage or grows into multi-stage approval
- whether claim category values are free-form or policy-defined
- whether currency is implicit system-wide or needs to become an explicit claim field
- whether future manager return behavior should reuse corrected-draft reopen semantics or become a distinct formal return flow
- whether a later product slice should allow hybrid roles such as an admin who is also an employee
