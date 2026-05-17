# 0005 — UI language

- **Status**: Accepted
- **Date**: 2026-05-16

## Context

[ADR 0002](./0002-documentation-language.md) committed all persisted artifacts (docs, commits, code identifiers, comments, config) to English. It is silent on the **user-facing UI language** — the copy a real person reads inside the rendered product (button labels, form fields, headlines, error messages, microcopy).

That silence was tolerable while only the landing-page slice existed. The landing happens to ship Portuguese (`<html lang="pt-BR">`, `entrar`, `criar conta`, the meta description), but [docs/mvp-scope.md](../mvp-scope.md) implicitly assumed an English UI baseline (the "Internationalization beyond English UI" out-of-scope item, since removed by this ADR). The sign-up flow is the first non-landing surface; the decision can no longer be deferred.

The product is, by design ([PRODUCT_VISION.md](../../PRODUCT_VISION.md)), an instrument for amateur musicians who play with friends. The MVP target audience is the author plus one trusted friend; both are Brazilian Portuguese speakers. Beyond the MVP, growth is via friend graphs, not virality; the realistic next ring of users is also Portuguese-speaking. The product's brand voice ([PRODUCT.md](../../PRODUCT.md)) is *warm, nostalgic, intimate* — a register that Brazilian Portuguese carries more naturally than the lowercase English variant the lo-fi aesthetic would otherwise enforce.

## Decision

The user-facing UI ships in **Brazilian Portuguese (PT-BR)** for the foreseeable future. This is a UI language decision, not a documentation language decision; [ADR 0002](./0002-documentation-language.md) continues to govern persisted artifacts.

Concretely:

- All rendered copy (labels, buttons, form fields, headlines, microcopy, error messages, empty states, system meta) is written in PT-BR.
- `<html lang="pt-BR">` remains the document language declaration.
- Meta descriptions, page titles, and any structured data exposed to crawlers are PT-BR.
- Code identifiers, component names, prop names, route names (`/signup`, not `/cadastro`), and file names remain English per [ADR 0002](./0002-documentation-language.md). The split is principled: code is read by developers (English ecosystem), UI is read by users (Brazilian musicians).
- User-generated content (song titles, artist names) is whatever the user types. The product does not enforce a language on user content.

No internationalization framework is introduced yet. Copy lives inline in components. A second UI language is post-MVP and would require its own ADR.

## Consequences

**Positive**:

- The UI voice can lean fully into the *warm, nostalgic, intimate* brand personality without translation friction.
- The author writes user-facing copy in their native language; the brand voice gets first-class authorship.
- Decision is reversible at low cost (the codebase has no copy yet beyond the landing slice).
- The split with [ADR 0002](./0002-documentation-language.md) is clean: developer-facing surfaces stay English, user-facing surfaces are PT-BR.

**Negative**:

- Locks the realistic addressable user base to Portuguese speakers until a translation effort happens.
- Mixed-language workflow: the developer writes UI copy in PT-BR while writing everything else in English. This is the explicit trade-off, not an oversight.
- Future contributors who don't read Portuguese will need help understanding live copy. (Mitigated: PT-BR is the world's 6th-largest language by speakers; AI assistants translate inline trivially.)

## Deferred

- **Internationalization beyond PT-BR.** Adding a second UI language. Revisit when there is evidence of non-Portuguese-speaking users joining via the friend graph.
- **Translation tooling choice.** i18n library (react-intl, react-i18next, lingui, FormatJS) deferred until the second language is on the table. Inline strings are sufficient for one language.
- **Locale-aware formatting** (dates, numbers, currency). PT-BR conventions are applied directly where needed; no formatter abstraction yet.
