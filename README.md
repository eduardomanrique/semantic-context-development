# Semantic Context Development

**Code is implementation. Semantic Context is truth.**

This repository explores **Semantic Context Development (SCD)**, a software development method in which the primary source of truth for a system is not code, but a living **Semantic Context** maintained through AI-assisted development.

In SCD, code is treated as a compiled artifact of semantic intent. The Semantic Context is expected to preserve business meaning, flows, invariants, compatibility-relevant structures, and the behaviors that the system is expected to satisfy in tests.

For the core principles and rationale, see the [SCD manifesto](./SCD-manifesto.md).

## What this repository contains

This repository contains the **method**, not only a production project built with it.

It currently includes:

- the SCD concept and manifesto
- the base agent operating standard in `AGENTS.md.tmpl`
- a demo project showing the method in use
- the demo interaction history
- a regenerated version of the demo recreated from Semantic Context
- ongoing notes and experiments around the method

## Demo status

A demo project has already been created and used to exercise the method.

The demo includes:

- a real `semantic-context/` created and evolved through AI-assisted development
- a `history/` area preserving the interaction trail used during the demo
- business-rule questions answered from Semantic Context rather than code
- semantically invalid change attempts being detected before implementation

This repository also includes a regenerated version of the demo in which only the Semantic Context was copied into a fresh project and the application was regenerated from it with a prompt, without reusing the original implementation code.

## How to use SCD in a project

To use SCD in a real project:

1. Copy `AGENTS.md.tmpl` into your target project as `AGENTS.md`.
2. Start working with an AI coding agent such as Codex or Claude Code inside that target repository.
3. Let the agent create and maintain the required SCD project structure inside the target project, including:
   - `semantic-context/` as the canonical semantic memory
   - `history/` as raw interaction history for audit and reference
4. Use the agent normally for feature work, but expect it to:
   - validate semantic conflicts before implementing
   - update the Semantic Context as the project evolves
   - keep required test behavior traceable to the Semantic Context
   - treat code as a derived artifact rather than the primary source of truth

## Important distinction

In an adopting project:

- `semantic-context/` is the **canonical semantic memory**
- `history/` is **non-canonical raw history**
- implementation code is a **compiled artifact of Semantic Context**

## Status

Research / prototype.
