---
name: campfire
description: A personal repertoire shelf for amateur musicians — VHS-warm, intimate, lo-fi by design.
colors:
  dead-channel: "#000000"
  channel-elev: "#050505"
  ink: "#ece8df"
  ink-muted: "#ece8dfa3"
  hairline: "#ece8df21"
  hairline-strong: "#ece8df38"
  tracking-red: "#cc3344"
  crt-chroma: "#46d4d0"
typography:
  display:
    fontFamily: "Share Tech Mono, Courier New, ui-monospace, monospace"
    fontSize: "clamp(2rem, 4.65vw, 4.8rem)"
    fontWeight: 400
    lineHeight: "1.04"
    letterSpacing: "-0.015em"
  brand:
    fontFamily: "Share Tech Mono, Courier New, ui-monospace, monospace"
    fontSize: "clamp(0.94rem, 1.5vw, 1.25rem)"
    fontWeight: 400
    lineHeight: "1"
    letterSpacing: "0.13em"
  body:
    fontFamily: "VT323, Courier New, ui-monospace, monospace"
    fontSize: "clamp(1.04rem, 1.55vw, 1.3rem)"
    fontWeight: 400
    lineHeight: "1.5"
    letterSpacing: "0.035em"
  label:
    fontFamily: "Share Tech Mono, Courier New, ui-monospace, monospace"
    fontSize: "clamp(0.92rem, 1.24vw, 1.08rem)"
    fontWeight: 400
    lineHeight: "1"
    letterSpacing: "0.12em"
  caption:
    fontFamily: "Share Tech Mono, Courier New, ui-monospace, monospace"
    fontSize: "clamp(0.85rem, 1.1vw, 0.95rem)"
    fontWeight: 400
    lineHeight: "1"
    letterSpacing: "0.1em"
rounded:
  none: "0"
  sm: "0.25rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.dead-channel}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1.2rem"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.crt-chroma}"
    textColor: "{colors.dead-channel}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.none}"
    padding: "0.25rem 0"
    typography: "{typography.label}"
  button-ghost-hover:
    textColor: "{colors.ink}"
  surface-canvas:
    backgroundColor: "{colors.dead-channel}"
    textColor: "{colors.ink}"
  surface-elevated:
    backgroundColor: "{colors.channel-elev}"
    textColor: "{colors.ink}"
---

# Design System: campfire

## 1. Overview

**Creative North Star: "The 2am VHS Mixtape."**

A VHS tape someone made for you, watched alone at 2am — the tracking is a hair off, the chroma bleeds a little, the picture is dim but the gesture is loud. campfire's interface is built from that material. Mono type with the friction of an old typewriter ribbon. A warm-dark canvas the color of an off-air channel. Decorative CRT overlays — scanlines, halftone, grain, tracking glitch — that texture the hero but never touch the text. Two color punches (a tracking-error red, a chroma-cyan) used like signal interference: rare, deliberate, never decorative.

This system explicitly rejects four neighbors. It is not the saturated-gradient catalogue of a streaming service. It is not the dopamine-fed infinite feed of a public social network. It is not the gamified progress meter of a practice app. It is not the dense tech-blue chrome of a DAW. campfire owns the smallness of being a personal log; its visual language honors that, instead of padding it out.

The aesthetic is committed across both registers — the brand surfaces (landing, posters, marketing) and the product surfaces (sign-in, repertoire, eventually jams). Decorative overlays stay on hero surfaces. Forms, lists, and dense data drop the overlays but keep the canvas, the mono type, and the spare hairline-driven layout.

**Key Characteristics:**

- **VHS-warm dark canvas** — off-air black with warm-cream ink, never cool blue.
- **Mono everywhere** — Share Tech Mono for display and labels, VT323 for body. No proportional type.
- **Two-accent restraint** — tracking-error red and CRT chroma cyan, ≤10% of any screen.
- **Flat by default** — zero drop shadows. Depth comes from atmosphere (overlays, vignettes), not from elevation.
- **Hairline-driven layout** — 1px dividers at low opacity carry structure where other systems would use cards.
- **Decorative ≠ functional** — CRT overlays are `aria-hidden` and never overlap text or focus rings.

The current implementation also carries four exploratory font-set variants under `.poster[data-fonts="a|b|c|d"]` (Special Elite + Newsreader, Space Mono + IBM Plex Mono, Fraunces + JetBrains Mono, Major Mono Display + IBM Plex Mono). These are unused in the rendered markup and should be pruned now that this DESIGN.md commits to Share Tech Mono + VT323 as the canon.

## 2. Colors: The Off-Air Palette

A warm-dark canvas, a cream-ink foreground, two saturated punches borrowed from VHS hardware. Every color is hue-tinted toward warmth; nothing is neutral-cool. The accents (red and cyan) appear together by accident of being analog-video twins, never as a paired decorative scheme.

### Primary

- **Tracking Error Red** (`#cc3344` ≈ `oklch(55% 0.16 22)`): the red of a tape tracking-error band, slightly desaturated, brick-leaning. Used as a hairline-rare accent — never as a fill, never as a button color. Appears in the diagonal interference stripe inside the band frame and as the underline-on-hover sibling for cyan.
- **CRT Chroma** (`#46d4d0` ≈ `oklch(78% 0.11 188)`): the cyan of a CRT phosphor edge, muted and slightly green. Used as the primary button hover background and as the link underline-on-hover. The single "go" color in the system.

### Neutral

- **Aged Manual Ivory** (`#ece8df` ≈ `oklch(91% 0.012 78)`): warm cream, the color of a sun-aged instruction manual. The ink color across all surfaces. Also the primary button fill at rest.
- **Aged Manual Ivory (Muted)** (`#ece8dfa3`, 64% opacity over the canvas): the secondary text color — link defaults, footer copy, hover-eligible labels at rest.
- **Hairline** (`#ece8df21`, 13% opacity): borders and dividers. The default structural rule of the system.
- **Hairline Strong** (`#ece8df38`, 22% opacity): emphasized borders — frame edges around the hero band, decorative diagonal accents.
- **Dead Channel Black** (`#000000`): the canvas. The off-air black of a TV that lost signal.
- **Channel Elev** (`#050505`): barely-lifted black for the nav bar and footer surfaces — distinguished by gradient, not by tone alone.

### Named Rules

**The Interference Rule.** The red and the cyan are never used together as a paired scheme. They appear in the same scanline overlay because real VHS chroma error does that, but no UI surface should pair them deliberately as "red + cyan brand". One signal at a time.

**The Off-Air Rule.** The canvas is currently `#000000`. The shared design laws forbid pure black; the current state is a known compromise carried from the landing's cinematic poster. Future iterations should tint warm toward `oklch(10% 0.006 22)` — closer to dead-channel-black-but-alive — without changing the visual experience materially.

**The 10% Accent Rule.** Tracking-Error Red and CRT Chroma together must never exceed 10% of any screen's painted area. They are signal, not decoration. A button that's cyan on hover is fine. A page that's cyan on top of cyan is not.

## 3. Typography

**Display Font:** Share Tech Mono (with Courier New, ui-monospace, monospace fallbacks)
**Body Font:** VT323 (with Courier New, ui-monospace, monospace fallbacks)
**Label/Caption Font:** Share Tech Mono (same family as display, used at smaller sizes with wide letter-spacing)

**Character:** Share Tech Mono is a CRT-tube monospace — tall x-height, sharp terminals, faintly technical. VT323 is the warmer twin — a single-weight pixel-inspired mono that reads softer at body sizes. The pairing reads as "two pieces of equipment from the same shelf": one for the headlines and stamps, one for the read-through. Both lowercase by default; uppercase only via `text-transform: lowercase` even when capital glyphs exist in the source — the lowercase posture is part of the voice.

### Hierarchy

- **Display** (400, `clamp(2rem, 4.65vw, 4.8rem)`, line-height 1.04, letter-spacing -0.015em): hero headlines on landing, large standalone titles. Currently defined but not rendered — apply when the landing copy lands.
- **Brand** (400, `clamp(0.94rem, 1.5vw, 1.25rem)`, line-height 1, letter-spacing 0.13em): the wordmark in the nav. Lowercase, locked, user-select disabled.
- **Body** (400, `clamp(1.04rem, 1.55vw, 1.3rem)`, line-height 1.5, letter-spacing 0.035em): standard reading copy. Cap line length at 60ch (currently 60ch on `.poster-copy`).
- **Label** (400, `clamp(0.92rem, 1.24vw, 1.08rem)`, line-height 1, letter-spacing 0.12em): nav links, button text, in-product field labels. Always lowercase.
- **Caption** (400, `clamp(0.85rem, 1.1vw, 0.95rem)`, line-height 1, letter-spacing 0.1em, 60% opacity): the small print — footers, system meta, timestamps.

### Named Rules

**The Lowercase Rule.** All UI text is lowercase. The brand is "campfire", not "Campfire". Buttons are "entrar" and "criar conta", not "Entrar". Even error messages and field labels. The lowercase is intimate; capitals are corporate. Exceptions: proper nouns inside user-generated content (song titles, artist names) must respect whatever case the user typed.

**The Mono-Only Rule.** No sans, no serif anywhere in the product or the marketing. The two mono families above are the entire system. If a future surface needs visual contrast, get it from size, weight (within what the family has), letter-spacing, or opacity — never by switching to a proportional face.

**The 60ch Rule.** Body text caps at 60ch (the current `.poster-copy` value). Wider lines read as documentation, not as a personal product. Tighten before broadening.

## 4. Elevation

campfire is flat. There are zero drop shadows, anywhere. Depth is created entirely through atmosphere: the layered CRT overlays inside hero surfaces, the warm-cream hairlines that draw structural lines at 13–22% opacity, the subtle gradient between dead-channel canvas and barely-lifted channel-elev surfaces. Where the system needs to suggest a contained volume — the hero band, for instance — it does so through an inset frame (`inset 0 0 5rem rgba(0,0,0,0.42)`) that reads as a vignette around a screen, not as a card lifting off a surface.

### Shadow Vocabulary

- **Inset Vignette** (`box-shadow: 0 0 0 1px rgba(0,0,0,0.52), inset 0 0 5rem rgba(0,0,0,0.42)`): the only "shadow" in the system, and it's an inset. Used to frame hero surfaces (the `.poster-band` content area) so the CRT overlay feels like it lives inside a screen.

### Named Rules

**The No-Lift Rule.** Components never lift on hover. State change is communicated by color (ink → crt-chroma background on primary buttons), opacity (muted → full on hover for ghost links), or by an underline that grows in (the cyan scaleX hover on `.poster-link::after`). Translate, scale, and lift are all prohibited as hover affordances. Lifting is a SaaS gesture; campfire is not a card.

**The Atmosphere-Over-Elevation Rule.** When a surface needs to feel distinct, reach for canvas-color shift (dead-channel → channel-elev) and a hairline border first. Reach for an inset frame second. Never reach for a drop shadow.

## 5. Components

### Buttons

- **Shape:** subtle radius (`0.25rem`) on the primary fill; ghost buttons are completely flat (no radius).
- **Primary (`button-primary`):** Aged Manual Ivory fill (`#ece8df`) on Dead Channel Black text. Padding `0.5rem 1.2rem`. Label typography (lowercase mono, letter-spacing 0.12em). Currently the "criar conta" CTA in the landing nav.
- **Primary hover:** background swaps to CRT Chroma (`#46d4d0`), text stays Dead Channel Black. Transition 160ms ease-out. No lift, no scale.
- **Primary focus-visible:** outline cyan, offset 4px (`outline: 1px solid #46d4d0; outline-offset: 4px`).
- **Ghost (`button-ghost`):** transparent fill, Aged Manual Ivory Muted text at rest. Label typography. Zero padding-x, `0.25rem` padding-y so the underline can sit beneath the text. Currently the "entrar" link in the landing nav, and the default for any nav-style link.
- **Ghost hover:** text brightens from `ink-muted` (64%) to `ink` (100%). A 1px CRT-Chroma underline grows in beneath the text, anchored right, via `transform: scaleX(0.36 → 1)` and `opacity: 0 → 0.82` over 180ms. The growing-underline is the signature interaction of the whole system; preserve it across new ghost link instances.
- **Ghost focus-visible:** ivory 1px outline, offset 7px (`outline: 1px solid #ece8df; outline-offset: 7px`). The unusually wide offset gives the focus ring room to read against the dim canvas.
- **Secondary modifier (`.poster-link--secondary`):** ghost link at 0.7 opacity multiplier on top of ink-muted — used to demote one of two paired CTAs (currently demotes "entrar" relative to "criar conta"). Apply when two adjacent ghost links need visual rank.

### Inputs / Fields (not yet built)

When implemented for the MVP repertoire form, follow these rules:
- **Style:** transparent fill, hairline (`#ece8df21`) bottom border only — not boxed. Field reads as a stamped line, not as a container.
- **Typography:** Body for the input text (VT323, 1.04–1.3rem clamp). Label above, in Label typography (Share Tech Mono lowercase with 0.12em letter-spacing).
- **Focus:** the bottom border thickens to 2px and shifts to CRT Chroma (`#46d4d0`). No focus glow. No background fill change.
- **Error:** label color shifts to Tracking Error Red (`#cc3344`) with a one-line note beneath the field in Caption typography. Border stays the same color but doubles in width.
- **Placeholder:** ink-muted (64%), italic-flavored only by font choice (the source families have no true italic).

### Cards / Containers

There are no cards in this system, by intent. The first instinct should always be: list items separated by hairlines, not boxed cards in a grid. If a card is unavoidable (an upcoming jam session preview, a song-detail surface), use:
- **Background:** Channel Elev (`#050505`), not a tinted gray. The card is a slightly elevated piece of the canvas, not a different material.
- **Border:** 1px Hairline Strong (`#ece8df38`).
- **Corner:** 0 (flat) or `0.25rem` (matched to the primary button). Never larger.
- **Internal padding:** `clamp(1rem, 2.5vw, 1.75rem)`.
- **Shadow:** prohibited. See *The No-Lift Rule*.

### Navigation

- **Style:** horizontal bar, brand wordmark left, action ghost links right. Bottom border 1px Hairline. Background gradient from Dead Channel Black to Channel Elev top-down.
- **Height:** `clamp(68px, 10svh, 96px)` — anchored to the viewport's small height unit so it stays proportional on mobile.
- **Brand:** lowercase, locked, `user-select: none`, Share Tech Mono 0.13em letter-spacing.
- **Actions:** typically two — one ghost link (demoted, the secondary), one primary fill button (the promoted action). See Button rules above.
- **Mobile:** wordmark shrinks to 0.86rem with 0.08em letter-spacing; primary button shrinks to 0.75rem with reduced padding. The two-action shape is preserved — campfire does not need a hamburger menu in the MVP.

### Hero Band (signature component)

The `.poster-band` block on the landing is a signature pattern worth preserving as a reusable surface for future hero contexts (marketing pages, empty states with personality, splash screens). The recipe:

- **Inside:** a full-bleed `<video>` (or static poster image fallback) covered by a stack of six `pointer-events: none` overlay layers, in order: darken (vignette gradients), halftone (radial dots over `mix-blend-mode: overlay`), scanlines (repeating linear gradients with subtle red/cyan ticks), tracking (animated red/cyan/ivory band stripes that step every 7s), grain (SVG fractal noise animated every 1.6s), vignette (final radial darken).
- **Frame:** an inner inset frame (`::before`) and a diagonal corner-stripe accent (`::after`) using Tracking Error Red and CRT Chroma at low opacity with `mix-blend-mode: screen`.
- **Motion:** the tracking and grain animations are essential — without them the surface reads as a static photo, not as a live CRT. Both `@media (prefers-reduced-motion: reduce)` to halted-still.
- **Accessibility:** the entire effect stack is `aria-hidden="true"` and the underlying `<video>` is muted, autoplay, loop, `playsInline`. None of the texture is communicated to assistive tech; the surface around it carries the meaning.

## 6. Do's and Don'ts

### Do

- **Do** use Aged Manual Ivory (`#ece8df`) as the only text color at full opacity. Demote to `ink-muted` (`#ece8dfa3`, 64%) for non-primary copy.
- **Do** use the growing-cyan underline as the canonical hover affordance for any ghost link — it is the system's signature interaction.
- **Do** keep both accents (Tracking Error Red, CRT Chroma) under 10% of painted area on any screen, and never use them together as a paired scheme.
- **Do** prefer hairline dividers (`#ece8df21` / `#ece8df38`) over cards. The first answer to "how do I group these?" is a 1px line.
- **Do** keep CRT overlays on hero surfaces only — never let scanlines, halftone, or grain overlay form fields, lists, or any dense reading surface.
- **Do** honor `prefers-reduced-motion: reduce` on every motion you add. Video pauses, animated overlays stop, hover transitions drop to instant. The current `Home.css` rule is the template.
- **Do** lowercase all UI copy. "entrar", "criar conta", "configurações", "sair". Capitals are corporate; lowercase is intimate.
- **Do** stamp focus rings wide and clearly (`outline-offset: 7px` for ghost links, `4px` for primary buttons). The dim canvas eats narrow focus rings.

### Don't

- **Don't** use drop shadows. Anywhere. Depth comes from atmosphere, not elevation. (*The No-Lift Rule.*)
- **Don't** lift, scale, or translate components on hover. State change is color, opacity, or underline only.
- **Don't** pair Tracking Error Red and CRT Chroma as a deliberate brand scheme. They cohabit by accident of being VHS twins; they don't get to be a logo's color set.
- **Don't** introduce a sans-serif or serif typeface for any UI purpose. Share Tech Mono + VT323 is the entire system. (*The Mono-Only Rule.*)
- **Don't** capitalize labels, buttons, headings, or copy. (*The Lowercase Rule.*)
- **Don't** ship CRT overlays (scanlines, halftone, grain, tracking) on any surface that contains text or interactive controls. The texture is for hero rooms only.
- **Don't** look like a streaming service (Spotify, Apple Music, YouTube Music). No saturated gradients, no infinite cover-art grids, no algorithmic recommendation surfaces, no play buttons that go nowhere. campfire does not host songs; the UI must not pretend.
- **Don't** look like a public social network (Instagram, TikTok music, Twitter/X). No engagement metrics exposed (likes, views, follower counts), no infinite feeds, no public profiles, no global discoverability surfaces. The friend circle is sealed.
- **Don't** look like a gamified practice app (Yousician, Simply Piano, Fender Play). No streak counters, no level meters, no progress bars on songs, no badges, no "next lesson" CTAs. campfire does not teach.
- **Don't** look like a DAW (Bandlab, Soundtrap, Ableton, Logic). No mixer surfaces, no timelines, no plugin-rack chrome, no dense tech-blue UI. campfire is for amateurs, not for production.
- **Don't** drift into generic SaaS-dashboard look (Notion/Linear/Vercel-style). Cream-tinted-light neutrals, sidebar+topbar, identical card grids, Lucide icons everywhere — the lo-fi commitment excludes these by construction, but the trap creeps in via component-library defaults. If you reach for shadcn/ui, MUI, or Chakra, you are about to lose the voice.
- **Don't** carry the four exploratory `data-fonts="a|b|c|d"` variants forward. Prune them from `Home.css` now that the canon is Share Tech Mono + VT323.
- **Don't** keep `#000000` forever as the canvas. The shared design laws forbid pure black; the current value is a known compromise. Migrate toward a warm-tinted near-black (`oklch(10% 0.006 22)`) on the next intentional pass at the canvas.
