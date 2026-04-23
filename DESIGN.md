# Design System Inspired by Spotify

## 1. Visual Theme & Atmosphere

Campfire should feel like a premium music workspace viewed after hours: immersive, dense, and quietly dramatic. The interface lives inside a near-black cocoon (`#0b0b0f`, `#111318`, `#181b22`) so playlists, avatars, status, and music context can carry the emotional weight. The design philosophy remains "content-first darkness" with the chrome receding behind the product, but the signature highlight shifts away from green to a vivid electric aqua that keeps the same energy and functional emphasis.

The product voice is compact, crisp, and confident. Typography should use a rounded contemporary grotesk for headings and controls, paired with a highly readable UI sans for body copy. Weight contrast does most of the hierarchy work: 700 for emphasis, 600 for section labels and utility copy, and 400 for body.

Geometry stays unmistakably music-product: pill buttons, circular action controls, rounded search fields, and dense stacked surfaces. Elevated panels should feel like polished hardware floating in darkness, using strong shadows and subtle inner highlights rather than bright outlines.

**Key Characteristics:**
- Near-black immersive dark theme (`#0b0b0f`–`#181b22`) with subtle tonal layering
- Electric Aqua (`#27d3ff`) as the singular functional accent for CTAs, active states, and focus
- Compact, bold typography with strong weight contrast
- Pill buttons (`500px`–`9999px`) and circular controls (`50%`) throughout
- Uppercase utility labels with generous tracking for system voice
- Heavy, soft shadows for dark-surface elevation
- Artwork, avatars, and contextual status chips provide the secondary color moments

## 2. Color Palette & Roles

### Primary Brand
- **Electric Aqua** (`#27d3ff`): Primary accent for play-equivalent actions, active navigation, CTA emphasis, focus, and key data highlights
- **Electric Aqua Pressed** (`#13bde8`): Hover and pressed accent variant
- **Deep Night** (`#0b0b0f`): Root page background
- **Night Surface** (`#111318`): Base shell and sidebar background
- **Slate Surface** (`#181b22`): Cards, panels, and raised containers
- **Raised Surface** (`#20242d`): Hovered or emphasized interactive surfaces

### Text
- **Pure White** (`#ffffff`): Primary text
- **Soft White** (`#eef2f7`): Highlighted secondary text
- **Silver Mist** (`#a7b0be`): Secondary text and inactive navigation
- **Dim Slate** (`#7c8698`): Tertiary metadata and dividers

### Semantic
- **Negative Red** (`#f3727f`): Error and destructive states
- **Warning Orange** (`#ffa42b`): Warnings and stale-state messaging
- **Announcement Blue** (`#6aa8ff`): Informational states distinct from the accent
- **Success Mint** (`#63e6be`): Success confirmation without replacing the accent system

### Surface & Border
- **Card Border** (`rgba(255,255,255,0.08)`): Subtle panel edges
- **Strong Border** (`rgba(255,255,255,0.14)`): Input and selected-state boundary treatment
- **Hairline** (`rgba(255,255,255,0.05)`): Internal separators
- **Accent Tint** (`rgba(39,211,255,0.18)`): Accent washes for chips and selected rows
- **Accent Glow** (`rgba(39,211,255,0.32)`): Focus rings and active-glow effects

### Shadows
- **Heavy Elevation** (`rgba(0,0,0,0.52) 0 18px 42px`): Dialogs and dominant floating panels
- **Panel Elevation** (`rgba(0,0,0,0.34) 0 10px 24px`): Cards and sticky headers
- **Inset Highlight** (`inset 0 1px 0 rgba(255,255,255,0.06)`): Hardware-like surface finish

## 3. Typography Rules

### Font Families
- **Display / UI Strong**: `"Lexend", "Avenir Next", "Segoe UI", sans-serif`
- **Body / UI**: `"Manrope", "Helvetica Neue", sans-serif`
- **Mono / Utility**: `"IBM Plex Mono", "SFMono-Regular", monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Hero Title | Lexend | 48px-72px | 700 | 0.95 | -0.05em | Landing and marquee sections |
| Page Title | Lexend | 28px-40px | 700 | 1.0 | -0.03em | Major authenticated headings |
| Rail Heading | Lexend | 18px-22px | 700 | 1.15 | normal | Row and panel titles |
| Body Strong | Manrope | 16px | 700 | 1.4 | normal | Key inline emphasis |
| Body | Manrope | 16px | 400 | 1.5 | normal | Standard body copy |
| Utility Label | Manrope | 12px-13px | 700 | 1.2 | 0.18em | Uppercase section and chip labels |
| Button | Lexend | 13px-14px | 700 | 1.0 | 0.14em | Uppercase or title-case depending on context |
| Nav Item | Manrope | 14px | 600 | 1.2 | normal | Sidebar and top utility nav |
| Caption | Manrope | 13px | 500 | 1.35 | normal | Supporting metadata |
| Micro | IBM Plex Mono | 11px-12px | 500 | 1.4 | 0.12em | IDs, timestamps, low-level metadata |

### Principles
- **Compact hierarchy**: This is an application, not editorial reading. Keep the range tight and the scan speed high.
- **Weight-first emphasis**: Prefer weight and contrast before introducing extra sizes.
- **Utility uppercase**: Use uppercase tracked labels for system framing, chips, and overlines.
- **Clean rhythm**: Tight headings, breathable body copy, and consistent card density.

## 4. Component Stylings

### Buttons

**Primary Pill**
- Background: `#27d3ff`
- Text: `#041018`
- Padding: `0 20px`
- Radius: `9999px`
- Use: Primary actions, main conversion points, playback-equivalent controls

**Secondary Pill**
- Background: `#20242d`
- Text: `#ffffff`
- Border: `1px solid rgba(255,255,255,0.08)`
- Use: Secondary shell actions, utility controls

**Ghost Pill**
- Background: `transparent`
- Text: `#a7b0be`
- Border: `1px solid rgba(255,255,255,0.12)`
- Use: Passive or low-emphasis actions

**Circular Action**
- Background: `#27d3ff`
- Text: `#041018`
- Radius: `50%`
- Use: Play-equivalent or "jump in" actions

### Cards & Containers
- Background: `#181b22` or `#20242d`
- Radius: `8px`-`24px` depending on size
- Border: subtle translucent edge, never bright gray
- Hover: lift through surface brightening and shadow increase
- Finish: slight inset highlight to avoid flatness

### Inputs
- Background: `#12151b`
- Text: `#ffffff`
- Radius: `9999px`
- Padding: generous horizontal inset for icons
- Focus: aqua ring + border shift, never default browser blue if custom-styled

### Navigation
- Left rail on desktop, bottom utility bar on mobile
- Active state uses aqua icon wash and brighter text
- Inactive state stays silver mist
- Dense but legible spacing; more product dashboard than marketing site

## 5. Layout Principles

### Spacing System
- Base unit: `8px`
- Preferred scale: `4, 8, 12, 16, 20, 24, 32, 40`

### Grid & Container
- Desktop: sidebar rail + main content column + optional secondary insight rail
- Main content organized as stacked "rails" of related cards or panels
- Sticky top utility bar inside the authenticated shell
- Mobile: condensed header, scrollable content, bottom navigation

### Whitespace Philosophy
- **Dense by design**: Use the dark background to separate content rather than large empty gaps.
- **Breathing room at hierarchy breaks**: Titles and marquee areas should still feel premium, not cramped.
- **Panel logic**: Every surface should read as part of a larger playback/workflow environment.

### Border Radius Scale
- 8px: Chips and compact badges
- 12px: Inputs and utility cards
- 18px: Standard content cards
- 24px: Hero panels and large modules
- 9999px: Pills and search fields
- 50%: Circular icon buttons and avatars

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Base | `#0b0b0f` | Application background |
| Surface 1 | `#111318` | Shell and navigation rail |
| Surface 2 | `#181b22` + panel elevation | Cards and modules |
| Surface 3 | `#20242d` + heavy elevation | Sticky bars, promoted content, overlays |
| Focus | Aqua glow + strong border | Active controls and keyboard focus |

**Shadow Philosophy**: The UI should feel like dark lacquered hardware. Elevation comes from broad, soft shadows and faint internal highlights, not from obvious outlines.

## 7. Do's and Don'ts

### Do
- Keep primary surfaces near-black and layered through subtle value shifts
- Use Electric Aqua only where the old green would have carried meaning: CTA, active, focus, selection, high-priority status
- Preserve pill and circle geometry for the music-product feel
- Keep typography compact, bold, and highly scannable
- Use polished transitions, sticky utility chrome, and responsive rails to reinforce product quality
- Let cover art, avatars, and content cards bring in supporting color without competing with the accent

### Don't
- Don’t use the aqua accent decoratively across large backgrounds
- Don’t introduce additional bright brand colors for no reason
- Don’t flatten the layout into a generic dashboard grid
- Don’t switch to airy marketing-site spacing inside authenticated surfaces
- Don’t use light or mid-tone primary backgrounds
- Don’t rely on thin gray outlines for separation on dark surfaces

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile Small | `<425px` | Bottom nav only, condensed cards |
| Mobile | `425px-767px` | Single-column rails, stacked panels |
| Tablet | `768px-1023px` | Narrow sidebar, 2-column support grids |
| Desktop | `1024px-1439px` | Full sidebar, stacked feature rails |
| Large Desktop | `>=1440px` | Wider content lanes and persistent side insight panel |

### Collapsing Strategy
- Sidebar: full rail -> icon rail -> bottom nav
- Utility actions: group and wrap before truncating
- Data cards: 3-up -> 2-up -> 1-up
- Search: persistent at desktop, condensed into a top action chip on mobile

## 9. Agent Prompt Guide

### Quick Color Reference
- Background: `#0b0b0f`
- Shell: `#111318`
- Card: `#181b22`
- Raised: `#20242d`
- Text: `#ffffff`
- Secondary text: `#a7b0be`
- Accent: `#27d3ff`
- Accent pressed: `#13bde8`
- Error: `#f3727f`

### Example Component Prompts
- "Create a dark music-app card with `#181b22` background, 18px radius, faint translucent border, and a subtle inset highlight."
- "Design a primary pill CTA using Electric Aqua (`#27d3ff`), deep ink text, full-pill radius, and a soft aqua glow on focus."
- "Build a sticky utility bar with dense controls, silver secondary labels, and a near-black glass background."
- "Create an authenticated sidebar with compact navigation, active aqua treatment, and muted inactive states."

### Iteration Guide
1. Start from near-black surfaces and preserve the immersive dark theme
2. Use Electric Aqua wherever the old green carried action or active meaning
3. Keep the app compact, tactile, and product-like
4. Build rails, sticky chrome, and clear hierarchy before adding flourish
5. Use motion and glow sparingly, but make them feel intentional and premium
