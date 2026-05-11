# MVP scope

The smallest version of flux that earns the right to exist.

## In scope

1. **Start a focus session.** Default 25 minutes, configurable per-session.
2. **Tag a session.** Free-form text, with autocomplete from previous tags. Tagging is allowed before, during, or after the session.
3. **Session history.** A list of completed sessions with their tags and timestamps.
4. **Heatmap view.** Last 4 weeks of sessions, aggregated by tag. Two views minimum:
   - Tag breakdown (which tags consumed which share of focused time).
   - Day-of-week × hour-of-day grid (when did focused time actually happen).
5. **One user.** No accounts, no auth, no sharing — local-first or single-tenant on a hosted backend.

## Out of scope (explicitly deferred)

- Multiple users, accounts, auth.
- Teams, sharing, social features.
- Mobile-native apps.
- Calendar integrations.
- AI-generated commentary or recommendations.
- Streaks, gamification, notifications beyond the timer itself.
- Theming, customization beyond session length.

## Done definition

The MVP is done when the author of flux uses it for one full week, trusts the timer, tags sessions consistently, and finds the heatmap interesting enough to look at on Friday.
