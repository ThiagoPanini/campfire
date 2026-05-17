import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import "./Field.css";

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  action?: ReactNode;
  error?: string;
  helper?: string;
  inputId?: string;
  label: string;
};

export function Field({
  action,
  error,
  helper,
  inputId,
  label,
  ...props
}: FieldProps) {
  const generatedId = useId();
  const id = inputId ?? generatedId;
  const helperId = helper ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`field${error ? " field--error" : ""}`}>
      <span className="field__header">
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
        {action ? <span className="field__action">{action}</span> : null}
      </span>
      <input
        className="field__input"
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {helper ? (
        <span className="field__note" id={helperId}>
          {helper}
        </span>
      ) : null}
      {error ? (
        <span className="field__error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
