# Product Vision — campaign-chronicler

## The problem

Tabletop RPG campaigns produce a lot of memorable moments — improvised deals, near-deaths, betrayals, running jokes — and almost all of it evaporates between sessions. Players half-remember it; the DM remembers a different half. By the time the campaign ends, the group has lived through an epic story but has no artifact of it.

Remote groups have it worse: there is no shared notebook on the table, no battle map photo, no overheard side conversation. Whatever is not written down is lost.

## The vision

`campaign-chronicler` is a web app where each player logs their character's actions, decisions, and reactions session by session — in their character's voice, not as meeting notes. At the end of the campaign, the app weaves all of those entries into a generated long-form chronicle: a document that reads like an in-world history of the party's deeds, not like a log file.

The result is a keepsake. Something a group can re-read years later and say "right, that's what happened."

## Who it is for

- Remote D&D and TTRPG groups, primarily 3–6 players plus a DM.
- Groups that already enjoy the storytelling side of the game more than the optimization side.
- Campaigns that run long enough to be worth chronicling (multi-session arcs and up).

## What it is not

- Not a virtual tabletop. No maps, no dice, no initiative tracker.
- Not a rules reference or character sheet manager.
- Not a generic note-taking app. The structure (per-session, per-character, end-of-campaign chronicle) is the whole point.

## Long-term shape

If the core loop works, natural extensions:

- DM-side session prompts and recap generation.
- Per-arc chronicles, not only end-of-campaign.
- Export formats that feel like real artifacts (printable PDF, ePub).
- Voice-style controls so each character's entries keep a consistent tone.

These are explicitly out of scope for the MVP. See [docs/mvp-scope.md](./docs/mvp-scope.md).
