import { useState } from "react";
import { AccentButton } from "../components/buttons";
import { Divider, AuthFrame, TextInput } from "../components/forms";
import { GoogleMark } from "../components/GoogleMark";
import type { Language } from "../data/copy";
import { copy } from "../data/copy";
import { validateAuth } from "../app/session-store";

type Props = {
  language: Language;
  onSubmit: (email: string, password: string) => void;
  onGoogle: () => void;
  onSwap: () => void;
};

export function SignUp({ language, onSubmit, onGoogle, onSwap }: Props) {
  const t = copy[language];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const valid = validateAuth(email, password);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (valid.email && valid.password) onSubmit(email, password);
  }

  return (
    <AuthFrame>
      <h1 className="display auth-title">{t.auth.signupTitle}</h1>
      <form className="form-stack" onSubmit={submit}>
        <TextInput label={t.auth.email} placeholder={t.auth.emailPlaceholder} value={email} onChange={(event) => setEmail(event.target.value)} error={submitted && !valid.email ? t.validation.email : undefined} autoFocus />
        <TextInput label={t.auth.password} type="password" placeholder={t.auth.passwordPlaceholder} value={password} onChange={(event) => setPassword(event.target.value)} error={submitted && !valid.password ? t.validation.password : undefined} />
        <AccentButton type="submit">{t.auth.signup}</AccentButton>
      </form>
      <Divider>{t.auth.or}</Divider>
      <button className="google-button" onClick={onGoogle}><GoogleMark />{t.auth.google}</button>
      <button className="link-button auth-swap" onClick={onSwap}>{t.auth.toSignin}</button>
    </AuthFrame>
  );
}
