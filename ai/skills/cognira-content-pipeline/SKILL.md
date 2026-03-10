---
name: cognira-content-pipeline
description: Design content ingestion and AI-assisted question generation workflows for Cognira. Use when defining how creators add questions, how AI drafts are reviewed, and how question metadata should support the cognitive engine and marketplace quality.
---

# Cognira Content Pipeline

Use this skill for creator workflows and AI-assisted content generation.

## Content sources

Support both:

- manual authoring
- AI-generated drafts

## Default publishing workflow

1. creator defines program and topic scope
2. creator adds source material or prompt
3. IA generates draft questions
4. creator reviews and edits
5. system validates structure and metadata
6. creator publishes

## Required question payload

Each generated or imported question should have:

- prompt
- options
- correct answer
- explanation
- topic
- difficulty
- tags
- source or provenance when available

## Quality guardrails

- Prefer review-before-publish for marketplace content.
- Flag low-diversity or repetitive drafts.
- Avoid publishing without explanation text.
- Preserve topic granularity that the engine can consume later.

## Product lens

Optimize the pipeline for speed without sacrificing trust.

Bad outcome:

- large volumes of low-quality generated questions

Good outcome:

- fast draft creation plus human curation
