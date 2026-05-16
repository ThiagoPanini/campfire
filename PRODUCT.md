# Product

Strategic context for campfire. The product vision (problem, features, phases) lives in [PRODUCT_VISION.md](./PRODUCT_VISION.md); this file is for design intent — who we are designing for, what feeling the interface owes them, and what we will not become. Visual tokens belong in `DESIGN.md` (run `/impeccable document` to generate it).

## Register

product

The primary surface is the app — repertoire CRUD, sign-in, and eventually jam sessions. The landing exists as an entry point, not as the product. The brand register is invoked deliberately when working on marketing surfaces (use `brand` per task), but the default is `product` because that is where the user spends their time and where the aha lives.

The lo-fi voice that currently lives on the landing is not confined there. It bleeds into the product UI, intentionally. See *Brand Personality* and *Design Principles* below.

## Users

**Primary: the amateur musician who plays casually.** Any instrument — guitar, piano, voice, drums, ukulele, anything. Not performing professionally, not enrolled in a formal program. Plays alone at home most weeks, plays with one or two friends some weekends. Motivated by attachment to specific songs and the pleasure of playing with people they already know. The product is instrument-agnostic from day one — every repertoire entry declares its instrument and no instrument is privileged.

**Context of use:** at home with the instrument in their hands, logging a song they just learned or are working on; or at a friend's place after dinner, opening campfire on a phone to remember what they used to play together. Short sessions, not long ones. The app is consulted, not lived in.

**Job to be done:** keep a personal record of the songs they are currently playing that does not feel like a spreadsheet, a note app, or a streaming queue. The shelf must feel like *theirs* — inhabited, not generated.

**Secondary: the friends of a primary user.** They join because someone they already play with invited them. Their first value is their own repertoire, not the network. campfire grows by friend graphs, not by virality.

## Product Purpose

campfire is, first, a personal repertoire log; and second — once friends are on the platform — a facilitator for the shared moments where those repertoires meet.

**MVP success** (what we are designing toward right now): a user creates an account, logs a song, closes the tab, comes back days later, and the song is there. The shelf feels like theirs. That is the near-term aha — the personal-shelf feeling — and no later feature can recover it if the MVP misses it.

**Long-term success** (what every design decision should still leave room for): a jam session where campfire suggests a song that everyone present has in their repertoire, and they actually play it. The moment the product stops being "a place where I list songs" and becomes "the thing that makes our jam sessions better."

The product is a slow product. It is consulted between sessions and leaned on during them. It is not a place users scroll.

## Brand Personality

**Three words:** warm, nostalgic, intimate.

**Voice:** lowercase, spare, written like a friend handing you a mixtape — not like a brand handing you onboarding copy. No exclamation marks. No emoji. No growth-hack idioms ("level up", "supercharge", "unlock"). Honors silence; says less than it could. The interface speaks Portuguese on the current landing slice (a fact, not yet a policy — see [docs/mvp-scope.md](./docs/mvp-scope.md) open question on UI language); resolve before extending PT copy to new screens.

**Emotional goal when a user sees their own repertoire for the first time:** *"this is mine."* Calm ownership, like flipping through a personal vinyl shelf. Not pride-as-achievement, not satisfaction-as-completion. The reverent quiet of recognizing a small collection you built.

**Aesthetic posture:** lo-fi / VHS / cassette is the committed direction, including in the app UI. The texture is intimacy and care, not ironic retro. Mono type, warm-dark canvas tinted toward the brand, vintage red/cyan accents used sparingly, decorative CRT overlays where they belong (hero surfaces) and removed where they would impede reading (forms, lists, dense data). If a treatment would only make sense as a quote or wink, cut it.

## Anti-references

What campfire must not become. Loud, in this order:

- **Streaming services (Spotify, Apple Music, YouTube Music).** Saturated gradients, album covers in infinite grids, dark mode optimized for passive consumption, algorithm-first surfaces. campfire is the opposite shape: active, personal, no catalog, no playback, no recommendations driven by listening history.
- **Public social networks (Instagram, TikTok music, Twitter/X).** Infinite feeds, exposed engagement metrics (likes, views, follower counts), creator-economy copy, vertical video formats, public profiles, global discovery. campfire is sealed: interactions live inside the friend graph and never escape it.
- **Education / gamified practice apps (Yousician, Simply Piano, Fender Play, Duolingo-for-music).** Streak counters, badges, level meters, "next lesson" CTAs, paternal tutor voice. campfire does not teach — it logs. No progress bars on songs.
- **Professional music tooling (Bandlab, Soundtrap, Ableton, Logic).** Mixers, timelines, plugin racks, dense tech-blue DAW chrome. campfire is for amateurs; we never imply production capability we do not have.

Secondary (lower threat, mentioned because the trap is real):

- **Generic SaaS-dashboard look (Notion/Linear/Vercel-style).** Cream-tinted neutrals, sidebar + topbar, identical card grids, Lucide icons everywhere, "settings → workspace → integration" IA. The lo-fi commitment already excludes this by construction, but watch for it creeping in via component-library defaults (shadcn/ui out-of-the-box, MUI, Chakra).

## Design Principles

Five strategic principles, derived from the personality and anti-references above. Read these before making any structural design call.

1. **Personal shelf, not catalog.** The repertoire is the user's collection, not a database row. Every screen of the app should feel inhabited and hand-arranged, not generated by a CRUD scaffold. Lists are shelves; entries are objects on the shelf. Empty states are quiet, not lecturing.

2. **Lo-fi is warmth, not irony.** The VHS / cassette / mono-type aesthetic is a posture of care and intimacy. It is not a wink at the past, not design-school cosplay, not novelty. If a treatment would only land as a quote (a chunky '80s neon header for laughs, a Comic-Sans pull quote, a fake "rewind" button), cut it. The texture earns its place by making the surface feel handmade.

3. **Quiet rooms, not lobbies.** Low stimulation by default. No metrics surfaced to the user (count of songs is okay; "this week you logged 4 songs!" is not). No nudges, no notifications-as-engagement-loops, no growth-hack copy. The product should feel like a small lit room someone enters on purpose, not a marketplace pulling them in.

4. **The friend circle is sealed.** Anti-public-social baked into every interaction surface, from day one — even though friends do not exist in the MVP. No public profiles. No global discoverability. No leaderboards. No "trending repertoires." If a feature would feel at home on Instagram, it does not belong here. Design the seams so the seal is obvious to the user.

5. **Honor the restraint.** campfire does not host songs, does not teach them, does not notate them. The UI never fakes those capabilities — no decorative waveforms, no play buttons that go nowhere, no chord diagrams, no lesson plans, no fake "preview" surfaces. We show what we know: title, artist, instrument. Confidence comes from owning the smallness of that, not from padding it out.

## Accessibility & Inclusion

**Compliance baseline: WCAG 2.2 AA.** Non-negotiable for shipping:

- Small-text contrast ≥4.5:1; large-text contrast ≥3:1. Watch the muted ink token (`--ink-muted` at 64% opacity in the current landing) — confirm it passes against the warm-dark canvas at every type size it appears.
- Visible focus rings on every interactive element. The current landing already does this with `outline: 1px solid var(--ink); outline-offset: 7px;` — carry the pattern forward.
- Full keyboard navigation. No mouse-only interactions.
- `alt` text on every meaningful image; `aria-hidden` on decorative ones (the CRT overlays already follow this — preserve the discipline).
- Never communicate state through color alone. Red/cyan accents pair with text or shape.
- `prefers-reduced-motion: reduce` honored — video freezes, scanline/grain/tracking animations stop. Already implemented in [apps/web/src/home/Home.css](apps/web/src/home/Home.css); apply the same rule to any new motion.

**Inclusion stance beyond WCAG:**

- **Instrument-agnostic.** No screen should privilege guitar (or piano, or voice). Iconography, copy, and field defaults treat all instruments as first-class. A vocalist's repertoire should feel as native as a guitarist's.
- **Skill-agnostic.** No "level", no "beginner/intermediate/advanced" framing. Someone who has played for 30 years and someone who learned their first song last week both have a repertoire and both deserve the same shelf.
- **No public-comparison surfaces.** Even when the friend graph ships, comparison-as-feature (who has more songs, who plays faster) is anti-product. Inclusion here means protecting the user from the social pressure they came to campfire to escape.
