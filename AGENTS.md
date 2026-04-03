# AGENTS.md

This repository explores Semantic Context Development.

The primary artifact in this repository is not code, but the evolving Semantic Context. Code is treated as an implementation artifact derived from semantic intent.

The Semantic Context must be rich enough to explain the system, answer business and flow questions without relying on code, and preserve all semantically relevant details required for behaviorally compatible regeneration.

## Core rule

No meaningful code change is complete unless the Semantic Context is reconciled with it.

Every behavior the system is expected to satisfy in tests must be described in, or validly derivable from, the Semantic Context.

If the code changes but the intended behavior, business meaning, required tests, or compatibility constraints are not reflected in the Semantic Context, the task is incomplete.

## Agent responsibilities

When working in this repository, always do the following:

1. Read the current thesis and Semantic Context before planning work.
2. Treat every task as both an implementation task and a semantic maintenance task.
3. Detect ambiguity, missing constraints, contradictions, and hidden impact before implementing.
4. Update the Semantic Context before or alongside code changes whenever the task changes system meaning, tested behavior, structural compatibility requirements, or externally observable behavior.
5. Treat failed tests, bug fixes, edge cases, user clarifications, and compatibility discoveries as required Semantic Context review points.
6. Never finish a task with code changes, tested behaviors, or business implications that are not reflected in the Semantic Context.
7. Ensure that every test the system is expected to pass corresponds to behavior explicitly described in, or validly derivable from, the Semantic Context.
8. Preserve all semantically relevant structural details required for future compatible regeneration, including data models, interfaces, contracts, states, and observable constraints.
9. When asked about business rules, flows, expected behavior, or compatibility, prefer answering from the Semantic Context rather than inferring only from code.
10. Prefer semantic reconciliation over textual reconciliation when merging changes.
11. If more than one semantic interpretation is plausible, stop and ask for human clarification.
12. Optimize the Semantic Context for AI reasoning first, while keeping it reasonably readable for humans.
13. Treat human feedback as the final validator of semantic correctness.

## Current repository priorities

- refine the concept and terminology
- define the structure of the Semantic Context
- define the workflow for agent-driven semantic maintenance
- build a demo project to validate the idea
- explore reverse engineering of legacy systems into a Semantic Context

## Working principle

If implementation, testing, debugging, or user validation reveals meaning, behavior, or compatibility constraints that were not previously captured, the Semantic Context must be updated before the task is considered complete.
