# Campfire Design System

> For feature `001-frontend-mvp-prototype`, the authoritative visual source is the Claude Design export at `specs/001-frontend-mvp-prototype/design-reference/project/Campfire Landing.html`. This document is synchronized from that export for implementation guidance. If this file conflicts with the Claude export for Landing, Sign In, Sign Up, or Onboarding, the Claude export wins. Home remains an extrapolated fallback until a Claude Home design is supplied.

## 1. Product Vision

Campfire is a private music hub for people who play in small, informal circles. The MVP focuses on a narrower first product promise: track the songs you know, understand what you are still learning, and share that repertoire with the people you play with.

The implemented design direction is **dark rehearsal-room brutalism**: blackened surfaces, oversized condensed display type, precise mono labels, sparse copy, and one warm orange accent. It should feel direct, musical, and slightly raw, like a rehearsal note taped to a speaker cabinet rather than a generic SaaS dashboard.

## 2. Visual Direction

Campfire should use a restrained, high-contrast dark interface. The UI gets its personality from bold typography, clear rhythm, warm accent color, and concise music-specific language rather than decorative illustrations or busy atmospheric effects.

Key characteristics:

- Near-black graphite background with minimal borders.
- Burnt orange as the single dominant action and brand accent.
- Large uppercase display headlines using a condensed typeface.
- Mono uppercase labels for navigation, section kickers, badges, and actions.
- Sparse layouts with strong vertical spacing on public pages.
- Compact controls and preference chips inside authenticated flows.
- Simple fire mark with subtle flame/ember animation.
- Alpha-stage honesty in copy and badges.

## 3. Current Token Reference

For the current frontend-only prototype, canonical front-end tokens should live in `src/styles/tokens.css` and be consumed by React components through CSS custom properties.

| Token | Value | Role |
| --- | --- | --- |
| `ACCENT` | `#E8813A` | Default primary action, selected chips, active labels, highlighted headline text |
| `ACCENT_DARK` | `#6B2E00` | Default dark warm feature tile and deep brand contrast |
| `BG` | `#131313` | Page background and fixed nav background |
| `SURFACE` | `#181818` | Cards, neutral feature tile, protected profile panel |
| `BORDER` | `#1e1e1e` | Navigation divider and quiet structural border |
| Display font | `"Anton", Impact, sans-serif` | Brand mark and large uppercase headlines |
| Body font | `"Space Grotesk", Helvetica, Arial, sans-serif` | Body copy, form fields, chips, app content |
| Mono font | `"Space Mono", monospace` | Labels, buttons, badges, navigation |

Supporting colors used by the implementation:

- `#fff`: Primary text.
- `#ccc`: Secondary action text.
- `#bbb`: Feature-card body text.
- `#949494`, `#888`, `#777`, `#666`, `#555`, `#444`, `#333`: Muted text steps.
- `#1a1a1a`, `#1e1e1e`, `#222`, `#232323`, `#242424`, `#2a2a2a`, `#2d2d2d`, `#2e2e2e`: Surface and border steps.
- `#FF6B6B`: Error messaging.
- Google brand colors appear only inside the Google authentication mark.

Avoid expanding into a full brown/orange monochrome palette; the current look works because the accent is sparse.

Accent presets from the Claude export:

| Preset | Accent | Dark companion |
| --- | --- | --- |
| `EMBER` | `#FF6B2B` | `#7C1E00` |
| `FLAME` | `#FFAA00` | `#7A4800` |
| `GOLD` | `#FFD166` | `#6B4900` |
| `COPPER` | `#E8813A` | `#6B2E00` |
| `BRASS` | `#D4A84B` | `#5C3A00` |

## 4. Typography

### Font Roles

- **Display / Brand**: `Anton`. Use for the Campfire wordmark and major page headlines.
- **Body / UI**: `Space Grotesk`. Use for paragraphs, form input text, chips, card copy, and protected content.
- **Mono / Utility**: `Space Mono`. Use for buttons, nav links, badges, kickers, labels, and metadata.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Landing hero | Anton | `clamp(52px, 11.5vw, 118px)` | 400 | 0.93 | `0.025em` | Uppercase, multi-line, high impact |
| Auth title | Anton | `clamp(34px, 7vw, 52px)` | 400 | 0.93 | `0.03em` | `WELCOME BACK`, `JOIN CAMPFIRE` |
| Onboarding title | Anton | `clamp(36px, 7vw, 56px)` | 400 | 0.93 | `0.03em` | Compact protected flow heading |
| App home title | Anton | `clamp(42px, 8vw, 72px)` | 400 | 0.95 | `0.025em` | Personalized welcome |
| Body copy | Space Grotesk | 15px-17px | 300-400 | 1.6-1.7 | `0.01em` when needed | Muted, concise explanations |
| Button | Space Mono | 11px-13px | 700 | 1 | `0.14em` | Uppercase action labels |
| Label / kicker | Space Mono | 9px-11px | 700 | normal | `0.16em` | Uppercase section labels |
| Badge | Space Mono | 9px | 700 | 1 | `0.18em` | `ALPHA` pill |

Rules:

- Keep headlines uppercase and short.
- Let `Anton` stay lightweight at `400`; avoid artificially bold display text.
- Use positive tracking only. Do not use negative letter spacing.
- Keep body copy muted and understated so the accent and headlines carry the visual emphasis.
- Use direct product language: `TRACK THE SONGS YOU KNOW TO PLAY`, `ENTER CAMPFIRE`, `START TRACKING`, `UPDATE PREFERENCES`.

## 5. Layout System

### Global Frame

- All pages use a fixed top nav, 58px tall.
- Root background is `#131313`.
- Page content uses `min-height: 100dvh`.
- Content lanes are centered and constrained rather than full-width by default.
- Public landing content uses a maximum width of 1300px.
- Auth forms use a maximum width of 400px.
- App home uses a maximum width of 760px.
- Onboarding uses a maximum width of 640px.

### Spacing

Use clamp-based responsive spacing for large page regions:

- Landing top padding: `clamp(110px, 18vw, 168px)`.
- Auth top padding: `clamp(80px, 14vw, 130px)`.
- App home top padding: `clamp(110px, 16vw, 160px)`.
- Onboarding top padding: `clamp(80px, 14vw, 120px)`.
- Horizontal page padding: `clamp(20px/24px, 5vw/6vw, 40px/80px)` depending on page density.

Use tighter spacing in controls:

- Feature tiles: `clamp(24px, 3vw, 36px)`.
- Profile panel: `clamp(20px, 3vw, 32px)`.
- Chips: 8px row/column gap.
- Form stack: 14px gap.

## 6. Shared Components

For the current prototype, shared primitives live under `src/components/` and shared styles live under `src/styles/`.

### Nav

The nav is fixed and minimal:

- Left side: animated fire icon, `CAMPFIRE` wordmark, `ALPHA` badge.
- Right side: one mono text action such as `SIGN IN`, `BACK`, or `SIGN OUT`.
- Background: `#131313`.
- Border bottom: `1px solid #1e1e1e`.
- Height: 58px.

### Fire Icon

The mark is an inline SVG flame:

- Outer flame uses `ACCENT`.
- Inner flame uses `#FFD166`.
- Ember uses `#FFF5B0`.
- Animation classes: `cf-flame-outer`, `cf-flame-inner`, `cf-ember`.
- It should remain decorative with `aria-hidden="true"` when paired with the text wordmark.

### Alpha Badge

- Text: `ALPHA`.
- Font: `Space Mono`, 9px, 700.
- Background: `ACCENT`.
- Text: black.
- Radius: 20px.

### Mono Label

Mono labels are the system's main information scent. Use them for section titles, step labels, metadata labels, feature kickers, and low-level status.

### Accent Button

- Background: `ACCENT`.
- Text: black.
- Hover: translucent white background, white text, and subtle light border.
- Font: `Space Mono`, uppercase, 700.
- Radius: 40px.
- Minimum height: 48px.
- Large size: 13px text, `15px 40px` padding.
- Medium size: 11px text, `11px 28px` padding.

### Ghost Button

- Transparent background.
- Muted text, white on hover.
- Border moves from `#2d2d2d` to `#555`.
- Used for lower-commitment choices such as `SKIP FOR NOW`.

### Form Input

- Label: mono uppercase, 9px, `#666`.
- Input background: `#1a1a1a`.
- Border: `#2e2e2e`, changing to `ACCENT` on focus.
- Radius: 6px.
- Text: white, 15px `Space Grotesk`.
- Padding: `12px 14px`.

### Google Button

- Full-width secondary auth action.
- Background: `#1e1e1e`, hover `#242424`.
- Border: `#2e2e2e`.
- Radius: 8px.
- Uses the official four-color Google `G` mark.
- Label is uppercase mono, for example `CONTINUE WITH GOOGLE`.

## 7. Public Landing Page

The current landing page is not a full marketing site. It is a direct, typographic entry point.

Required structure:

- Fixed nav with sign-in action.
- Early-access kicker: `EARLY ACCESS · CURRENTLY IN ALPHA`.
- Huge uppercase hero headline:
  `TRACK THE SONGS / YOU KNOW TO PLAY / AND SHARE / WITH OTHERS.`
- Accent color on the final phrase.
- Short supporting paragraph about building a repertoire by instrument, tracking what is being learned, and sharing with the group.
- Primary CTA: `ENTER CAMPFIRE`, routing to sign-up.
- Three feature tiles below the fold:
  `YOUR REPERTOIRE`, `WHAT TO PRACTICE`, `SHARE WITH YOUR CIRCLE`.
- Footer copy that acknowledges alpha status.

Feature tiles use a single bordered grid with no gutters between cells:

- Tile 1: `ACCENT` background, black text/icon.
- Tile 2: `SURFACE` background, orange icon, muted copy.
- Tile 3: `ACCENT_DARK` background, warm light text/icon.

The landing page should stay sparse. Do not add a decorative product dashboard, generic hero illustration, or long marketing feature grid unless the product scope changes.

## 8. Authentication Pages

Authentication is implemented as dedicated pages, not as an embedded landing panel.

Routes:

- `/signin`: title `WELCOME BACK`, primary action `SIGN IN`.
- `/signup`: title `JOIN CAMPFIRE`, primary action `CREATE ACCOUNT`.

The current frontend-only MVP does not ship `/auth/callback`; Google sign-in/sign-up is simulated in place and routes forward without an OAuth handoff.

Auth page order:

1. Brand cluster with fire icon, `CAMPFIRE`, and `ALPHA`.
2. Large display title.
3. Google button.
4. Quiet `OR` divider.
5. Email field.
6. Password field with an 8-character minimum.
7. Full-width accent submit button.
8. Mode swap link.
9. Error message when needed.

The current auth implementation routes successful sign-in/sign-up through the mocked or managed session flow. Copy and visual states should not promise a public open community; the tone should remain private, alpha, and small-group oriented.

## 9. Auth Callback

Auth callback is out of scope for the current Claude-derived frontend MVP. Do not implement or document an OAuth callback route for this slice.

If a future real managed-identity integration adds a callback page, it should feel like a calm transfer back into Campfire:

- Kicker: `AUTH CALLBACK`.
- Title: `HANDING THE KEY BACK / TO CAMPFIRE.`
- Supporting copy explains secure redirect, session restoration, and routing into the authenticated shell.
- Use the same centered content lane and fade-up animation as other simple pages.

Avoid exposing provider implementation details in the primary visual story.

## 10. Onboarding Preferences

The onboarding page collects music context after first authentication.

Required content:

- Step kicker: `STEP 2 OF 2`.
- Title: `ONE LAST THING`.
- Supporting text: `Help Campfire understand how you play. You can always update this later.`
- Instrument multi-select chips.
- Genre multi-select chips.
- Play-context single-select cards.
- Goal multi-select chips.
- Experience-level single-select cards.
- Primary action: `START TRACKING`, loading state `SAVING…`.
- Secondary action: `SKIP FOR NOW`.

Control rules:

- Chips use pill radius 40px.
- Selected chips use `ACCENT` background, black text, and orange border.
- Unselected chips use `#1e1e1e`, `#888`, and `#2e2e2e`.
- Option cards use 10px radius, `#1a1a1a` base, and an orange border/tint when selected.
- The page may use musician/context emoji inside option cards, but keep them functional and sparse.

## 11. Protected App Home

The current protected app home is a bootstrap home, not the final full app shell.

Required content:

- Kicker: `CAMPFIRE · HOME`.
- Personalized display headline: `WELCOME BACK, {DISPLAY_NAME}.`
- Supporting copy explaining that repertoire, learning, and group-play content will live here.
- Loading label: `RESOLVING YOUR SESSION…`.
- Error copy for failed profile loading.
- Member panel showing first-login/returning state, name, and email.
- Primary action: `UPDATE PREFERENCES`, routing to onboarding.

The member panel should remain compact:

- Background: `#181818`.
- Border: `1px solid #222`.
- Radius: 20px.
- Two-column metadata on desktop; collapse naturally on narrow screens if layout changes.

Future authenticated shells can add sidebar navigation and denser session boards, but this guide should treat the current `/home` as the implemented baseline.

## 12. Motion

The shared animation layer is small and intentional:

- `cfFadeUp`: page content enters with 16px upward movement and opacity fade.
- `cfFlicker`: outer flame motion.
- `cfFlicker2`: inner flame motion.
- `cfEmberPulse`: ember opacity pulse.

Use motion for:

- Initial page entrance.
- Fire mark liveliness.
- Button and control hover transitions.
- Form focus transitions.

Do not add large parallax, continuous background particles, or motion that competes with forms. Add `prefers-reduced-motion` handling before introducing any new decorative or continuous animation.

## 13. Responsive Behavior

The implementation relies on fluid CSS rather than many named breakpoints:

- Use `clamp()` for hero type, page padding, and large content regions.
- Landing feature tiles use `repeat(auto-fit, minmax(240px, 1fr))`.
- Onboarding option cards use `repeat(auto-fill, minmax(200px, 1fr))` or `minmax(160px, 1fr)` depending on content.
- Flex rows should wrap before truncating controls.
- Long email values must use `word-break: break-all`.
- Buttons keep `white-space: nowrap`; containers must provide enough wrapping space.

When adding new UI, preserve the fixed top nav offset and test at mobile widths where uppercase labels can become wide.

## 14. Accessibility Rules

- Keep all form fields labeled.
- Preserve visible focus states, especially the orange input border.
- Keep button text readable against `ACCENT`; black text is the current standard.
- Do not rely on color alone for error states; include specific error text.
- Inline SVG icons that duplicate adjacent text should be `aria-hidden`.
- Authentication pages must be keyboard navigable from nav action through form submission.
- Keep contrast high on muted copy. Avoid going below the existing `#555` usage for essential text.

## 15. Do's and Don'ts

### Do

- Use the current tokens from `src/styles/tokens.css`.
- Keep `Anton`, `Space Grotesk`, and `Space Mono` as the visual foundation.
- Use orange sparingly and decisively.
- Keep copy short, uppercase, and music-specific where it acts as UI chrome.
- Treat alpha status as part of the product voice.
- Keep public pages bold and sparse; keep protected flows compact and task-oriented.
- Reuse primitives before creating one-off controls.

### Don't

- Do not describe the current UI as an image-led bonfire scene unless that implementation returns.
- Do not add a detached SaaS hero, generic dashboard mockup, or stock-looking feature section.
- Do not reintroduce Electric Aqua or broad multicolor gradients.
- Do not imply that sign-up is broadly public if the auth/product policy remains invite or alpha oriented.
- Do not bury the primary action under explanatory content.

## 16. Prompt Guide For Future Front-End Work

Use these prompts as constraints for agents and designers:

- "Extend the implemented Campfire UI using `Anton`, `Space Grotesk`, `Space Mono`, `#131313`, and `#E8813A`; keep the layout sparse, uppercase, and rehearsal-room brutalist."
- "Create a protected repertoire screen that feels like the current `/home`: fixed top nav, mono section kickers, compact dark panels, orange selected states, and no generic SaaS cards."
- "Add an onboarding step using the existing chip and option-card patterns; selected states use orange fill or orange border/tint, and the page remains centered at about 640px wide."
- "Design a loading or callback state with one mono kicker, one Anton headline, one short muted paragraph, and the shared fade-up animation."

When in doubt, match the implemented front end first, then evolve deliberately through shared tokens and primitives.
