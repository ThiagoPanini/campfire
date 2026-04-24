import { describe, it, expect } from "vitest";
import { router } from "../../src/app/router";

// ---------------------------------------------------------------------------
// Route inventory - fails if unplanned routes are introduced
//
// This test documents the expected route shape for the MVP.
// When adding a new intentional route, add it to ALLOWED_ROUTES below.
// ---------------------------------------------------------------------------

const ALLOWED_ROUTES = new Set([
  "/",
  "/signin",
  "/signup",
  "/auth/callback",
  "/onboarding",
  "/app",
  "/app/me",
]);

describe("route inventory", () => {
  it("all routes in the router are on the allowed list", () => {
    const definedPaths = router.routes
      .map((r) => r.path)
      .filter((p): p is string => typeof p === "string");

    const unexpected = definedPaths.filter((path) => !ALLOWED_ROUTES.has(path));

    expect(unexpected).toEqual([]);
  });

  it("all allowed MVP routes exist in the router", () => {
    const mandatoryMvpRoutes = ["/", "/signin", "/signup", "/auth/callback", "/onboarding", "/app"];
    const definedPaths = new Set(
      router.routes
        .map((r) => r.path)
        .filter((p): p is string => typeof p === "string"),
    );

    const missing = mandatoryMvpRoutes.filter((p) => !definedPaths.has(p));
    expect(missing).toEqual([]);
  });
});
