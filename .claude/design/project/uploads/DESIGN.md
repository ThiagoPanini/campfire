# Campfire Design System

## 1. Product Vision & Design Direction

Campfire is a private music hub for small groups of friends who meet for amateur jam sessions. The interface should feel like the moment before a session begins: instruments are being tuned, people are arriving, the setlist is loose but alive, and a bonfire creates the shared center of gravity.

The design direction is **bonfire music circle**: dark, warm, social, and tactile. Campfire should keep the polish and density of a premium music product, but it must not feel like a generic streaming clone. The visual identity should center on ember reds, flame oranges, charred near-blacks, warm brass, and smoky neutrals. The product should feel private and trusted without becoming sterile.

The first deployable slice is `auth-bootstrap`, so the design system must support two jobs especially well:

- A public landing page that makes Campfire feel real, inviting, secure, and music-specific.
- A protected authenticated shell that proves the user has safely entered a private Campfire space.

## 2. Visual Theme & Atmosphere

Campfire lives in a near-black environment lit by warm firelight. The root experience should feel like looking into a rehearsing circle from just outside it: dark edges, glowing center, soft motion, and visible signals that people are gathering. The interface uses deep surfaces to protect focus, while red-orange highlights mark action, presence, warmth, and progress.

The authenticated product remains compact and highly scannable. It should feel more like a backstage session board than a marketing site: dense rails, clear status, confident typography, fast navigation, and restrained animation. The landing page can be more atmospheric, but once the user is inside the app, the firelight becomes a controlled product accent instead of a theatrical effect.

**Key Characteristics:**

- Near-black immersive base with warm firelight gradients and ember accents.
- Ember Orange as the primary action and focus color.
- Bonfire Red as the emotional brand color for warmth, energy, and identity.
- Dense, music-product layouts with rounded controls, circular actions, and tactile panels.
- Subtle animated atmosphere on public entry: ember drift, heat shimmer, pulsing fire glow, and session-status cues.
- Private-first tone: intimate, trusted, and small-group oriented.
- Content and people provide supporting color through avatars, setlists, rooms, and session state.

## 3. Color Palette & Roles

### Primary Brand

- **Ember Orange** (`#ff7a1a`): Primary CTA, active navigation, focus rings, selected states, and "enter the room" actions.
- **Flame Gold** (`#ffb347`): Hover highlights, warm illumination, active icon fills, and subtle heat glints.
- **Bonfire Red** (`#d9361e`): Brand emphasis, hero glow, destructive-adjacent urgency when not semantically negative, and high-energy session cues.
- **Coal Black** (`#080706`): Root page background and deepest shell areas.
- **Charred Umber** (`#120c09`): Main app background and landing shadow field.
- **Burnt Surface** (`#1b130f`): Cards, panels, sidebars, and raised containers.
- **Iron Surface** (`#26201c`): Hovered, selected, or promoted dark surfaces.

### Supporting Accents

- **Brass String** (`#d9a441`): Secondary warm accent for metadata, music details, badges, and premium highlights.
- **Pine Green** (`#4d7c59`): Optional quiet success or "ready" state. Use sparingly so the palette does not return to the old green identity.
- **Smoke Blue** (`#6f8ea3`): Informational states and cool contrast in dense data surfaces.
- **Ash Violet** (`#7d6a86`): Rare tertiary accent for personal or creative content, not primary actions.

### Text

- **Firelit White** (`#fff7ed`): Primary text on dark surfaces.
- **Warm Mist** (`#ead8c7`): Secondary text and paragraph copy.
- **Ash Gray** (`#b39b8c`): Inactive navigation, helper copy, metadata.
- **Soot Gray** (`#7f6d63`): Tertiary labels, timestamps, dividers.

### Semantic

- **Error Red** (`#ff5a4e`): Errors and destructive states. Keep distinct from Bonfire Red by pairing it with explicit copy and iconography.
- **Warning Amber** (`#ffbf3f`): Warnings, stale sessions, and degraded service messaging.
- **Info Blue** (`#7fb5d6`): Informational messages distinct from warm brand actions.
- **Success Pine** (`#65c987`): Success confirmations and healthy checks.

### Surface & Border

- **Card Border** (`rgba(255, 214, 179, 0.10)`): Subtle warm panel edges.
- **Strong Border** (`rgba(255, 214, 179, 0.18)`): Inputs, selected states, and elevated panels.
- **Hairline** (`rgba(255, 214, 179, 0.06)`): Internal separators.
- **Ember Tint** (`rgba(255, 122, 26, 0.16)`): Selected rows, badges, and active chips.
- **Ember Glow** (`rgba(255, 122, 26, 0.34)`): Focus rings, live indicators, and primary-action glow.

### Shadows

- **Fire Elevation** (`rgba(0, 0, 0, 0.58) 0 22px 56px`): Dialogs, login panel, and dominant floating panels.
- **Panel Elevation** (`rgba(0, 0, 0, 0.38) 0 12px 28px`): Cards, sticky headers, and standard raised surfaces.
- **Ember Halo** (`0 0 0 1px rgba(255, 122, 26, 0.18), 0 0 34px rgba(217, 54, 30, 0.18)`): Focus and active live-state treatment.
- **Inset Highlight** (`inset 0 1px 0 rgba(255, 238, 214, 0.07)`): Warm hardware-like finish.

## 4. Typography Rules

### Font Families

- **Display / Brand**: `"Fraunces", "Recoleta", "Georgia", serif`
- **UI Strong**: `"Sora", "Avenir Next", "Segoe UI", sans-serif`
- **Body / UI**: `"Manrope", "Helvetica Neue", sans-serif`
- **Mono / Utility**: `"IBM Plex Mono", "SFMono-Regular", monospace`

Fraunces or Recoleta should be used for the landing page title and rare brand moments only. Sora and Manrope carry most application UI so the authenticated shell remains clean, fast, and readable.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Landing Hero Title | Fraunces | 52px-84px | 700 | 0.95 | 0 | First-contact brand moment |
| Page Title | Sora | 28px-40px | 700 | 1.05 | 0 | Major authenticated headings |
| Rail Heading | Sora | 18px-22px | 700 | 1.15 | 0 | Row and panel titles |
| Body Strong | Manrope | 16px | 700 | 1.4 | 0 | Key inline emphasis |
| Body | Manrope | 16px | 400 | 1.55 | 0 | Standard body copy |
| Utility Label | IBM Plex Mono | 11px-12px | 600 | 1.3 | 0.14em | Uppercase section labels |
| Button | Sora | 13px-14px | 700 | 1.0 | 0.08em | Short action labels |
| Nav Item | Manrope | 14px | 650 | 1.2 | 0 | Sidebar and mobile nav |
| Caption | Manrope | 13px | 500 | 1.35 | 0 | Supporting metadata |
| Micro | IBM Plex Mono | 11px-12px | 500 | 1.4 | 0.10em | IDs, timestamps, low-level metadata |

### Principles

- **Warm brand, clear product**: Let display typography carry the bonfire mood on landing; keep product screens practical.
- **Weight-first emphasis**: Prefer weight and contrast before introducing extra sizes.
- **Compact hierarchy**: Authenticated surfaces should scan quickly and avoid editorial spacing.
- **No negative tracking**: Keep letter spacing at `0` or positive values for predictable rendering.
- **Short labels**: Buttons and chips should use direct music-room language such as "Enter Campfire", "Resume Session", "Sign In", and "Open Room".

## 5. Component Styling

### Buttons

**Primary Pill**

- Background: `#ff7a1a`
- Text: `#170904`
- Hover: `#ffb347`
- Radius: `9999px`
- Use: Sign-in, enter-room actions, primary save/continue actions, and play-equivalent controls.

**Secondary Pill**

- Background: `#26201c`
- Text: `#fff7ed`
- Border: `1px solid rgba(255, 214, 179, 0.10)`
- Use: Secondary shell actions, alternate auth action, utility controls.

**Ghost Pill**

- Background: `transparent`
- Text: `#ead8c7`
- Border: `1px solid rgba(255, 214, 179, 0.18)`
- Use: Low-emphasis actions, preview links, account recovery paths.

**Circular Action**

- Background: `#ff7a1a`
- Text: `#170904`
- Radius: `50%`
- Use: Play-equivalent actions, session entry, quick-start controls, and compact mobile affordances.

### Cards & Containers

- Background: `#1b130f` or `#26201c`.
- Radius: `8px`-`24px` depending on size.
- Border: warm translucent edge, never cold gray.
- Hover: increase surface warmth and shadow, with no layout shift.
- Finish: subtle inset highlight to create a tactile, firelit panel surface.

### Inputs

- Background: `#120c09`.
- Text: `#fff7ed`.
- Radius: `12px` for form fields, `9999px` for search.
- Border: `rgba(255, 214, 179, 0.14)`.
- Focus: Ember glow with a stronger border, never default browser blue if custom-styled.
- Error: Error Red border, explicit text, and icon support.

### Authentication Controls

- Email input and continue button should read as the primary path.
- Google authentication should be a full-width secondary action with the Google "G" mark and the label "Continue with Google".
- Divider text may use "or" only when visually quiet and centered.
- No public self-service sign-up is implied in the first secure slice; if sign-up appears later, it must be invitation-aware.

### Navigation

- Desktop: left rail with brand, room/session navigation, and account entry.
- Mobile: bottom navigation with compact circular icons and a warm active state.
- Active state uses Ember Orange icon wash, Firelit White text, and a small live ember indicator.
- Inactive state stays Ash Gray and should not compete with content cards.

## 6. Landing Page

The landing page is the user's first contact with Campfire. It must sell the feeling before it explains the system: a music circle is forming around a bonfire, and the user has been invited to step into it.

### Narrative Goal

The landing page should feel like arriving at a night gathering where the first song is about to start. The page should create anticipation through warm light, subtle motion, visible readiness signals, and a login experience that feels like part of the scene rather than a detached authentication card.

The first viewport should immediately communicate:

- The product name `Campfire`.
- A private music-gathering mood.
- A clear path to authenticate.
- A hint of the future product: friends, songs, session readiness, and shared musical memory.

### Composition

- Use a full-viewport dark scene with a firelit center and visible lower content hint on all viewport sizes.
- Avoid a split marketing layout. The login surface should be embedded in the atmospheric hero composition, near the warm center of the scene.
- Place the brand mark and short value proposition near the hero title, not only in tiny navigation.
- The login panel may be a raised surface, but it should look like a warmed piece of the Campfire environment: amber edge light, ember focus states, and subtle shadow from the same light source as the hero.
- Use a background image or generated bitmap visual for the primary landing atmosphere when possible: friends seated in a loose circle, instruments nearby, bonfire glow, and night ambience. Do not rely on abstract gradients alone.

### Landing Auth Experience

The landing page must include a modern dark-themed login screen integrated into the hero.

Required authentication paths:

- **Email**: Email field plus a primary "Continue with Email" or "Sign In with Email" action. The copy should support managed identity redirect or magic-link/password flow depending on the chosen provider implementation.
- **Google**: Secondary full-width "Continue with Google" action. If Cognito remains the managed identity provider, Google should be modeled as a federated provider through the managed auth layer.

Behavior and UX:

- The login surface should say "Enter Campfire" or equivalent music-room language.
- Authentication copy should reinforce private access: "For invited players" or "Use the email your group knows".
- Loading state should feel like a session handoff: glowing button state, small pulse on the live indicator, and clear progress text.
- Error states should be calm and specific: unrecognized email, Google account not authorized, session expired, or sign-in temporarily unavailable.
- The login panel must remain accessible: labeled inputs, visible focus, keyboard navigation, sufficient contrast, and clear error text.

### Motion & Atmosphere

Use motion to suggest a live gathering about to begin. Keep it atmospheric, not noisy.

- Slow ember drift near the hero center.
- Soft fire pulse on the brand mark, primary CTA, and login panel edge.
- Heat shimmer or subtle displacement behind the central firelight.
- Staggered entrance: brand, hero title, session cues, then login panel.
- Small "players arriving" indicators that pulse or tick in, such as avatar rings, readiness chips, or a tiny setlist meter.
- Respect `prefers-reduced-motion` by disabling drift and shimmer while keeping static glow and hierarchy.

### Visual Cues

Landing visuals should be specific to Campfire:

- Instruments visible near the fire: guitar case, hand drum, mic stand, capo, notebook, cables.
- A loose circle composition rather than a stage or audience.
- Session readiness objects: setlist card, room time, invited players, tuning note, and "first song queued" cue.
- Warm foreground glow fading to deep night at the edges.
- No generic SaaS dashboards in the hero; product UI previews should appear as small firelit overlays or cards within the gathering scene.

### Landing Content

Use minimal copy. The page is not a full marketing site.

- Hero title: `Campfire` or a direct offer such as `Your private jam circle`.
- Supporting line: explain the product in one sentence for small friend groups who organize amateur jam sessions.
- Login title: `Enter Campfire`.
- Trust cue: `Private access for invited players`.
- Preview cues: `Setlist warming up`, `4 friends arriving`, `Friday session`, `Room opens soon`.

### Below The Fold

Show enough below the first viewport to make the page feel alive without distracting from sign-in.

- A warm horizontal section with three concrete product promises: plan the session, remember the songs, keep the circle private.
- A compact preview rail showing future session cards, not a generic feature grid.
- A trust note that identity is handled through managed authentication and protected routes.

## 7. Authenticated Shell

The authenticated shell should feel like entering the private room after sign-in. It should be restrained, fast, and operational, with warmth used to orient the user rather than decorate every surface.

### Shell Structure

- Left sidebar on desktop with Campfire mark, primary navigation, and account area.
- Sticky top utility bar with current session context, search or quick action, and sign-out.
- Main content organized into stacked rails: "Tonight", "Setlist", "People", "Recent memory", or equivalent future product areas.
- Optional right insight rail on large screens for readiness, next song, or session notes.
- Mobile uses a compact header and bottom nav.

### `/me` Bootstrap Screen

The current first authenticated experience is the `/me` bootstrap screen. It should be designed as a real entry state, not a developer placeholder.

- Show the signed-in identity as "You have entered Campfire" with verified email context.
- Display local Campfire user status: created, found, or refreshed.
- Include a warm live-state indicator that confirms the protected route is active.
- Provide clear recovery states for expired session, unavailable API, and missing verified email.
- Keep technical details available in compact metadata rows, not as the primary visual story.

## 8. Layout Principles

### Spacing System

- Base unit: `8px`.
- Preferred scale: `4, 8, 12, 16, 20, 24, 32, 40`.
- Authenticated surfaces should be dense but not cramped.
- Landing hero can use larger spacing, especially around the hero title and integrated auth panel.

### Grid & Container

- Desktop app: sidebar rail + main content column + optional secondary insight rail.
- Landing: full-width atmospheric hero with constrained content lanes and a visible next-section hint.
- Main content: stacked rails of related cards or panels.
- Mobile: single-column content, compact header, bottom navigation, and login panel positioned before long supporting content.

### Whitespace Philosophy

- **Landing**: cinematic but still functional. Atmosphere must guide the eye toward sign-in.
- **App shell**: dense by design. Use surface layering and type hierarchy instead of oversized empty areas.
- **Panels**: every surface should feel connected to a music-room workflow.

### Border Radius Scale

- `8px`: Chips, compact badges, small state indicators.
- `12px`: Inputs, auth fields, utility cards.
- `18px`: Standard content cards.
- `24px`: Auth panel, large modules, session previews.
- `9999px`: Pills and search fields.
- `50%`: Circular icon buttons and avatars.

## 9. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Base | `#080706` | Page root and deepest landing darkness |
| Surface 1 | `#120c09` | Shell, navigation rail, auth form field base |
| Surface 2 | `#1b130f` + panel elevation | Cards, modules, auth panel |
| Surface 3 | `#26201c` + fire elevation | Sticky bars, promoted content, overlays |
| Focus | Ember glow + strong warm border | Active controls and keyboard focus |

**Shadow Philosophy**: The UI should feel like charred instruments, leather cases, and warm hardware catching firelight. Elevation comes from soft shadow, warm rim light, and subtle internal highlight rather than obvious gray outlines.

## 10. Interaction & Motion

Motion should make Campfire feel alive but never interfere with sign-in or scanning.

- Page load: stagger hero text, session cues, and auth panel.
- Hover: lift through brightness and shadow, no content reflow.
- Active navigation: small ember glow and concise transition.
- Form focus: immediate warm ring with no delay.
- Loading: pulse the relevant action or live indicator, not the whole page.
- Reduced motion: disable drifting particles, shimmer, parallax, and large reveal movement.

## 11. Do's and Don'ts

### Do

- Use red and orange as the emotional and functional center of the identity.
- Keep primary surfaces dark enough that firelight feels meaningful.
- Make the landing auth panel feel physically lit by the same bonfire as the hero.
- Use imagery and UI cues specific to amateur jam sessions, not generic music streaming.
- Preserve private-first trust through calm copy, secure flows, and clear failure states.
- Let future product previews hint at people, setlists, readiness, and shared memory.
- Keep the authenticated shell compact, tactile, and easy to scan.

### Don't

- Do not keep Electric Aqua as the brand accent.
- Do not turn the app into a brown/orange monochrome theme; use ash, brass, smoke, and pine sparingly for contrast.
- Do not make the landing page a detached SaaS hero with a separate login box floating outside the story.
- Do not imply public self-service sign-up in the first secure slice.
- Do not use stage-performance imagery; Campfire is a circle of friends, not an audience-facing concert.
- Do not use large decorative effects inside authenticated workflows where they reduce clarity.
- Do not rely on thin gray outlines for separation on dark surfaces.

## 12. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile Small | `<425px` | Login panel first after brand/title, bottom nav inside app, condensed cards |
| Mobile | `425px-767px` | Single-column landing and app rails, stacked panels |
| Tablet | `768px-1023px` | Two-column landing composition, narrow sidebar in app |
| Desktop | `1024px-1439px` | Full landing scene with integrated auth panel, full sidebar app shell |
| Large Desktop | `>=1440px` | Wider content lanes, persistent app insight rail, richer atmospheric landing spacing |

### Collapsing Strategy

- Landing hero: scene + auth panel side-by-side on desktop, auth panel below hero copy on mobile.
- Sidebar: full rail -> icon rail -> bottom nav.
- Utility actions: group and wrap before truncating.
- Data cards: 3-up -> 2-up -> 1-up.
- Search: persistent at desktop, condensed into a top action chip on mobile.

## 13. Agent Prompt Guide

### Quick Color Reference

- Background: `#080706`
- Shell: `#120c09`
- Card: `#1b130f`
- Raised: `#26201c`
- Text: `#fff7ed`
- Secondary text: `#ead8c7`
- Muted text: `#b39b8c`
- Accent: `#ff7a1a`
- Accent hover: `#ffb347`
- Brand red: `#d9361e`
- Error: `#ff5a4e`

### Example Component Prompts

- "Create a firelit Campfire landing hero with a full-bleed night jam-circle image, ember-orange primary CTA, and an integrated dark auth panel for email and Google sign-in."
- "Design an `Enter Campfire` login panel using `#1b130f`, warm translucent borders, labeled email input, Google secondary action, and ember focus states."
- "Create a protected `/me` bootstrap card that confirms the user entered Campfire, shows verified email, and uses compact warm metadata rows."
- "Build a dense authenticated music-room shell with a dark sidebar, active Ember Orange nav state, sticky utility bar, and tactile session cards."

### Iteration Guide

1. Start from Coal Black and Charred Umber, then place warm light intentionally.
2. Use Ember Orange for action, focus, active state, and entry into the private room.
3. Keep the landing page atmospheric and narrative, but keep authenticated screens compact and task-oriented.
4. Make auth feel like crossing the threshold into a music circle, not leaving the product for a generic form.
5. Add motion only where it reinforces gathering, presence, or secure progress.
