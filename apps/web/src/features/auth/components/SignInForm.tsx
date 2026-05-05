import { useState } from "react";
import { AccentButton, AuthFrame, Divider, TextInput } from "@shared/ui";
import { GoogleMark } from "@shared/icons/GoogleMark";
import { translate, type Language } from "@i18n";
import { validateSignIn } from "../validation";
import { PasswordField } from "./PasswordField";

type Props = {
  language: Language;
  onSubmit: (email: string, password: string) => Promise<false | "authenticated" | "confirmation_required">;
  onGoogle: () => Promise<"redirecting" | "failed">;
  onSwap: () => void;
  googleEnabled: boolean;
  authSubmitting: boolean;
};

export function SignInForm({ language, onSubmit, onGoogle, onSwap, googleEnabled, authSubmitting }: Props) {
  const t = translate(language);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [credentialError, setCredentialError] = useState(false);
  const [googleError, setGoogleError] = useState(false);
  const [googleRedirecting, setGoogleRedirecting] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const valid = validateSignIn(email, password);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setCredentialError(false);
    setConfirmationRequired(false);
    if (!valid.email || !valid.password) return;
    const result = await onSubmit(email, password);
    if (result === "confirmation_required") {
      setConfirmationRequired(true);
      return;
    }
    setCredentialError(!result);
  }

  async function google() {
    setCredentialError(false);
    setGoogleError(false);
    setGoogleRedirecting(true);
    const result = await onGoogle();
    if (result === "failed") {
      setGoogleRedirecting(false);
      setGoogleError(true);
    }
  }

  return (
    <AuthFrame>
      <h1 className="display auth-title">{t.auth.signinTitle}</h1>
      <form className="form-stack" onSubmit={submit}>
        <TextInput label={t.auth.email} placeholder={t.auth.emailPlaceholder} value={email} onChange={(event) => setEmail(event.target.value)} error={submitted && !valid.email ? t.validation.email : undefined} autoFocus />
        <PasswordField language={language} label={t.auth.password} placeholder={t.auth.passwordPlaceholder} value={password} onChange={setPassword} error={submitted && !valid.password ? t.validation.password : undefined} />
        {confirmationRequired ? <p className="muted auth-note">{t.auth.confirmationRequired}</p> : null}
        {credentialError ? <p className="error">{t.validation.credentials}</p> : null}
        {googleError ? <p className="error">{t.auth.googleFailed}</p> : null}
        <AccentButton type="submit" disabled={authSubmitting}>{t.auth.signin}</AccentButton>
      </form>
      <Divider>{t.auth.or}</Divider>
      {(googleEnabled || import.meta.env.DEV) ? (
        <button
          className="google-button"
          onClick={google}
          disabled={authSubmitting || googleRedirecting || !googleEnabled}
          title={!googleEnabled ? t.auth.googleUnavailable : undefined}
        >
          <GoogleMark />{googleRedirecting ? t.auth.googleRedirecting : t.auth.google}
        </button>
      ) : null}
      <button className="link-button auth-swap" onClick={onSwap}>{t.auth.toSignup}</button>
    </AuthFrame>
  );
}
