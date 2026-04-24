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
      onboarding: { status: onboardingStatus, completedAt: null, deferredAt: null },
      methods: ["cognito"],
      bootstrap: { firstLogin: onboardingStatus === "required" },
      firstLogin: onboardingStatus === "required",
    },
    isLoading: false,
    error: null,
  } as ReturnType<typeof useMe>);
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetAllMocks();
  });

  it("redirects unauthenticated visitors from /app to the sign-in page", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route path="/signin" element={<div>Sign In</div>} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Protected</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("redirects unauthenticated visitors from /onboarding to the sign-in page", () => {
    render(
      <MemoryRouter initialEntries={["/onboarding"]}>
        <Routes>
          <Route path="/signin" element={<div>Sign In</div>} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <div>Onboarding</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("redirects authenticated user with onboarding required from /app to /onboarding", () => {
    setValidSession();
    mockMe("required");

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route path="/onboarding" element={<div>Onboarding Page</div>} />
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

    expect(screen.getByText("Onboarding Page")).toBeInTheDocument();
  });

  it("renders protected content for authenticated user with onboarding completed", () => {
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

  it("renders protected content for authenticated user with onboarding deferred", () => {
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

  it("allows authenticated user to access /onboarding regardless of status", () => {
    setValidSession();
    mockMe("required");

    render(
      <MemoryRouter initialEntries={["/onboarding"]}>
        <Routes>
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <div>Onboarding</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Onboarding")).toBeInTheDocument();
  });
});
