# Campfire Agent Instructions

Campfire is a greenfield music hub for groups of friends who meet for amateur jam sessions. Keep the repository easy for a solo maintainer and AI agents to navigate.

## Context Rules
- Prefer targeted retrieval before broad file reads.
- Use Serena MCP for symbol-aware navigation, references, and edits once source code exists.
- Use `rg` for text search and `rg --files` for file discovery.
- Prefix shell commands with `rtk` to reduce terminal-output tokens.
- Keep always-loaded instructions short; put detailed guidance in focused docs or skills.

## Project Direction
- Spec-Kit drives feature specification, planning, and implementation tasks.
- Backend design should follow Clean Architecture, Hexagonal Architecture, and DDD where it earns its keep.
- Infrastructure should be AWS-native and managed with Terraform.
- Documentation should use Mintlify.
- AI assets belong in clear, versioned locations: specs, prompts, skills, MCP config, and agent instructions.

## Agent Workflow
- Before implementing, inspect the relevant spec/plan/task artifacts if they exist.
- Before editing existing code, use Serena or focused search to find the local pattern first.
- Do not dump whole directories or generated artifacts into context when a narrow lookup will do.
- Preserve user changes and avoid unrelated refactors.
- Record durable project decisions in a focused doc instead of repeating them in chat.
- Frontend implementation should follow `DESIGN.md` and the `frontend-design` skill when relevant.
- Python backend implementation should follow `python-code-style` and `python-design-patterns`.
- Terraform implementation should follow `terraform-style-guide`.

## Current State
- This repository is still early-stage. If a referenced Spec-Kit plan file does not exist yet, proceed from the available spec, prompt, or repository instructions instead of searching repeatedly.

<!-- SPECKIT START -->
Active Spec-Kit plan: `specs/003-refactor-auth-preferences/plan.md`
<!-- SPECKIT END -->
