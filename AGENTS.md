# Agent Skills (OpenCode)

This project uses the addyosmani/agent-skills pack installed under `.opencode/skills/` (25 skills), shared checklists under `.opencode/references/`, and lifecycle slash commands under `.opencode/commands/`.

## Core Rules

- If a task matches a skill, invoke it with the `skill` tool before acting.
- Skills are located in `.opencode/skills/<skill-name>/SKILL.md`.
- Follow the skill workflow strictly; do not partially apply it.
- Never skip required steps such as spec, plan, or test when a skill demands them.
- Skills may reference shared checklists at `.opencode/references/*.md`.

## Intent to Skill Mapping

Map the user's intent to the matching skill automatically:

- Underspecified ask / clarify intent → `interview-me` (one question at a time)
- Raw idea needs shaping → `idea-refine`
- Feature / new functionality / significant change → `spec-driven-development`, then `planning-and-task-breakdown`, `incremental-implementation`, and `test-driven-development`
- Quality bar / standards → `constraint-driven-development`
- Bug / failure / unexpected behavior → `debugging-and-error-recovery`
- Code review → `code-review-and-quality`
- Refactoring / simplification → `code-simplification`
- API or interface design → `api-and-interface-design`
- UI work → `frontend-ui-engineering`
- Security-relevant code (input, auth, data, integrations) → `security-and-hardening`
- Performance concerns → `performance-optimization` (measure first)
- Architectural decisions / why-documentation → `documentation-and-adrs`
- Deploying → `shipping-and-launch` (+ `ci-cd-and-automation` for pipelines)

## Current Project State

- The user has a rough PRD already processed through `interview-me`; new project setup starts from `spec-driven-development` (Phase 1: Specify), not from scratch.

## Execution Model

For every request:

1. Determine if any skill applies (even a small chance).
2. Load the skill with the skill tool.
3. Follow the skill workflow exactly.
4. Only proceed to implementation once required gates are approved.
