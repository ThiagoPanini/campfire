<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->

---
name: campfire
description: A pure-neutral, geometric-sans, restraint-first product surface — Linear/Vercel precision applied to a personal shelf.
---

# Design System: campfire

## 1. Overview

**Creative North Star: "The Personal Shelf"**

campfire is a personal index of songs. The surface around that index disappears: a pure-neutral canvas, a single geometric sans carrying every line, one quiet accent reserved for the moments that matter. The product reads as *considered* on first glance and *committed* on second — the kind of precision Linear and Vercel apply to dev tools, applied here to a casual musician's private collection.

What this system is not: it is not warm by chroma, not editorial by typography, not corporate by palette, not playful by ornament. The name "campfire" earns its warmth through ownership and tone, never through firelight gradients, amber glows, wood textures, or cozy-cabin imagery. The surface is precise; the warmth is relational.

**Key Characteristics:**

- Pure-neutral canvas (chroma 0). The neutrals don't take a side.
- One geometric sans across display, body, and label. Hierarchy from scale and weight, not from typeface contrast.
- One reserved accent, used on ≤10% of any given screen. Shade deferred until implementation.
- Restrained motion: state changes only — no entrances, no scroll choreography.
- Flat by default. Depth comes from tonal layering of the pure-neutral scale, not from shadows.
- The content (the user's repertoire) dominates; the chrome recedes as the list grows.

## 2. Colors

A monochrome pure-neutral system with a single accent in reserve. The accent shade is intentionally deferred — locked at implementation, not seeded here — to keep the strategic decision from being made by reflex.

### Primary

- **Accent — shade TBD** (`[to be resolved during implementation]`): the single point of color in the system. Reserved for active state, focus, the one moment per screen that needs to land. Used on ≤10% of any given screen. Never used as a surface fill, never as a CTA-of-CTAs.

### Neutral

- **Canvas — Pure Neutral Deep** (`[to be resolved during implementation]`): the page background. Pure neutral (chroma 0), deep but not pitch — closer to oklch(14% 0 0) than to #000.
- **Surface — Pure Neutral Lift 1** (`[to be resolved during implementation]`): one tonal step above canvas. Card backgrounds, secondary buttons, input fields.
- **Surface — Pure Neutral Lift 2** (`[to be resolved during implementation]`): two tonal steps above canvas. Featured cards, selected states, menu surfaces.
- **Ink — Pure Neutral High** (`[to be resolved during implementation]`): primary text. Near-white pure neutral, not literal `#fff`.
- **Ink Muted — Pure Neutral Mid** (`[to be resolved during implementation]`): secondary text. Metadata, helper copy, deselected states.
- **Ink Dim — Pure Neutral Low** (`[to be resolved during implementation]`): tertiary text. Eyebrows, captions, timestamps.
- **Hairline — Pure Neutral Boundary** (`[to be resolved during implementation]`): 1px borders and dividers. Visible but quiet.

Light-mode counterparts of every neutral are deferred until the dark/light decision is made at implementation; the scene that forces dark-vs-light has not been written yet.

### Named Rules

**The Ten Percent Rule.** The accent appears on no more than ten percent of any given screen. The accent's rarity is what makes it land. Two visible accent points in the same viewport is the upper bound; three is broken.

**The Zero-Chroma Rule.** Neutrals carry no hue. Chroma 0 across canvas, surface, ink. The current implementation's warm cast (chroma toward hue 60) is the wrong direction and must be replaced — warmth is emotional, not chromatic.

**The No-Pure-Black, No-Pure-White Rule.** Never `#000`, never `#fff`. The canvas sits in the oklch(12–16%) band; ink sits in the oklch(95–97%) band. Pure black and pure white look harsh and unconsidered.

## 3. Typography

**Display Font:** a single precise geometric sans `[font to be chosen at implementation]` — Inter Variable, Geist, Söhne, or GT America are the candidates. One family, not a pairing.
**Body Font:** the same family at smaller sizes and lower weights.
**Label/Mono Font:** none by default. Mono is not the system's voice; if introduced later, it is only for data markers (timestamps, IDs) and never as decoration.

**Character:** one geometric sans, used with discipline. Hierarchy comes from scale and weight contrast (≥1.25 ratio between steps), never from typeface switching. Letter-spacing pulls slightly negative on display sizes (-1% to -2.5%), holds at 0 on body, opens to +6% to +10% on uppercase labels.

### Hierarchy

- **Display** (weight 500–600, clamp(40px, 6vw, 56px), line-height 1.05, letter-spacing -2%): page-level headlines. Used sparingly — one per screen.
- **Headline** (weight 500, 24–28px, line-height 1.15, letter-spacing -1%): section openers, dialog titles.
- **Title** (weight 500, 18–20px, line-height 1.25, letter-spacing -0.5%): card titles, list-item titles.
- **Body** (weight 400, 15–16px, line-height 1.5, letter-spacing 0): default reading text. Max line length 65–75ch.
- **Label** (weight 500, 11–12px, line-height 1.2, letter-spacing +6% to +8%, uppercase): metadata, eyebrows, table headers. Used to mark — not to decorate.

### Named Rules

**The One Family Rule.** Display through label, one geometric sans. Mixing a serif display or a mono body breaks the system's voice.

**The Tracked Caps Earn Their Place Rule.** Uppercase tracked labels are allowed only on genuine meta-text (timestamps, counts, table headers). They are not a decorative move; they are a category marker. If a label could be sentence-case without losing meaning, it must be sentence-case.

## 4. Elevation

Flat by default. Depth comes from tonal layering of the pure-neutral scale (canvas → surface-1 → surface-2), not from shadows. The restrained-motion brief and the quiet-polish principle both point the same way: a surface that doesn't need ambient drop-shadows to feel real.

A single small shadow vocabulary exists only for floating surfaces that genuinely lift off the canvas (menus, dialogs), and for the focus ring — never as ambient decoration.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Hover and focus may introduce a quiet tonal shift (surface → surface-hover), never a shadow lift. Shadows appear only on detached surfaces (menus, dialogs, toasts) where physical separation from the page is the point.

**The Tonal Steps Carry Hierarchy Rule.** Three neutral surfaces (canvas / surface-1 / surface-2) is the entire elevation system. A fourth tonal step is a sign the system is being stretched the wrong way — find the right step or rework the layout.

## 5. Components

Deferred. No component tokens are seeded; the current frontend (`apps/web`) is a placeholder being redirected away from its terminal-native first draft. Real button, input, list-row, dialog, and navigation tokens will be captured when the system is re-implemented to match this brief. Re-run `/impeccable document` then.

## 6. Do's and Don'ts

### Do

- **Do** keep neutrals at chroma 0. The pure-neutral cast is the system's anchor.
- **Do** reserve the accent for the single most important state on a screen (active, focused, selected) and use it on ≤10% of pixels.
- **Do** carry one geometric sans family across the whole interface, with hierarchy from scale and weight contrast (≥1.25 ratio).
- **Do** use tonal lift (canvas → surface-1 → surface-2) to mark hierarchy. Three steps is the system.
- **Do** keep motion to state changes only — hover, focus, open/close. Ease out with exponential curves; no bounce, no elastic.
- **Do** honor `prefers-reduced-motion` — any motion that exists at all must degrade gracefully.
- **Do** let the content (the user's repertoire) dominate the surface as the list fills up. The chrome should recede.

### Don't

- **Don't** look like big-tech corporate: no navy-and-gradient palettes, no hero-metric templates (huge number + small label + supporting stat row), no illustration-heavy marketing chrome. Apple/Microsoft/Salesforce center-of-gravity is prohibited.
- **Don't** look like influencer-wellness or tasteful-DTC: no sage-cream-bone palettes, no serif logo over hands-photo, no soft-pink CTAs. The "tasteful" lane is now generic and is refused.
- **Don't** ship soft-SaaS defaults: no gray-50 backgrounds, no blue-500 buttons, no rounded-lg-everywhere, no generic shadcn-styled forms. This is the first reflex when generating "a modern web app" and is exactly what campfire rejects.
- **Don't** translate "campfire" literally: no firelight gradients, no amber or orange glow as decoration, no wood textures, no camping-gear iconography, no cozy-cabin photography. The name informs the feeling, not the visual language.
- **Don't** wear pro-tool affectations as costume: no command palettes for decoration, no terminal styling used for swagger, no keyboard-shortcut overlays as a credibility move. Precision is a tone earned by clarity, not a costume borrowed for authority.
- **Don't** use the hero-metric template. "0 songs in your repertoire" set in 96px with a stat row is the SaaS empty-state cliché and is banned.
- **Don't** answer interaction problems with a modal by default. Exhaust inline and progressive alternatives first.
- **Don't** use side-stripe borders (a coloured `border-left` or `border-right` > 1px) as accents. Rewrite the element.
- **Don't** use gradient text (`background-clip: text` on a gradient). Emphasis comes from weight and size, not from chroma painted onto type.
- **Don't** use glassmorphism as default. Backdrop blurs are rare and purposeful, or absent.
- **Don't** use `#000` or `#fff`. Every neutral lives in the oklch interior.
- **Don't** use em dashes in UI copy. Commas, colons, semicolons, periods, or parentheses do the work.
- **Don't** add a second accent. The palette is pure-neutral plus one. A "secondary accent" is the brand losing its nerve.
