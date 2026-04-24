import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import { ProtectedRoute } from "../../src/routes/protected/ProtectedRoute";
import { useMe } from "../../src/features/me/useMe";
import { sessionFixture } from "./auth-test-helpers";

vi.mock("../../src/features/me/useMe", () => ({
  useMe: vi.fn(),
}));

const SESSION_KEY = "campfire.session";

function setValidSession(): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionFixture()));
}

function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

function mockMe(onboardingStatus: "required" | "completed" | "deferred"): void {
  vi.mocked(useMe).mockReturnValue({
    data: {
      user: { id: "user_123", email: "ash@example.com", displayName: "Ash Rivera", status: "active", lastLoginAt: new Date().toISOString() },
      auth: { email: "ash@example.com", emailVerified: true, methods: ["cognito"] },
      onboarding: {
        status: onboardingStatus,
        completedAt: onboardingStatus === "completed" ? new Date().toISOString() : null,
        deferredAt: onboardingStatus === "deferred" ? new Date().toISOString() : null,
      },
      methods: ["cognito"],
      bootstrap: { firstLogin: false },
      firstLogin: false,
    },
    isLoading: false,
    error: null,
  } as ReturnType<typeof useMe>);
}

describe("AppHome routing (US4)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetAllMocks();
  });

  it("authenticated user with completed onboarding enters home directly", () => {
    setValidSession();
    mockMe("completed");

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route path="/onboarding" element={<div>Onboarding</div>} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Home</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("Onboarding")).not.toBeInTheDocument();
  });

  it("authenticated user with deferred onboarding enters home directly", () => {
    setValidSession();
    mockMe("deferred");

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route path="/onboarding" element={<div>Onboarding</div>} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Home</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("unauthenticated user accessing home is redirected to sign-in", () => {
    clearSession();

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route path="/signin" element={<div>Sign In</div>} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Home</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("session clearing redirects protected routes to sign-in", () => {
    // Start authenticated
    setValidSession();
    mockMe("completed");

    // Now clear session (simulate logout)
    clearSession();

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route path="/signin" element={<div>Sign In</div>} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Home</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("me loading state shows no protected content", () => {
    setValidSession();
    vi.mocked(useMe).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useMe>);

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Home</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });
});
