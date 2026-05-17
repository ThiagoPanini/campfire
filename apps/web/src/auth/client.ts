// STUB: temporary client-only auth surface until the FastAPI backend exists.
type SignUpResult =
  | { ok: true }
  | { ok: false; reason: "duplicate" | "network" | "generic" };

type VerifyResult = { ok: true } | { ok: false; reason: "invalid" | "expired" };

type GoogleResult = { ok: true; redirectUrl: string } | { ok: false };

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function signUpWithEmail(
  email: string,
  _password: string,
): Promise<SignUpResult> {
  await sleep(800);

  if (email.toLowerCase().includes("taken@")) {
    return { ok: false, reason: "duplicate" };
  }

  return { ok: true };
}

export async function verifyCode(
  _email: string,
  code: string,
): Promise<VerifyResult> {
  await sleep(600);

  if (code === "123456") {
    return { ok: true };
  }

  if (code === "000000") {
    return { ok: false, reason: "expired" };
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
