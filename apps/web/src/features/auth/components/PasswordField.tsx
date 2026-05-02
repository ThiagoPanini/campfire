import { useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { Language } from "@i18n";
import { translate } from "@i18n";

type Props = {
  language: Language;
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

export function PasswordField({ language, label, placeholder, value, error, onChange }: Props) {
  const t = translate(language);
  const [shown, setShown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function toggle() {
    const input = inputRef.current;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? value.length;
    setShown((current) => !current);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(start, end);
    });
  }

  return (
    <label className="field password-field">
      <span className="mono">{label}</span>
      <span className="password-control">
        <input
          ref={inputRef}
          type={shown ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={toggle}
          aria-pressed={shown}
          aria-label={shown ? t.auth.hidePassword : t.auth.showPassword}
        >
          {shown ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
      {error ? <p className="error">{error}</p> : null}
    </label>
  );
}
