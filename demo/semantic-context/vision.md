# Expense Reimbursement System

## Purpose

This system exists to allow workers to request reimbursement for eligible business expenses and allow the organization to review, approve, reject, pay, and audit those reimbursements.

## Semantic scope

The system is responsible for:

- capturing reimbursement requests
- tracking expense line items and attached evidence
- routing requests through review and approval
- recording reimbursement outcomes
- preserving an auditable history of decisions and changes

The system is not yet defined to handle:

- corporate card transaction ingestion
- travel booking
- payroll execution
- tax filing
- accounting ledger integration

These may be added later if explicitly adopted into scope.

## Primary outcomes

- employees can submit complete reimbursement requests
- reviewers can determine whether submitted expenses are eligible and sufficiently documented
- approvers can produce explicit approval or rejection decisions
- finance or payment operations can determine which approved amounts are ready to reimburse
- auditors can reconstruct what was submitted, decided, changed, and paid

## Initial product slice

The first implemented slice of the system is intentionally narrower than the long-term vision.

At this stage:

- only employees are in scope as claimants
- each claim represents exactly one expense
- the claim itself stores the expense description, amount, and category
- claim lifecycle behavior is defined through creation, draft editing, save, submission, manager review, rejection reopen into corrected draft, finance payment completion, and claim listing
- the current delivery form is a small full web application with a FastAPI backend, a simple frontend, authenticated sessions, and database persistence

The broader multi-expense reimbursement-request model remains a possible future evolution, but it is not the active semantic model for the first story.

## Current implementation posture

The current system is implemented as a small Python web application.

At this stage:

- FastAPI exposes the claim behavior through HTTP endpoints
- the application serves a simple browser-based user interface for creating, editing, saving, viewing, listing, submitting, reopening rejected claims into corrected drafts, reviewing, and marking claims as paid
- the browser interface is organized into role-focused workflows rather than a single mixed-control workspace
- persistence is database-backed and survives application restarts
- the implementation structure should preserve business rules independently of both the HTTP and UI layers
- authenticated username is the canonical user identity used by the claim workflow
- unauthenticated users may access only login-related flows
- only admin users may create additional users
- there is no self-service signup flow in the current slice

## Initial operating assumptions

These assumptions are provisional and must be validated before implementation of behavior that depends on them.

- the primary claimant is an employee or contractor acting as a worker
- reimbursement claims currently represent exactly one expense
- approval is required before reimbursement payment
- claim fields for the first story are description, amount, and category
- each authenticated user has exactly one role from `ADMIN`, `EMPLOYEE`, `MANAGER`, or `FINANCE`

## Current ambiguity

The following major semantic areas remain unresolved and must be clarified before implementation goes beyond scaffolding:

- who may submit reimbursements and on whose behalf
- what approval hierarchy is required
- which expense categories are eligible or ineligible
- whether policy limits vary by region, team, role, or project
- how payment is executed and confirmed
- what integrations are mandatory
