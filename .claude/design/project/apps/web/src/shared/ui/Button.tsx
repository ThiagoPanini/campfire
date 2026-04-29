import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { large?: boolean }>;

export function AccentButton({ children, large, className = "", ...props }: ButtonProps) {
  return <button className={`accent-button ${large ? "large" : ""} ${className}`} {...props}>{children}</button>;
}

export function GhostButton({ children, className = "", ...props }: ButtonProps) {
  return <button className={`ghost-button ${className}`} {...props}>{children}</button>;
}

export function AlphaBadge() {
  return <span className="alpha">ALPHA</span>;
}
