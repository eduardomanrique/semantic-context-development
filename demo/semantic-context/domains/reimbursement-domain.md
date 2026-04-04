# Reimbursement Domain

## Core entities

### Worker

A person who may incur business expenses and submit reimbursement requests, either for themselves or, if later permitted, on behalf of another worker.

### Employee

The initial claimant type for the system.

For the first story, an employee may create, save, edit, and submit their own expense claims.

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

### Claim status

The current lifecycle state of an expense claim.

The initial statuses are:

- `DRAFT`
- `SUBMITTED`

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

## Semantic relationships

- an employee creates an expense claim
- an expense claim currently represents exactly one expense rather than a container of multiple expenses
- reviewers and approvers will later act on submitted claims
- approved claim amounts will later flow into payment records

## Domain questions still open

- whether reviewer and approver are distinct roles
- whether multi-stage approvals are required
- whether claim category values are free-form or policy-defined
- whether currency is implicit system-wide or needs to become an explicit claim field
- whether claims may ever be revised after submission through a formal return flow
