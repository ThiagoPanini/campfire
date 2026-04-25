import type { InputHTMLAttributes, PropsWithChildren } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function TextInput({ label, error, ...props }: TextInputProps) {
  return (
    <label className="field">
      <span className="mono">{label}</span>
      <input aria-invalid={Boolean(error)} {...props} />
      {error ? <p className="error">{error}</p> : null}
    </label>
  );
}

export function Divider({ children }: PropsWithChildren) {
  return <div className="divider mono">{children}</div>;
}

export function AuthFrame({ children }: PropsWithChildren) {
  return <main className="page"><section className="auth-lane fade-up">{children}</section></main>;
}
