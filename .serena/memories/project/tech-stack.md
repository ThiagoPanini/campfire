**Language/Version**: TypeScript 5.x, React 19.2, Node.js 24 LTS

**Build Tool**: Vite 8 with @vitejs/plugin-react

**Primary Dependencies**:
- react: ^19.2.0
- react-dom: ^19.2.0
- lucide-react: ^0.561.0 (icons)
- typescript: ^5.9.3
- vite: ^8.0.0
- mintlify: ^4.2.161 (documentation)

**Development Dependencies**:
- @types/react: ^19.2.7
- @types/react-dom: ^19.2.3

**Styling Approach**: Plain CSS files (no Tailwind, styled-components, or CSS-in-JS)

**Storage**: No backend/auth/storage SDKs
- In-memory React state for auth user and preferences
- Session storage for language and accent preset
- No network calls during documented journeys