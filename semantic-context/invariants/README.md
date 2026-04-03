# Invariants

This directory contains invariants and constraints that must always hold.

An invariant describes something that must never be violated if the system is behaving correctly.

Examples:
- a paid order cannot return to draft
- a deleted user cannot authenticate
- an approved document must have an approver
- a public API response must preserve a required field

Invariants are especially important for validation, conflict detection, and compatible regeneration.
