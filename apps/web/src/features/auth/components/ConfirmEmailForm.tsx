import { useEffect, useMemo, useState } from "react";
import { AccentButton, AuthFrame, TextInput } from "@shared/ui";
import { translate, type Language } from "@i18n";

type Props = {
  language: Language;
  email: string;
  authSubmitting: boolean;
  expiresInSeconds: number | null;
  resendCooldownSeconds: number | null;
  issuedAt: number | null;
  onConfirm: (email: string, code: string) => Promise<boolean>;
  onResend: (email: string) => Promise<unknown>;
};

function computeRemaining(deadline: number | null): number {
  if (deadline === null) return 0;
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ConfirmEmailForm({
  language,
  email: initialEmail,
  authSubmitting,
  expiresInSeconds,
  resendCooldownSeconds,
  issuedAt,
  onConfirm,
  onResend,
}: Props) {
  const t = translate(language);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const validCode = /^\d{6}$/.test(code);

  const expiresAt = useMemo(() => {
    if (expiresInSeconds === null || issuedAt === null) return null;
    return issuedAt + expiresInSeconds * 1000;
  }, [expiresInSeconds, issuedAt]);

  const cooldownUntil = useMemo(() => {
    if (resendCooldownSeconds === null || issuedAt === null) return null;
    return issuedAt + resendCooldownSeconds * 1000;
  }, [resendCooldownSeconds, issuedAt]);

  const [expiresIn, setExpiresIn] = useState(() => computeRemaining(expiresAt));
  const [cooldown, setCooldown] = useState(() => computeRemaining(cooldownUntil));

  useEffect(() => setExpiresIn(computeRemaining(expiresAt)), [expiresAt]);
  useEffect(() => setCooldown(computeRemaining(cooldownUntil)), [cooldownUntil]);

  useEffect(() => {
    if (expiresIn <= 0 && cooldown <= 0) return;
    const id = window.setInterval(() => {
      setExpiresIn(computeRemaining(expiresAt));
      setCooldown(computeRemaining(cooldownUntil));
    }, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt, cooldownUntil, expiresIn, cooldown]);

  const expired = expiresAt !== null && expiresIn <= 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setError(false);
    if (!validCode || !email) return;
    const ok = await onConfirm(email, code);
    setError(!ok);
  }

  async function resend() {
    if (!email || cooldown > 0) return;
    await onResend(email);
  }

  return (
    <AuthFrame>
      <h1 className="display auth-title">{t.auth.confirmTitle}</h1>
      <p className="auth-copy">{t.auth.confirmCopy}</p>
      <form className="form-stack" onSubmit={submit}>
        <TextInput
          label={t.auth.email}
          placeholder={t.auth.emailPlaceholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoFocus={!email}
        />
        <TextInput
          label={t.auth.confirmCode}
          placeholder="000000"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          error={submitted && !validCode ? t.validation.confirmationCode : undefined}
          autoFocus={Boolean(email)}
        />
        {expiresAt !== null ? (
          <p className={expired ? "error" : "muted auth-note"} aria-live="polite">
            {expired
              ? t.auth.codeExpired
              : t.auth.codeExpiresIn.replace("{time}", formatCountdown(expiresIn))}
          </p>
        ) : null}
        {error ? <p className="error">{t.validation.confirmation}</p> : null}
        <AccentButton type="submit" disabled={authSubmitting || expired}>{t.auth.confirmSubmit}</AccentButton>
      </form>
      <button className="link-button auth-swap" onClick={resend} disabled={cooldown > 0}>
        {cooldown > 0 ? t.auth.resendCountdown.replace("{seconds}", String(cooldown)) : t.auth.resendCode}
      </button>
    </AuthFrame>
  );
}
