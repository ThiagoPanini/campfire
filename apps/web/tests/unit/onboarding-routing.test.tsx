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
      bootstrap: { firstLogin: onboardingStatus === "required" },
      firstLogin: onboardingStatus === "required",
    },
    isLoading: false,
    error: null,
  } as ReturnType<typeof useMe>);
}

describe("onboarding routing via ProtectedRoute", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetAllMocks();
  });

  it("routes onboarding-required user from /app to /onboarding", () => {
    setValidSession();
    mockMe("required");

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

    expect(screen.getByText("Onboarding")).toBeInTheDocument();
  });

  it("allows onboarding-completed user to access /app", () => {
    setValidSession();
    mockMe("completed");

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

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("allows onboarding-deferred user to access /app", () => {
    setValidSession();
    mockMe("deferred");

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

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("keeps onboarding-required user on /onboarding (no double redirect)", () => {
    setValidSession();
    mockMe("required");

    render(
      <MemoryRouter initialEntries={["/onboarding"]}>
        <Routes>
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <div>Onboarding Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Onboarding Page")).toBeInTheDocument();
  });

  it("uses me.onboarding.status as the routing source, not bootstrap.firstLogin", () => {
    setValidSession();
    // Simulate a state where firstLogin is false but onboarding is still required
    vi.mocked(useMe).mockReturnValue({
      data: {
        user: { id: "u1", email: "x@x.com", displayName: "X", status: "active", lastLoginAt: "" },
        auth: { email: "x@x.com", emailVerified: true, methods: ["cognito"] },
        onboarding: { status: "required", completedAt: null, deferredAt: null },
        methods: ["cognito"],
        bootstrap: { firstLogin: false },
        firstLogin: false,
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMe>);

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

    expect(screen.getByText("Onboarding")).toBeInTheDocument();
  });
});
