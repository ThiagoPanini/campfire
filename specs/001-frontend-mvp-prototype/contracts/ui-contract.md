# UI Contract: Campfire Frontend MVP Prototype

This feature exposes no backend API. The contract is the browser-facing route, state, and interaction surface.

## Routes

| Route | Screen | Access | Expected Behavior |
|---|---|---|---|
| `/` | Landing | Public | Shows final Claude landing design and primary CTA to sign-up |
| `/signin` | Sign In | Public | Shows sign-in form, Google button, mode swap link |
| `/signup` | Sign Up | Public | Shows sign-up form, Google button, mode swap link |
| `/onboarding` | Onboarding | Protected | If no mock user, redirect to `/`; otherwise show preferences |
| `/home` | Home | Protected | If no mock user, redirect to `/`; otherwise show member panel and update preferences action |

Route aliases may exist internally (`landing`, `signin`, `signup`, `onboarding`, `home`), but URL behavior above is user-visible.

## Navigation Contract

- Landing primary CTA routes to `/signup`.
- Landing nav action routes to `/signin`.
- Auth/onboarding nav action behaves as back to the previous public step where possible.
- Home nav action signs out, clears mock user/preferences, and routes to `/`.
- Auth mode swap links move between `/signin` and `/signup` without page reload.
- `UPDATE PREFERENCES` from `/home` routes to `/onboarding` and hydrates current mock selections.

## Auth Form Contract

### Inputs

| Field | Required | Validation |
|---|---|---|
| Email | Yes | Non-empty and email-shaped |
| Password | Yes | Minimum 8 characters |

### Sign-Up Outcomes

- Valid email/password: create a new mock user, display name derived from email local-part, route to `/onboarding`.
- Invalid fields: show inline localized text and styling; stay on `/signup`.
- Google button: simulate managed identity success, create a new mock user, route to `/onboarding`.

### Sign-In Outcomes

- Seeded credentials: set seeded mock user, route to `/home`.
- Any other valid credentials: show localized auth error; stay on `/signin`.
- Invalid fields: show inline localized text and styling; stay on `/signin`.
- Google button: simulate seeded account sign-in; route to `/home`.

## Onboarding Contract

- Five groups render in the spec order: instruments, genres, context, goals, experience.
- Multi-select chips toggle independently.
- Single-select cards replace previous selection.
- Zero selections are valid.
- Primary action shows localized saving label for at least 600 ms, then routes to `/home`.
- Secondary skip action routes to `/home` without modifying existing preferences.
- Update-mode hydrates all selected chips/cards from current in-memory preferences.

## Home Contract

- Shows `CAMPFIRE · HOME` kicker, personalized welcome headline, supporting paragraph, and compact member panel.
- Member panel distinguishes first-login and returning states.
- Long email values wrap without overflow.
- `UPDATE PREFERENCES` routes to `/onboarding`.
- Sign-out clears in-memory mock session and routes to `/`.

## Language Contract

- Supported languages: `en`, `pt`.
- Default: `en`.
- Language selection persists in `sessionStorage` for the current tab.
- Switching language updates all visible copy on the current screen without losing form fields or onboarding selections.
- Context and goal catalog labels remain intentionally untranslated where specified.

## Accent Contract

- Supported presets: `EMBER`, `FLAME`, `GOLD`, `COPPER`, `BRASS`.
- Default: `COPPER`.
- Accent selection persists in `sessionStorage` for the current tab.
- Switching accent updates every accent-driven element on the current screen immediately.

## Refresh Contract

- Full refresh clears route, mock auth user, and preference state.
- After refresh, app shows landing.
- Language and accent survive refresh within the same tab.

## Network Contract

During documented user journeys, the app must not make network requests to:

- Authentication providers
- Storage/database backends
- Analytics endpoints

Font loading and development-server asset requests are allowed.

## Accessibility Contract

- All form controls have visible labels.
- Buttons and form fields have visible focus states.
- Error messages include text and styling.
- Decorative fire icon next to wordmark is `aria-hidden="true"`.
- Primary journeys are keyboard navigable.
- `prefers-reduced-motion: reduce` suppresses decorative entrance and flame animation.
