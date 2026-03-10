---
name: cognira-technical-architecture
description: Plan Cognira as a scalable product platform while respecting the protected cognitive core. Use when defining modules, boundaries, data models, roadmap architecture, or implementation sequencing across learner, creator, marketplace, and sponsor systems.
---

# Cognira Technical Architecture

Use this skill for platform-level design and implementation planning.

## Core modules

- Cognitive Core
- Learning App
- Creator Studio
- Marketplace
- Sponsor Layer
- Identity and Billing

## Boundary rules

- Keep the cognitive core isolated.
- Keep UI concerns outside core logic.
- Keep creator workflows separate from learner runtime.
- Keep marketplace concerns separate from session execution.

## Default sequencing

1. stabilize learner session UX
2. define content model and authoring flow
3. add authentication and ownership
4. add publishing and catalog
5. add monetization
6. add sponsor layer

## Data model direction

Anchor the platform on:

- user
- program
- trail
- topic
- question
- enrollment
- session
- progress
- review
- purchase
- creator profile

## Decision rule

If a proposal increases coupling with the cognitive core, prefer a boundary-preserving alternative first.
