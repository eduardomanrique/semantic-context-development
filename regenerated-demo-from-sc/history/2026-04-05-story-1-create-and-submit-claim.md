# Story 1 history

## User story

As an employee, I want to create an expense claim by entering a description, amount, and category, so that I can submit it for reimbursement approval.

## Semantic clarifications accepted for this story

- the active model is an expense claim, not a multi-expense reimbursement request
- each claim represents exactly one expense
- only employees are in scope as claim owners for this story
- the required claim fields are `description`, `amount`, and `category`
- claims start in `DRAFT`
- only the owner may edit while the claim is in `DRAFT`
- submission requires all required fields to be valid
- successful submission changes the claim to `SUBMITTED`
- submitted claims are read-only to the employee

## Out of scope retained

- attachments
- receipts
- multiple expenses in one claim
- comments
- approval details beyond submission

## Implementation actions

- updated the Semantic Context to match the story semantics
- added a minimal executable claim model and in-memory repository
- added executable tests for story 1 behavior
- ran the tests successfully
