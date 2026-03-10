---
name: cognira-engine-guardrails
description: Protect Cognira's cognitive engine and adjacent immutable contracts. Use when working near session logic, counters, readiness, repetition, progress, BFF routes, storage, topics, or central types to avoid accidental product-model regressions.
---

# Cognira Engine Guardrails

Use this skill whenever a task touches session flow or any file near the cognitive core.

## Protected areas

Do not change without explicit permission:

- cognitive engine logic
- readiness formula
- spaced repetition behavior
- question selection logic
- BFF or API route behavior
- persistence model and migration logic
- `lib/topics.ts`
- `lib/types.ts`

## Default assumption

If the user reports a problem in counters, layout, labels, or visual flow, assume the engine is correct until proven otherwise.

## Required behavior

- Distinguish session from block.
- Distinguish main block from reinforcement block.
- Treat reinforcement as independent context, not continuation.
- Keep visual counters aligned with cognitive context, not implementation shortcuts.

## Safe scope examples

- progress bar presentation
- copy and labels
- visual grouping
- state organization in the UI layer only
- responsive layout changes

## Escalate before touching protected code

If a fix appears to require changes in protected areas, stop and state exactly:

- what file would need to change
- why the UI-only path is insufficient
- what behavioral contract would be affected
