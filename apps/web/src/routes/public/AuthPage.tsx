import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  AccentButton,
  AlphaBadge,
  DesignGlobalStyles,
  FireIcon,
  FormInput,
  GoogleButton,
  MonoLabel,
  Nav,
  NavLink,
  pageBaseStyle,
} from "../../design/primitives";
import { ACCENT, FONT_DISPLAY } from "../../design/tokens";
import {
  confirmEmail,
  confirmPasswordReset,
  mapAuthError,
  requestPasswordReset,
  signInWithEmail,
  signUpWithEmail,
} from "../../features/auth/cognitoEmailPassword";
import { signInWithGoogle } from "../../features/auth/cognitoRedirect";

type AuthMode = "signin" | "signup";

export function AuthPage({ mode }: { mode: AuthMode }): JSX.Element {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = mode === "signin" ? "WELCOME BACK" : "JOIN CAMPFIRE";
  const submitLabel = mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT";
  const swapCopy =
    mode === "signin" ? "No account yet? Create one." : "Already have an account? Sign in.";
  const swapTo = mode === "signin" ? "/signup" : "/signin";

  const finishAuth = async (): Promise<void> => {
    navigate("/onboarding", { replace: true });
  };

  const handleAuth = async (): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      if (recovering) {
        if (resetRequested) {
          await confirmPasswordReset(email, code, password);
          setRecovering(false);
          setResetRequested(false);
          setCode("");
          setError("Password updated. Sign in with your new password.");
          return;
        }
        await requestPasswordReset(email);
        setResetRequested(true);
        return;
      }
      if (awaitingVerification) {
        await confirmEmail(email, code);
        await signInWithEmail(email, password);
        await finishAuth();
        return;
      }
      if (mode === "signup") {
        const result = await signUpWithEmail(email, password);
        if (!result.userConfirmed) {
          setAwaitingVerification(true);
          return;
        }
      }
      await signInWithEmail(email, password);
      await finishAuth();
    } catch (caught) {
      setError(mapAuthError(caught));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void handleAuth();
  };

  return (
    <main style={{ ...pageBaseStyle, display: "flex", flexDirection: "column" }}>
      <DesignGlobalStyles />
      <Nav rightSlot={<NavLink onClick={() => navigate("/")}>BACK</NavLink>} />

      <section
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(80px, 14vw, 130px) clamp(20px, 5vw, 40px) clamp(40px, 6vw, 64px)",
        }}
      >
        <div className="cf-fade-up" style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 10 }}>
            <FireIcon size={20} />
            <span
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 17,
                letterSpacing: "0.07em",
                color: "#fff",
              }}
            >
              CAMPFIRE
            </span>
            <AlphaBadge />
          </div>

          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: "clamp(34px, 7vw, 52px)",
              lineHeight: 0.93,
              letterSpacing: "0.03em",
              color: "#fff",
              marginBottom: 28,
              fontWeight: 400,
            }}
          >
            {title}
          </h2>

          <GoogleButton label="CONTINUE WITH GOOGLE" onClick={() => void signInWithGoogle()} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "18px 0",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#232323" }} />
            <MonoLabel size={9} color="#444">
              OR
            </MonoLabel>
            <div style={{ flex: 1, height: 1, background: "#232323" }} />
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <FormInput
              label="EMAIL"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={setEmail}
              autoFocus
            />
            <FormInput
              label="PASSWORD"
              type="password"
              placeholder={recovering && resetRequested ? "New password" : "Password"}
              value={password}
              onChange={setPassword}
            />
            {(awaitingVerification || resetRequested) && (
              <FormInput
                label="CODE"
                type="text"
                placeholder="Verification code"
                value={code}
                onChange={setCode}
              />
            )}
            <AccentButton type="submit" size="lg" fullWidth disabled={submitting}>
              {submitting
                ? "..."
                : recovering
                  ? resetRequested
                    ? "RESET PASSWORD"
                    : "SEND RESET CODE"
                  : awaitingVerification
                    ? "VERIFY EMAIL"
                    : submitLabel}
            </AccentButton>
          </form>

          {error && (
            <p
              style={{
                marginTop: 14,
                color: "#FF6B6B",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          <p
            style={{
              marginTop: 18,
              fontSize: 13,
              color: "#555",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setRecovering(false);
                setResetRequested(false);
                navigate(swapTo);
              }}
              style={{
                color: ACCENT,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                background: "none",
                border: "none",
                font: "inherit",
                padding: 0,
              }}
            >
              {swapCopy}
            </button>
            {mode === "signin" && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => {
                    setRecovering(true);
                    setResetRequested(false);
                    setError(null);
                  }}
                  style={{
                    color: ACCENT,
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                    background: "none",
                    border: "none",
                    font: "inherit",
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </>
            )}
          </p>
        </div>
      </section>
    </main>
  );
}
