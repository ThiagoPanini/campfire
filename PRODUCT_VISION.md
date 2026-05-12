# Product Vision — campfire

> Source of truth for **what** campfire is, **for whom**, and **why**. MVP delivery scope lives in [docs/mvp-scope.md](./docs/mvp-scope.md).

## Problem

Amateur musicians who play casually — alone at home, or occasionally with friends — have no good place to track what they are learning. General-purpose note apps don't know what a song is; streaming services know songs but don't know what *you* play; social music networks are tuned to passive consumption, not active practice. The gap is sharper the moment two or more amateurs try to play together: there is no shared surface that knows each person's repertoire and can use that knowledge to make the session better.

campfire closes that gap. It is first a personal repertoire log, and then — once friends are on the platform — a facilitator for the shared moments where those repertoires meet.

## Target user

**Primary**: the amateur musician who plays casually, alone or with a small circle of friends, and wants a personal record of the songs they are learning on one or more instruments. Not performing professionally. Not enrolled in a formal program. Motivated by enjoyment, attachment to specific songs, and the social pleasure of playing with others.

campfire is **instrument-agnostic from day one** — each repertoire entry declares its instrument, and the product does not privilege any particular one. The platform is for guitarists, pianists, vocalists, drummers, and anyone else in the same shape of user.

**Secondary** (implied by the source): the friends of a primary user. They join because someone they already play with invited them; their first value is their own repertoire, not the network. The product grows by friend graphs, not by virality.

## "Aha" moments

campfire has two ahas at different scales. Both are deliberate: the near-term one is what a real human meets when the MVP ships; the long-term one is what justifies the product's existence beyond a repertoire log.

**Near-term aha (reachable in the MVP)** — *the first time a user logs a song and the repertoire feels like theirs.* A clean, lightweight, personal shelf of the music they are currently learning. No generic note-app overhead, no streaming-service noise. This is the aha the MVP must actually land; if it doesn't, no later feature recovers it.

**Long-term aha (post-MVP)** — *the first jam session where campfire suggests a song that everyone present has in their repertoire, and they actually play it.* This is the moment campfire stops being "a place where I list songs" and becomes "the thing that makes our jam sessions better." It depends on the friend graph and jam sessions arriving, but it is the experience that defines campfire's identity.

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

Monetization of AI evaluation (free at launch and premium later, vs. premium from day one) is deliberately deferred. The decision will be made when this phase is concretely planned, not now.

Repertoire logging, friend graph, jams, and recordings remain free for the foreseeable future. AI evaluation is the candidate premium surface.

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

## Deliberate deferrals

Decisions intentionally left open and to be resolved when concretely needed, not now:

- **Monetization model for AI evaluation.** Free-at-launch-then-premium vs. premium-from-day-one. Revisit when AI evaluation is concretely planned.
- **Suggestion algorithm during jams.** Intersection of repertoires, thoughtful union, or something else. Revisit when jam sessions are concretely planned.
- **Permanent "group" concept.** Not part of the current plan. Jam sessions are expected to cover ad-hoc gatherings of users without needing a permanent group entity with roles or admin. Reconsider only if direct user-to-user interactions prove insufficient in practice.
