**When Completing a Task**:

1. **Code Quality**:
   - Ensure TypeScript strict mode compliance (no `any` types)
   - Follow component naming conventions (PascalCase)
   - Maintain CSS structure (no inline styles unless necessary)

2. **Testing & Verification**:
   - Manual acceptance: test feature across responsive viewports (360px, mobile, desktop)
   - Test multi-language support if copy is affected
   - Test accent preset variations if styling is affected
   - Verify no network requests during documented journeys
   - Check `prefers-reduced-motion: reduce` behavior if motion/transitions added

3. **Before Committing**:
   - Run `npm run build` to verify TypeScript compilation
   - Check for any type errors or warnings
   - Update relevant documentation in `specs/` or `docs/` if needed
   - Use /git-commit skill for organized, conventional commits

4. **Documentation**:
   - Update Mintlify docs if feature/behavior changes
   - Update design reference notes if new patterns emerge
   - Keep specs in sync with implementation

5. **Performance**:
   - Verify first journey remains usable in under 90 seconds
   - Ensure route transitions feel instant
   - Check for unnecessary re-renders in components