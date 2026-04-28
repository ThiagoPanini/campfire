# mocks/

Fixtures and (eventually) MSW handlers used to simulate the backend during the alpha.

## Hard rule

**Mocks may only be imported by `features/*/api/*` or by tests.**

Pages, components, hooks, and shared modules must never import from `@mocks/*`. This boundary is what makes the swap to a real backend a localized change: deleting (or replacing) this folder should be enough.

## Layout

- `fixtures/` — typed seed data (users, preferences, future song catalogs).
- `handlers/` — reserved for MSW request handlers when integration tests or Storybook need them.
