// STUB: temporary client-only auth surface until the FastAPI backend exists.
import { deriveUsernameFromEmail, setSession } from "./session";

type SignUpResult =
  | { ok: true }
  | { ok: false; reason: "duplicate" | "network" | "generic" };

type SignInResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "network" | "generic" };

type VerifyResult = { ok: true } | { ok: false; reason: "invalid" | "expired" };

type GoogleResult = { ok: true; redirectUrl: string } | { ok: false };

type PendingSignUp = {
  email: string;
  username: string;
};

let pendingSignUp: PendingSignUp | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function signUpWithEmail(
  email: string,
  _password: string,
  username: string,
): Promise<SignUpResult> {
  await sleep(800);

  if (email.toLowerCase().includes("taken@")) {
    return { ok: false, reason: "duplicate" };
  }

  pendingSignUp = { email: email.trim(), username: username.trim() };
  return { ok: true };
}

export async function signInWithEmail(
  email: string,
  _password: string,
): Promise<SignInResult> {
  await sleep(800);

  if (email.toLowerCase().includes("invalid@")) {
    return { ok: false, reason: "invalid" };
  }

  const trimmedEmail = email.trim();
  setSession({
    username: deriveUsernameFromEmail(trimmedEmail),
    email: trimmedEmail,
    joinedAt: new Date().toISOString(),
  });

  return { ok: true };
}

export async function verifyCode(
  email: string,
  code: string,
): Promise<VerifyResult> {
  await sleep(600);

  if (code === "000000") {
    return { ok: false, reason: "expired" };
  }

  if (code === "123456") {
    const trimmedEmail = email.trim();
    const username =
      pendingSignUp && pendingSignUp.email === trimmedEmail
        ? pendingSignUp.username
        : deriveUsernameFromEmail(trimmedEmail);

    setSession({
      username,
      email: trimmedEmail,
      joinedAt: new Date().toISOString(),
    });
    pendingSignUp = null;
    return { ok: true };
  }

  return { ok: false, reason: "invalid" };
}

export async function resendCode(_email: string): Promise<void> {
  await sleep(400);
}

export async function signInWithGoogle(): Promise<GoogleResult> {
  await sleep(300);
  window.alert("Google OAuth não implementado");

  // TODO: integrate the real Google OAuth flow when the auth backend exists.
  return Promise.reject(new Error("google oauth not implemented"));
}
