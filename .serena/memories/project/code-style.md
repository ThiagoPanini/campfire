**TypeScript Configuration**:
- Target: ES2022
- Strict mode enabled
- JSX: react-jsx
- Module: ESNext
- Module resolution: Bundler
- No JavaScript allowed (allowJs: false)

**Code Organization**:
- Component-based architecture
- Directory structure:
  - `src/app/`: Main App.tsx, routes, session store
  - `src/components/`: Reusable UI components (buttons, forms, icons, nav, controls)
  - `src/data/`: Data catalogs, copy strings, mock data
  - `src/screens/`: Page components (Landing, SignIn, SignUp, Onboarding, Home)
  - `src/styles/`: Global CSS, design tokens, motion preferences
  - `src/main.tsx`: Entry point

**Naming Conventions**:
- PascalCase for React components and files
- camelCase for utilities and data files
- UPPER_CASE for constants

**Documentation**:
- Mintlify for docs-as-code
- `docs.json` for configuration
- `docs/` directory for feature documentation