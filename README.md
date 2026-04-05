# Semantic Context Development

**Semantic Context is the source. Code is the compiled artifact.**

This repository explores **Semantic Context Development (SCD)**, a software development method in which the primary source of truth for a system is not code, but a living **Semantic Context** maintained through AI-assisted development.

In SCD, code is treated as a compiled artifact generated from semantic intent. The Semantic Context is expected to preserve business meaning, flows, invariants, compatibility-relevant structures, and the behaviors that the system is expected to satisfy in tests.

For the core principles and rationale, see the [SCD manifesto](./SCD-manifesto.md).

## What this repository contains

This repository contains the **method**, not just a production project built with it.

It currently includes:

- the SCD concept and manifesto
- the base agent operating standard in `AGENTS.md.tmpl`, derived from the SCD manifesto
- a demo project showing the method in use
- the demo interaction history
- a regenerated version of the demo recreated from Semantic Context
- ongoing notes and experiments around the method

## How to use SCD in a project

The `AGENTS.md.tmpl` file in this repository was generated from the SCD manifesto and expresses the method as an operational agent standard.

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

## Demo status

A demo project has already been created and used to exercise the method.

The demo includes:

- a real `semantic-context/` created and evolved through AI-assisted development
- a `history/` area preserving the interaction trail used during the demo
- business-rule questions answered from Semantic Context rather than code
- semantically invalid change attempts being detected before implementation

## Demo experience

The demo was used as a practical exercise of the method rather than as a hand-crafted example.

In broad terms, the process was:

- start from a short natural-language prompt describing the project
- let the agent ask clarifying questions and build the Semantic Context incrementally
- implement a small set of user stories
- intentionally send invalid or conflicting stories to verify that semantic validation happened before implementation
- evolve the UI/UX while keeping business behavior aligned with the Semantic Context
- ask multiple business-rule questions to verify that the agent could answer from the Semantic Context rather than from implementation details
- regenerate the application in a fresh project using only the demo Semantic Context

The first implementation was created in Python. After that, the Semantic Context from the demo was copied into a new project directory, and the application was regenerated in Node.js from just one prompt, without reusing the original codebase.

## Important distinction

In an adopting project:

- `semantic-context/` is the **canonical semantic memory**
- `history/` is **non-canonical raw history**
- implementation code is a **compiled artifact generated from Semantic Context**

## Status

Research / prototype.
