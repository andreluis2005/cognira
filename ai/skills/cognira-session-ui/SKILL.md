---
name: cognira-session-ui
description: Build or refine the Cognira study-session interface with strong UX while preserving the engine contract. Use when editing session screens, progress indicators, feedback layout, mobile/desktop behavior, or visual state transitions.
---

# Cognira Session UI

Use this skill for learner-facing session experience work.

## Primary objective

Make the study session feel calm, clear, and cognitively aligned.

## Non-negotiables

- Do not alter engine behavior.
- Do not merge main and reinforcement contexts into one visual counter.
- Keep the primary action obvious at all times.
- Preserve fast mobile use and comfortable desktop review.

## UI priorities

1. question comprehension
2. answer selection confidence
3. feedback readability
4. block context clarity
5. frictionless next-step action

## Design guidance

- Show one dominant action per step.
- Keep progress visible but secondary to the question.
- Use labels that explain context in learner language.
- Separate feedback state from answering state visually.
- Reduce scroll on desktop when feedback is open.

## Implementation guidance

- Prefer derived UI variables over duplicated mutable state.
- Keep visual counters explicit: current item, total items, current block type.
- Use conditional rendering to reflect cognitive phase clearly.
- If state becomes hard to reason about, refactor component structure before introducing new business logic.
