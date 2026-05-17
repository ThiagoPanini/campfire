import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./Button.css";

type ButtonVariant = "primary" | "outline" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  children,
  className = "",
  disabled,
  fullWidth = false,
  isLoading = false,
  loadingLabel,
  variant = "primary",
  ...props
}: ButtonProps) {
  const buttonClassName = [
    "button",
    `button--${variant}`,
    fullWidth ? "button--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={buttonClassName}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? loadingLabel ?? children : children}
    </button>
  );
}
