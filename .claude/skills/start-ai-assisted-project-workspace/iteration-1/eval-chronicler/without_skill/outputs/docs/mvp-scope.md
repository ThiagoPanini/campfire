# MVP scope

The smallest version of `campaign-chronicler` that proves the core loop is worth using.

## In scope

1. A user can create a campaign and invite other players to it.
2. Each player has one character per campaign, with a name and a short description.
3. After a session, each player can write a session entry from their character's point of view.
4. The DM can mark a campaign as concluded.
5. When the campaign is concluded, the app generates a single "chronicle" document combining all per-character session entries into a narrative.
6. The chronicle can be read in the web app and exported as a single file (format TBD — likely Markdown for the MVP).

## Explicitly out of scope for MVP

- Maps, dice, initiative, combat tracking.
- Character sheet management or rules lookups.
- Real-time collaboration during a session.
- Mid-campaign chronicle previews per arc.
- Voice-style or per-character tone control beyond what falls out naturally.
- Mobile-native apps. Mobile web is acceptable; native is not in scope.

## What "done" looks like

A remote group of 3+ players can run a real campaign of 3+ sessions end-to-end using only this tool to log entries, and end the campaign with a generated chronicle they would actually want to keep. If that is true, the MVP succeeded.

## Open questions blocking MVP

These are tracked here until they become ADRs:

- Stack (frontend framework, backend language/framework).
- Database.
- Auth model (email + password? magic link? OAuth?).
- Hosting / deploy target.
- How the chronicle is generated — model, prompt structure, where the call lives.

Each of these turns into an ADR once decided.
