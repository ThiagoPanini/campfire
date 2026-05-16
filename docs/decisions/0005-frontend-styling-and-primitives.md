# 0005 — Frontend styling and component primitives

- **Status**: Accepted
- **Date**: 2026-05-15
- **Supersedes (in part)**: the "Workshop" design framing referenced by [ADR 0004](./0004-frontend-stack.md). The React + TypeScript + Vite stack decision in ADR 0004 stands unchanged.

## Context

[ADR 0004](./0004-frontend-stack.md) chose React + TypeScript + Vite for `apps/web` and anchored the design direction to a "Workshop" handoff: warm-dark, monospace-forward, monochrome.

That design direction has been replaced. On 2026-05-15, [PRODUCT.md](../../PRODUCT.md) and [DESIGN.md](../../DESIGN.md) were produced via the `impeccable` skill and establish a different brief:

- **Register**: `product`. Personality: *considered, committed, personal*. Voice in the lane of Linear and Vercel.
- **Visual system**: pure-neutral canvas (chroma 0), one geometric sans family across all sizes, restrained color (≤10% accent, shade deferred), flat-by-default elevation, restrained motion.
- **Explicit anti-references** include "soft-SaaS defaults" (gray-50, blue-500, rounded-lg, generic shadcn-styled forms) and pro-tool affectations worn as costume.

The current `apps/web/src/styles.css` and component code implement the prior Workshop direction (warm-cast neutrals, mono-forward typography, code-as-copy). They will be replaced — this ADR records the styling and primitives strategy the replacement will follow.

The framework call (Vite + React + TS) from ADR 0004 remains the right answer for an auth-gated MVP without SSR or SEO needs.

## Decision

Three additions on top of ADR 0004:

1. **Styling: vanilla CSS + CSS custom properties.** DESIGN.md tokens become `:root` custom properties. Each component owns a hand-tuned stylesheet that references those variables. No utility-class framework (Tailwind), no CSS-in-JS runtime, no pre-built component library defaults.

2. **Component primitives: Radix UI (headless).** Behavior layer — dialogs, dropdowns, popovers, select, tooltip, focus management, ARIA — comes from `@radix-ui/react-*` packages. Visual layer is 100% hand-written per DESIGN.md. `shadcn/ui` is explicitly rejected: its pre-styled defaults are the soft-SaaS aesthetic DESIGN.md prohibits.

3. **TypeScript: strict mode.** `"strict": true` in `tsconfig.json`. The `any` escape hatch is tolerated only where a third-party type genuinely fails.

No router, no state-management library, no data-fetching library, no form library is introduced yet. Each becomes a follow-up ADR once concrete, repeated friction justifies it (rule of three).

## Consequences

**Positive**:

- DESIGN.md is the source of truth for tokens; `:root` custom properties are the runtime form; components reference them by variable name. No translation layer drifts the system off-brand.
- Accessibility budget is spent on Radix's correctness rather than handrolled focus traps and ARIA. The pragmatic WCAG 2.2 AA target stated in PRODUCT.md is reachable for a solo developer.
- The styling layer is small enough to read in one place when needed. No utility-class explosion, no build-time CSS-in-JS overhead, no pre-built component theme to override and re-override.
- Aligned with DESIGN.md's *"one committed point of view"* and its explicit anti-references against soft-SaaS defaults.

**Negative**:

- Slower to scaffold than Tailwind + shadcn. The first MVP screens take longer to land.
- Every component is a custom write. There is no marketplace of styled blocks to lift wholesale.
- Visual consistency is maintained by the author until the design system in DESIGN.md is fleshed out from real implementation (next `/impeccable document` scan pass).

**Operational**:

- The current `apps/web/src/styles.css` and existing components will be replaced, not refactored. The gap from the Workshop direction to the new brief is too wide for incremental edits. The replacement happens during the first `/impeccable craft` pass on a real screen.

## Deferred

- Routing library (React Router, TanStack Router, or hand-rolled until friction justifies). Decide before the second screen ships.
- Data-fetching / server-state library (TanStack Query is the obvious candidate). Decide when FastAPI integration begins.
- Form library (React Hook Form, native, or hand-rolled). Likely revisited when the auth screen is shaped.
- Icon set (Lucide React, hand-drawn 1.5-stroke set, or other). Resolved when a screen first needs an icon.
- Specific geometric sans typeface (Inter, Geist, Söhne, GT America). Resolved at first `/impeccable craft`.
- Accent shade. Same.
- Dark vs light mode default. Same — DESIGN.md notes the scene-forcing sentence has not yet been written.
