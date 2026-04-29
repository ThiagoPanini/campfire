# UI Contract: Authenticated Home and Removed Onboarding

## Routes

| Path | Auth State | Expected Result |
|---|---|---|
| `/` | unauthenticated | Landing page |
| `/` | authenticated | Home page, if existing authenticated landing bounce is present or added for stale route handling |
| `/signin` | unauthenticated | Sign in page |
| `/signup` | unauthenticated | Sign up page |
| `/home` | authenticated | New Campfire Control Room Home |
| `/home` | unauthenticated | Redirect/replace to `/` |
| `/repertoire` | authenticated | Existing repertoire page |
| `/repertoire` | unauthenticated | Redirect/replace to `/` |
| `/onboarding` | authenticated | Redirect/replace to `/home`; no onboarding screen |
| `/onboarding` | unauthenticated | Redirect/replace to `/`; no onboarding screen |

## Sign-Up and Sign-In

- Successful email/password sign-up navigates directly to `/home`.
- Successful Google-stub sign-up navigates directly to `/home`.
- Successful sign-in continues to navigate to `/home`.
- No intermediate onboarding or preference save step exists.

## Home Sections

1. Hero
   - `CAMPFIRE · DASHBOARD`
   - `YOUR CAMPFIRE CONTROL ROOM.`
   - Primary CTA: `Add songs to repertoire`
   - Secondary CTA: `Open repertoire`
   - Disabled tertiary CTA: `Enter a jam session` with `SOON`

2. Repertoire status
   - `Total songs`
   - `Added · last 7 days`
   - `By status`: Ready / Practicing / Learning counts and segmented bar
   - No wishlist tile

3. You added last
   - Populated state: title, artist, instrument, proficiency, relative added
     time, open/edit actions if existing routes support them.
   - Empty state: `Your repertoire is empty.`, explanatory copy, `Add your
     first song`.

4. What's coming to Campfire
   - Jam Sessions
   - Shared Setlists
   - Practice Queue
   - Circle Members
   - All disabled, locked, non-interactive.

5. Optional account footer
   - May show email/member date.
   - Must not show `Update preferences`.

## Forbidden Visible Copy

The authenticated app must not show:
- onboarding
- one last thing
- current preferences
- update preferences
- instruments/genres/context/experience as user preference summary

Repertoire entry `instrument` labels remain allowed.

## Responsive Contract

- At or below 980px: hero stacks, CTA stack stretches, status/future grids
  reduce columns.
- At or below 560px: status grid and future rail are one column.
- Text wraps without overlapping adjacent controls.
