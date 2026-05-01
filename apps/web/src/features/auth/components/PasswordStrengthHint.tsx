import type { Language } from "@i18n";
import { translate } from "@i18n";
import { passwordChecks } from "../validation";

type Props = {
  language: Language;
  password: string;
};

export function PasswordStrengthHint({ language, password }: Props) {
  const t = translate(language);
  const checks = passwordChecks(password);
  const met = checks.filter((check) => check.ok).length;

  return (
    <div className="password-hint" aria-live="polite">
      <div className="password-meter" data-score={met} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p>{checks.every((check) => check.ok) ? t.validation.passwordStrong : t.validation.password}</p>
    </div>
  );
}
