import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function TextInput({ label, error, ...props }: Props) {
  return (
    <label className="field">
      <span className="mono">{label}</span>
      <input aria-invalid={Boolean(error)} {...props} />
      {error ? <p className="error">{error}</p> : null}
    </label>
  );
}
