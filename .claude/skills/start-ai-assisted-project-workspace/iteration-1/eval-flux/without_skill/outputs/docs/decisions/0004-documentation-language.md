# 4. Documentation language: English

Date: 2026-05-11

## Status

Accepted

## Context

flux's maintainer is bilingual. Documentation, commit messages, and code identifiers could be written in either Portuguese or English. Mixing them — which is the easy default — produces a codebase that is harder to search, harder to onboard into, and visually noisy.

## Decision

English everywhere: documentation, commit messages, code identifiers, comments, ADRs.

User-facing strings in the eventual frontend may be localized later; that is a product decision, not an engineering one, and is out of scope here.

## Consequences

- One language to grep, one language to read.
- A future contributor (human or AI) does not need to switch context mid-file.
- The maintainer writes slightly slower in some places. Acceptable.
