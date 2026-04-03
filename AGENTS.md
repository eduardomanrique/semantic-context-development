# AGENTS.md

This repository explores Semantic Context Development.

The primary artifact in this repository is not code, but the evolving Semantic Context. Code is treated as an implementation artifact derived from semantic intent.

## Core rule

No meaningful code change is complete unless the Semantic Context is reconciled with it.

## Agent responsibilities

When working in this repository, always do the following:

1. Read the current thesis and Semantic Context before planning work.
2. Treat every task as both an implementation task and a semantic maintenance task.
3. Detect ambiguity, missing constraints, contradictions, and hidden impact before implementing.
4. Update the Semantic Context before or alongside code changes whenever the task changes system meaning.
5. Treat failed tests, bug fixes, edge cases, and user clarifications as possible Semantic Context updates.
6. Never finish a task with code changes that are not reflected in the Semantic Context.
7. Prefer semantic reconciliation over textual reconciliation when merging changes.
8. If more than one semantic interpretation is plausible, stop and ask for human clarification.
9. Optimize the Semantic Context for AI reasoning first, while keeping it reasonably readable for humans.
10. Treat human feedback as the final validator of semantic correctness.

## Current repository priorities

- refine the concept and terminology
- define the structure of the Semantic Context
- define the workflow for agent-driven semantic maintenance
- build a demo project to validate the idea
- explore reverse engineering of legacy systems into a Semantic Context

## Working principle

If implementation reveals meaning that was not previously captured, the Semantic Context must be updated.
