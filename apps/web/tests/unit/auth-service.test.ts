import { vi, describe, it, expect, beforeEach } from "vitest";

import { mapAuthError } from "../../src/features/auth/cognitoEmailPassword";

// amazon-cognito-identity-js is a third-party SDK - mock the module entirely
vi.mock("amazon-cognito-identity-js", () => ({
  CognitoUserPool: vi.fn(),
  CognitoUser: vi.fn(),
  CognitoUserAttribute: vi.fn(),
  AuthenticationDetails: vi.fn(),
}));

vi.mock("../../src/features/auth/session", () => ({
  persistSessionFromTokens: vi.fn(),
  signOut: vi.fn(),
  beginGoogleSignIn: vi.fn(),
  completeRedirectSignIn: vi.fn(),
  isAuthenticated: vi.fn(() => false),
  getSession: vi.fn(() => null),
  subscribeToSessionChanges: vi.fn(() => () => undefined),
}));

// ---------------------------------------------------------------------------
// mapAuthError - friendly error mapping
// ---------------------------------------------------------------------------

describe("mapAuthError", () => {
  it("maps NotAuthorizedException to credential error message", () => {
    const error = Object.assign(new Error("Wrong credentials"), { name: "NotAuthorizedException" });
    expect(mapAuthError(error)).toBe("The email or password was not accepted.");
  });

  it("maps UserNotConfirmedException to verification message", () => {
    const error = Object.assign(new Error("Not confirmed"), { name: "UserNotConfirmedException" });
    expect(mapAuthError(error)).toBe("Please verify your email before signing in.");
  });

  it("maps UsernameExistsException to account-exists message", () => {
    const error = Object.assign(new Error("Exists"), { name: "UsernameExistsException" });
    expect(mapAuthError(error)).toBe("An account already exists for that email.");
  });

  it("maps CodeMismatchException to code-mismatch message", () => {
    const error = Object.assign(new Error("Bad code"), { name: "CodeMismatchException" });
    expect(mapAuthError(error)).toBe("That verification code was not accepted.");
  });

  it("maps ExpiredCodeException to expired-code message", () => {
    const error = Object.assign(new Error("Expired"), { name: "ExpiredCodeException" });
    expect(mapAuthError(error)).toBe("That code has expired. Request a new one and try again.");
  });

  it("returns the error message for unknown named errors", () => {
    const error = new Error("Something broke");
    expect(mapAuthError(error)).toBe("Something broke");
  });

  it("returns a generic message for non-Error unknowns", () => {
    expect(mapAuthError("random string")).toBe("Authentication failed. Please try again.");
  });
});

// ---------------------------------------------------------------------------
// Session storage (non-Cognito paths)
// ---------------------------------------------------------------------------

describe("session storage", () => {
  const SESSION_KEY = "campfire.session";

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("localStorage is empty on a fresh test", () => {
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("stores and reads back a session directly", () => {
    const session = {
      accessToken: "tok",
      displayName: "Ash Rivera",
      email: "ash@example.com",
      expiresAt: Date.now() + 60_000,
    };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    const raw = window.localStorage.getItem(SESSION_KEY);
    expect(JSON.parse(raw!).accessToken).toBe("tok");
  });
});
