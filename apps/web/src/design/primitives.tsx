import { useState, type CSSProperties, type ReactNode } from "react";

import { ACCENT, BG, FONT_BODY, FONT_DISPLAY, FONT_MONO } from "./tokens";

export const designKeyframes = `
@keyframes cfFlicker {
  0%,100% { transform: scaleX(1) scaleY(1) rotate(-1deg); }
  20%     { transform: scaleX(0.96) scaleY(1.04) rotate(1deg); }
  40%     { transform: scaleX(1.03) scaleY(0.97) rotate(-0.5deg); }
  60%     { transform: scaleX(0.98) scaleY(1.03) rotate(1.5deg); }
  80%     { transform: scaleX(1.02) scaleY(0.98) rotate(-1deg); }
}
@keyframes cfFlicker2 {
  0%,100% { transform: scaleX(1) scaleY(1) rotate(1deg); opacity: 0.9; }
  33%     { transform: scaleX(1.05) scaleY(0.96) rotate(-1deg); opacity: 1; }
  66%     { transform: scaleX(0.95) scaleY(1.05) rotate(0.5deg); opacity: 0.85; }
}
@keyframes cfEmberPulse {
  0%,100% { opacity: 0.55; }
  50%     { opacity: 0.9; }
}
@keyframes cfFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.cf-flame-outer { transform-origin: 50% 100%; animation: cfFlicker 2.2s ease-in-out infinite; }
.cf-flame-inner { transform-origin: 50% 100%; animation: cfFlicker2 1.7s ease-in-out infinite; }
.cf-ember       { animation: cfEmberPulse 1.4s ease-in-out infinite; }
.cf-fade-up     { animation: cfFadeUp 0.5s ease both; }
`;

export function DesignGlobalStyles(): JSX.Element {
  return <style>{designKeyframes}</style>;
}

export const pageBaseStyle: CSSProperties = {
  minHeight: "100dvh",
  background: BG,
  color: "#fff",
  fontFamily: FONT_BODY,
};

export function FireIcon({
  size = 28,
  accent = ACCENT,
}: {
  size?: number;
  accent?: string;
}): JSX.Element {
  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 28 32"
      fill="none"
      style={{ overflow: "visible", flexShrink: 0 }}
      aria-hidden="true"
    >
      <g className="cf-flame-outer">
        <path
          d="M14 30C7.5 30 3 25 3 19C3 12 9 7 11 2C11 7 13.5 9 14 10C14.5 9 16 6 15 1C19 5 25 12 25 19C25 25 20.5 30 14 30Z"
          fill={accent}
        />
      </g>
      <g className="cf-flame-inner">
        <path
          d="M14 26C10 26 8 23 8 20C8 16.5 10.5 14 12 12C12 15 13.5 16 14 17C14.5 16 15.5 14.5 15 12C17.5 14 20 17 20 20.5C20 23.5 17.5 26 14 26Z"
          fill="#FFD166"
        />
      </g>
      <ellipse className="cf-ember" cx="14" cy="26" rx="3" ry="2" fill="#FFF5B0" opacity={0.7} />
    </svg>
  );
}

export function AlphaBadge({ accent = ACCENT }: { accent?: string }): JSX.Element {
  return (
    <span
      style={{
        fontFamily: FONT_MONO,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.18em",
        color: "#000",
        background: accent,
        padding: "3px 9px",
        borderRadius: 20,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        userSelect: "none",
      }}
    >
      ALPHA
    </span>
  );
}

export function MonoLabel({
  children,
  color,
  size = 11,
  style,
}: {
  children: ReactNode;
  color: string;
  size?: number;
  style?: CSSProperties;
}): JSX.Element {
  return (
    <span
      style={{
        fontFamily: FONT_MONO,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function AccentButton({
  children,
  onClick,
  size = "md",
  fullWidth,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  size?: "md" | "lg";
  fullWidth?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
}): JSX.Element {
  const [hovered, setHovered] = useState(false);
  const active = hovered && !disabled;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: active ? "rgba(255,255,255,0.12)" : ACCENT,
        color: active ? "#fff" : "#000",
        fontFamily: FONT_MONO,
        fontSize: size === "lg" ? 13 : 11,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        padding: size === "lg" ? "15px 40px" : "11px 28px",
        borderRadius: 40,
        border: active ? "1px solid rgba(255,255,255,0.25)" : "1px solid transparent",
        transition: "all 0.18s ease",
        whiteSpace: "nowrap",
        minHeight: 48,
        width: fullWidth ? "100%" : undefined,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}): JSX.Element {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "transparent",
        color: hovered ? "#fff" : "#949494",
        fontFamily: FONT_MONO,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        padding: "11px 24px",
        borderRadius: 40,
        border: `1px solid ${hovered ? "#555" : "#2d2d2d"}`,
        transition: "all 0.18s ease",
        minHeight: 48,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function FormInput({
  label,
  type,
  placeholder,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  type: "email" | "password" | "text";
  placeholder?: string;
  value: string;
  onChange: (next: string) => void;
  autoFocus?: boolean;
}): JSX.Element {
  const [focused, setFocused] = useState(false);

  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <MonoLabel size={9} color="#666">
        {label}
      </MonoLabel>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: "#1a1a1a",
          border: `1px solid ${focused ? ACCENT : "#2e2e2e"}`,
          borderRadius: 6,
          color: "#fff",
          fontFamily: FONT_BODY,
          fontSize: 15,
          fontWeight: 400,
          padding: "12px 14px",
          outline: "none",
          transition: "border-color 0.15s ease",
          width: "100%",
        }}
      />
    </label>
  );
}

export function GoogleButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}): JSX.Element {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "12px 20px",
        background: hovered ? "#242424" : "#1e1e1e",
        border: "1px solid #2e2e2e",
        borderRadius: 8,
        color: "#ccc",
        fontFamily: FONT_MONO,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.13em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        cursor: "pointer",
        transition: "background 0.15s ease",
        minHeight: 48,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      {label}
    </button>
  );
}

export function Nav({
  rightSlot,
}: {
  rightSlot?: ReactNode;
}): JSX.Element {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 58,
        background: BG,
        borderBottom: "1px solid #1e1e1e",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(20px, 5vw, 64px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <FireIcon size={22} />
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 20,
            letterSpacing: "0.07em",
            color: "#fff",
            lineHeight: 1,
          }}
        >
          CAMPFIRE
        </span>
        <AlphaBadge />
      </div>
      {rightSlot}
    </nav>
  );
}

export function NavLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(event) => (event.currentTarget.style.color = "#fff")}
      onMouseLeave={(event) => (event.currentTarget.style.color = ACCENT)}
      style={{
        fontFamily: FONT_MONO,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.16em",
        color: ACCENT,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "8px 0",
        transition: "color 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}
