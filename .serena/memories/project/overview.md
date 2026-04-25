**Project Name**: Campfire

**Purpose**: Frontend-only web app prototype that turns the Claude Design `campfire-v3` export into a real, responsive web application. It covers Landing, Sign In, Sign Up, Onboarding, and Home pages for tracking songs users know and sharing with others.

**Key Characteristics**:
- Frontend prototype (no backend, no real OAuth, no persistence across refresh)
- In-memory React state for auth user and preferences
- Session storage only for language and accent preset
- Manual acceptance testing (automated tests deferred)
- Responsive design from 360px to 1440px viewports
- Multi-language support (EN/PT) with 5 accent presets
- Respects `prefers-reduced-motion: reduce` for accessibility

**Authoritative Design Inputs**:
- `specs/001-frontend-mvp-prototype/design-reference/project/Campfire Landing.html`
- `specs/001-frontend-mvp-prototype/design-reference/project/src/*` (richer modular app files)
- `specs/001-frontend-mvp-prototype/design-reference/chats/chat1.md` (design intent)
- Root `DESIGN.md` (fallback for Home details)