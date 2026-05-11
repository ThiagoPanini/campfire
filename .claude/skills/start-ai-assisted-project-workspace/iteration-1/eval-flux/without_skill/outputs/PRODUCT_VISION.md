# Product vision — flux

## The problem

People who use focus timers (Pomodoro and similar) generally know how many sessions they did, but not what those sessions added up to. The gap between *intended* time allocation ("I want to spend most of my week on deep work for project X") and *actual* time allocation ("I spent 70% of my focus sessions on email triage") is invisible. You can't course-correct what you can't see.

## The product

flux is a Pomodoro-style focus timer with one twist: every completed session is tagged with what you worked on. Over days and weeks, flux produces a heatmap showing where your focused time actually went — by tag, by day-of-week, by hour-of-day.

The point is not productivity theater. The point is honest data about how you spend the hours you said were important.

## Principles

1. **Friction-light logging.** If tagging a session takes more than a few seconds, nobody will do it. Reuse tags. Suggest them. Never block.
2. **Honest, not flattering.** The heatmap shows what happened. It doesn't gamify, doesn't shame.
3. **Personal, not social.** No streaks, no leaderboards, no sharing — at least not in the MVP. The user is the only audience.
4. **The timer is sacred.** Whatever else flux does, the timer must work reliably. A focus tool you don't trust during a focus session is worse than no tool.

## Out of scope (for now)

- Team features.
- Calendar/integration syncs.
- Mobile-native apps (the web app should work well on mobile, but no native shell yet).
- AI-generated insights ("you're spending too much time on X"). The heatmap should speak for itself.

## North-star MVP

A user can:
1. Start a focus session (default 25 min).
2. Tag it before, during, or after.
3. See a heatmap of the last 4 weeks of sessions by tag.

When that flow works end-to-end and the user trusts it for one full week, the MVP is done.
