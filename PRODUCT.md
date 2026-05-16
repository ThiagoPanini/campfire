# Product

> Source of truth for **what** campfire is, **for whom**, **why**, and how it presents itself. MVP delivery scope lives in [docs/mvp-scope.md](./docs/mvp-scope.md).

## Register

product

## Problem

Amateur musicians who play casually — alone at home, or occasionally with friends — have no good place to track what they are learning. General-purpose note apps don't know what a song is; streaming services know songs but don't know what *you* play; social music networks are tuned to passive consumption, not active practice. The gap is sharper the moment two or more amateurs try to play together: there is no shared surface that knows each person's repertoire and can use that knowledge to make the session better.

campfire closes that gap. It is first a personal repertoire log, and then — once friends are on the platform — a facilitator for the shared moments where those repertoires meet. The MVP ships only the repertoire log: the walking skeleton that proves a real user can sign up and maintain a list of songs across sessions.

## Users

**Primary**: amateur musicians who play casually — alone or with a small circle of friends — and want a personal record of the songs they are currently learning, on whatever instrument(s) they play. They are not performing professionally, not enrolled in a formal program, and not optimizing for a career. Their motivation is enjoyment, attachment to specific songs, and the social pleasure of playing with people they know.

The context of use is private: a user at home with their instrument, capturing what they're working on. Sessions are short and low-stakes. The product must feel like a *personal shelf*, not a platform that owns their data.

**Secondary** (post-MVP): the friends of a primary user, who join because someone they already play with invited them. Their first value is their own repertoire — the network is downstream. The product grows by friend graphs, not by virality.

campfire is **instrument-agnostic from day one**. Each repertoire entry declares its instrument, and no surface — copy, iconography, default state — privileges any one. The platform is for guitarists, pianists, vocalists, drummers, and anyone else in the same shape of user.

## "Aha" moments

campfire has two ahas at different scales. Both are deliberate: the near-term one is what a real human meets when the MVP ships; the long-term one is what justifies the product's existence beyond a repertoire log.

**Near-term aha (reachable in the MVP)** — *the first time a user logs a song and the repertoire feels like theirs.* A clean, lightweight, personal shelf of the music they are currently learning. No generic note-app overhead, no streaming-service noise. This is the aha the MVP must actually land; if it doesn't, no later feature recovers it.

**Long-term aha (post-MVP)** — *the first jam session where campfire suggests a song that everyone present has in their repertoire, and they actually play it.* This is the moment campfire stops being "a place where I list songs" and becomes "the thing that makes our jam sessions better." It depends on the friend graph and jam sessions arriving, but it is the experience that defines campfire's identity.

Success at the MVP scale is binary: a real human visits the deployed URL, creates an account, logs songs, returns later, and finds their repertoire intact.

## Core features (by maturity)

### MVP

- **Accounts** — a user signs up and signs in.
- **Personal repertoire** — a user logs songs they play (or are learning), with the minimum metadata needed to identify a song.
- **Repertoire view** — the user can see their own list and return to it.

The single MVP end-to-end flow is specified in [docs/mvp-scope.md](./docs/mvp-scope.md).

### Post-MVP

- **Friend graph** — users connect to friends already on the platform.
- **Jam sessions** — a group of connected users starts a session; campfire suggests songs based on the intersection (or thoughtful union) of their repertoires.
- **In-jam interactions** — attendees rate performances and react during a session.
- **Song requests** — a user asks a friend (directly, user-to-user) to learn a specific song on a specific instrument. The friend can pull the request into their own repertoire as a learning item. No "group" concept is implied — requests are between two users on the friend graph.
- **Recordings** — a user records themselves playing a song from their repertoire and shares it within the friend graph.
- **Social interaction around recordings** — reactions, comments, and discovery built on top of submitted recordings.

### Long-term

- **AI evaluation of recordings** — an AI compares a user's recording against the reference song and returns a score plus a detailed evaluation. Builds on the recordings feature already shipped in the post-MVP phase.

Repertoire logging, friend graph, jams, and recordings remain free for the foreseeable future. AI evaluation is the candidate premium surface; the monetization model is a deliberate deferral (see below).

## What campfire is not (anti-features)

- **Not a music streaming service.** campfire does not host or stream the original recordings of songs.
- **Not a structured music-education platform.** No curricula, no graded lessons, no certifications. campfire helps you track what you are learning; it does not teach you.
- **Not a public social network.** Interactions are scoped to friend graphs and jam attendees, not a global feed competing for general attention.
- **Not a tool for professional musicians.** No band management, gig booking, royalties, contracts, or commercial-distribution features.
- **Not a tab/sheet/notation repository.** campfire stores that a user plays a song; it does not aim to be the authoritative source of how that song is played.

## Long-term vision (3-5 years)

A mature campfire is the default companion app for amateur musicians who play with friends. Friend groups treat it the way casual chess players treat Lichess: a low-friction, shared surface that is *theirs*, that they return to between sessions and lean on during them.

The mature product:

- Knows each user's repertoire deeply enough to suggest songs intelligently during a jam.
- Has a body of submitted recordings that turn campfire into a private, opt-in record of how a friend group's playing evolved over time.
- Sustains itself financially through premium AI evaluation while keeping the social and repertoire-logging layer free.
- Remains scoped to amateurs. Growth into adjacent markets (lessons, professional tooling) is explicitly out of scope and would betray the product's identity.

## Brand Personality

Three words: **considered, committed, personal.**

- *Considered* — every choice has a reason. No safe Tailwind-defaults, no decorative flourishes, no "modern SaaS" reflex. Intentionality is the baseline.
- *Committed* — one point of view, held fully. A single accent, a single typographic voice, a single canvas philosophy. The design makes a strong impression without raising its voice.
- *Personal* — the surface belongs to the user. Their repertoire, their shelf. The product never positions itself as the authority on what they play or how.

Voice: quiet confidence in the lane of Linear and Vercel — precision-tool aesthetics applied to a personal-shelf product. Not editorial, not artsy, not taste-driven. Refined and intentional, not loud.

**Warmth note.** campfire's "warmth" is emotional, not chromatic. It comes from the product's relationship to the user — their songs, their shelf, their private space, their ownership — never from literal fire, wood, camping, amber glows, or cozy-lifestyle visual cues. The palette stays restrained and precise; warmth lives in tone, copy, and ownership, not in hue.

## Anti-references (visual)

Explicit anti-lanes — campfire must **not** look like:

- **Big-tech corporate**: navy-and-gradient palettes, hero-metric templates (huge number + small label + supporting stats), illustration-heavy marketing, Apple/Microsoft/Salesforce center-of-gravity. campfire is not enterprise software and must not borrow enterprise reassurance signals.
- **Influencer-wellness / tasteful-DTC**: sage-cream-bone palettes, serif logo over hands-photo, soft-pink CTAs, Substack-meets-Glossier. This lane reads "tasteful" but is now generic — campfire is not a lifestyle brand and must not pretend to be.
- **Soft-SaaS default**: gray-50 backgrounds, blue-500 buttons, rounded-lg everywhere, generic shadcn-styled forms. The first reflex when generating "a modern web app" is exactly what campfire must reject.
- **Literal campfire imagery**: firelight gradients, amber or orange glow as decoration, wood textures, camping-gear iconography, cozy-cabin photography. The name informs the *feeling*, not the visual language.

Adjacent traps to refuse:

- Hero-metric template ("0 songs in your repertoire" set in 96px with a supporting stat row).
- Identical card grids of empty-state illustrations.
- Modal as the default answer to any interaction.
- Pro-tool affectations worn as costume: command palettes, keyboard-shortcut overlays, terminal decoration used for swagger rather than function (see Principle 3 — precision is a tone, not a costume).

## Design Principles

1. **Personal shelf, not platform.** Every screen reinforces that the repertoire belongs to the user. No social signals on the MVP. No badges, no streaks, no gamification. The list is theirs and looks like it.

2. **One committed point of view.** Restraint everywhere, except one or two decisions the design holds fully — a single accent, a single typographic voice, a single canvas philosophy. Safe-default compositions (a card grid of identical tiles, a stat row, a generic CTA pill) are refused on principle.

3. **No false credentials, but real polish.** campfire is for amateurs and must not adopt the visual *costume* of professional or expert tools (enterprise navy, pro-audio chrome, command-palette theater) to borrow their authority. This is not a license to look unfinished — precision, refinement, and quality of execution are non-negotiable. The product is precise *because* it respects the user, not because it pretends to be for experts.

4. **Instrument-agnostic surfaces.** No design choice may privilege any one instrument. No guitar iconography as a default state, no piano-keys decorative motif, no genre-coded color. The repertoire is whatever the user plays.

5. **The content is the interface.** As the repertoire grows, the chrome should recede. Empty-state design carries more weight than populated-state design — the latter is just a list of the user's own songs and should let them dominate the surface.

6. **Quiet polish, real presence.** Minimal without being generic, calm without being weak, simple without being forgettable. Every surface should feel obviously considered on second glance — the kind of detail that rewards attention but never demands it.

## Accessibility & Inclusion

Target: **pragmatic WCAG 2.2 AA**. The MVP is a personal project without a formal compliance obligation, but the standard practices apply:

- Text contrast ≥ 4.5:1 against the chosen canvas, ≥ 3:1 for large display type.
- Every interactive element keyboard-operable, with a visible focus indicator that does not rely solely on color.
- `prefers-reduced-motion` is honored — any non-essential animation degrades gracefully.
- Form fields have associated labels and accessible error messages.
- No information conveyed by color alone.

No specific assistive-technology user research has been done. If a real user surfaces a need that pragmatic AA misses, the bar moves to meet them rather than retreating behind the formal target.

## Deliberate deferrals

Decisions intentionally left open and to be resolved when concretely needed, not now:

- **Monetization model for AI evaluation.** Free-at-launch-then-premium vs. premium-from-day-one. Revisit when AI evaluation is concretely planned.
- **Suggestion algorithm during jams.** Intersection of repertoires, thoughtful union, or something else. Revisit when jam sessions are concretely planned.
- **Permanent "group" concept.** Not part of the current plan. Jam sessions are expected to cover ad-hoc gatherings of users without needing a permanent group entity with roles or admin. Reconsider only if direct user-to-user interactions prove insufficient in practice.
