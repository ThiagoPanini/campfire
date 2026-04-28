// Shared UI primitives for Campfire: logo, icons, avatar, chips, etc.

function Logo({ size = 28, showWordmark = true, color = "var(--firelit)" }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <radialGradient id={`lg-${size}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fff0c2" />
            <stop offset="40%" stopColor="#ff9c45" />
            <stop offset="100%" stopColor="#d9361e" />
          </radialGradient>
        </defs>
        {/* Flame */}
        <path
          d="M16 3 C 12 9 9 12 10 17 C 8 14 7 11 8 8 C 5 12 4 17 7 21 C 5 20 4 18 4 16 C 3 21 7 27 14 28 C 18 28 22 26 24 22 C 26 17 23 12 20 10 C 22 13 22 16 20 18 C 22 14 21 10 19 8 C 19 12 18 14 16 15 C 17 12 17 8 16 3 Z"
          fill={`url(#lg-${size})`}
        />
        {/* Log */}
        <rect x="6" y="27" width="20" height="3" rx="1.5" fill="#2a1509" />
      </svg>
      {showWordmark && (
        <span
          style={{
            fontFamily: "var(--f-display)",
            fontWeight: 700,
            fontSize: size * 0.62,
            letterSpacing: "-0.01em",
            color,
          }}
        >
          Campfire
        </span>
      )}
    </div>
  );
}

// Icon set — minimal line icons (20×20)
const ICON = {
  tonight: "M10 2 C 8 6 6 8 7 11 C 5 9 5 7 5.5 5 C 4 8 3.5 11 5 13.5 C 3.5 13 3 11.5 3 10 C 2 14 5 17 10 17 C 14 17 16 14.5 16 11 C 16 8 14 6 12 5 C 13 7 13 9 12 10 C 13 8 12.5 6 11 5 C 11 7 10 8.5 9 9 C 9.5 7 9.5 5 10 2 Z",
  songs: "M6 15 C 6 16.1 5.1 17 4 17 C 2.9 17 2 16.1 2 15 C 2 13.9 2.9 13 4 13 C 5.1 13 6 13.9 6 15 Z M18 13 C 18 14.1 17.1 15 16 15 C 14.9 15 14 14.1 14 13 C 14 11.9 14.9 11 16 11 C 17.1 11 18 11.9 18 13 Z M6 15 L 6 5 L 18 3 L 18 13",
  groups: "M7 9 C 8.66 9 10 7.66 10 6 C 10 4.34 8.66 3 7 3 C 5.34 3 4 4.34 4 6 C 4 7.66 5.34 9 7 9 Z M14 9 C 15.66 9 17 7.66 17 6 C 17 4.34 15.66 3 14 3 C 12.34 3 11 4.34 11 6 C 11 7.66 12.34 9 14 9 Z M1 16 C 1 12.68 3.68 10 7 10 C 10.32 10 13 12.68 13 16 M19 16 C 19 13.5 17.5 11 14.5 11",
  history: "M10 3 C 6.13 3 3 6.13 3 10 C 3 13.87 6.13 17 10 17 C 13.87 17 17 13.87 17 10 M3 10 L 1 8 M3 10 L 5 8 M10 6 L 10 10 L 13 12",
  profile: "M10 10 C 12.21 10 14 8.21 14 6 C 14 3.79 12.21 2 10 2 C 7.79 2 6 3.79 6 6 C 6 8.21 7.79 10 10 10 Z M2 18 C 2 13.58 5.58 10 10 10 C 14.42 10 18 13.58 18 18",
  search: "M9 3 A 6 6 0 1 1 9 15 A 6 6 0 1 1 9 3 Z M13.5 13.5 L 17 17",
  play: "M5 3 L 17 10 L 5 17 Z",
  pause: "M5 4 L 5 16 M 15 4 L 15 16",
  plus: "M10 4 L 10 16 M 4 10 L 16 10",
  check: "M4 10 L 8 14 L 16 5",
  close: "M4 4 L 16 16 M 16 4 L 4 16",
  arrow: "M4 10 L 16 10 M 12 6 L 16 10 L 12 14",
  google: null,
  guitar: "M12 2 L 15 5 L 14 7 L 12 5 L 10 7 L 12 9 L 9 12 C 7.5 13.5 5 13.5 3.5 12 C 2 10.5 2 8 3.5 6.5 C 5 5 7.5 5 9 6.5 L 12 3.5 Z",
  drum: "M4 5 L 16 5 L 16 13 C 16 15 13 16 10 16 C 7 16 4 15 4 13 Z M4 5 C 4 3 7 2 10 2 C 13 2 16 3 16 5",
  piano: "M3 5 L 17 5 L 17 15 L 3 15 Z M7 5 L 7 11 L 9 11 L 9 5 M 11 5 L 11 11 L 13 11 L 13 5",
  mic: "M10 2 C 8.34 2 7 3.34 7 5 L 7 10 C 7 11.66 8.34 13 10 13 C 11.66 13 13 11.66 13 10 L 13 5 C 13 3.34 11.66 2 10 2 Z M5 9 C 5 11.76 7.24 14 10 14 C 12.76 14 15 11.76 15 9 M10 14 L 10 18 M6 18 L 14 18",
  flame: "M10 2 C 8 6 6 8 7 11 C 5 9 5 7 5.5 5 C 4 8 3.5 11 5 13.5 C 3.5 13 3 11.5 3 10 C 2 14 5 17 10 17 C 14 17 16 14.5 16 11 C 16 8 14 6 12 5 C 13 7 13 9 12 10",
  notebook: "M5 3 L 15 3 L 15 17 L 5 17 Z M5 7 L 15 7 M 8 3 L 8 17",
  spark: "M10 2 L 11 8 L 17 10 L 11 12 L 10 18 L 9 12 L 3 10 L 9 8 Z",
  gear: "M10 7 A 3 3 0 1 1 10 13 A 3 3 0 1 1 10 7 Z M10 2 L 10 4 M10 16 L 10 18 M2 10 L 4 10 M16 10 L 18 10 M4.5 4.5 L 5.9 5.9 M14.1 14.1 L 15.5 15.5 M4.5 15.5 L 5.9 14.1 M14.1 5.9 L 15.5 4.5",
  calendar: "M4 5 L 16 5 L 16 16 L 4 16 Z M4 8 L 16 8 M 7 3 L 7 7 M 13 3 L 13 7",
};

function Icon({ name, size = 20, color = "currentColor", strokeWidth = 1.6, fill = false }) {
  const d = ICON[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" style={{ display: "block" }}>
      <path d={d} fill={fill ? color : "none"} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Google "G" official-looking mark
function GoogleG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// Avatar with warm ember ring and optional online pulse
function Avatar({ name = "?", src, size = 36, hue, ring = false, online = false, seed = 0 }) {
  // Deterministic ember hue based on name
  const hues = ["#ff7a1a", "#ffb347", "#d9361e", "#d9a441", "#7d6a86", "#6f8ea3", "#4d7c59"];
  const h = hue || hues[(name.charCodeAt(0) + seed) % hues.length];
  const initials = name.split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-flex",
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: src ? `center/cover url(${src})` : `radial-gradient(circle at 30% 25%, ${h}dd, ${h}66)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--f-strong)",
          fontWeight: 700,
          fontSize: size * 0.38,
          color: "#170904",
          boxShadow: ring ? `0 0 0 2px var(--coal), 0 0 0 3.5px ${h}, 0 0 16px ${h}66` : `inset 0 1px 0 rgba(255,255,255,0.18)`,
          textShadow: "0 1px 0 rgba(255,255,255,0.2)",
        }}
      >
        {!src && initials}
      </div>
      {online && (
        <span
          style={{
            position: "absolute",
            right: -2,
            bottom: -2,
            width: Math.max(8, size * 0.28),
            height: Math.max(8, size * 0.28),
            borderRadius: "50%",
            background: "#ff7a1a",
            boxShadow: "0 0 0 2px var(--coal), 0 0 12px #ff7a1a",
            animation: "ember-pulse 2s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}

// Chip — small tag for genres, instruments, proficiency
function Chip({ children, active = false, tone = "default", onClick, size = "md" }) {
  const tones = {
    default: { bg: "var(--iron)", bd: "var(--border-card)", fg: "var(--mist)" },
    active: { bg: "var(--ember-tint)", bd: "rgba(255,122,26,0.4)", fg: "var(--ember-hover)" },
    brass: { bg: "rgba(217,164,65,0.14)", bd: "rgba(217,164,65,0.3)", fg: "var(--brass)" },
    smoke: { bg: "rgba(111,142,163,0.14)", bd: "rgba(111,142,163,0.3)", fg: "var(--smoke-blue)" },
    pine: { bg: "rgba(77,124,89,0.14)", bd: "rgba(77,124,89,0.3)", fg: "var(--pine)" },
  };
  const t = active ? tones.active : (tones[tone] || tones.default);
  const pad = size === "sm" ? "4px 10px" : "7px 12px";
  const fs = size === "sm" ? 11 : 12.5;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: t.bg,
        border: `1px solid ${t.bd}`,
        color: t.fg,
        borderRadius: 999,
        padding: pad,
        fontFamily: "var(--f-body)",
        fontWeight: 600,
        fontSize: fs,
        letterSpacing: "0.01em",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

// Live indicator — a small pulsing ember dot with label
function LiveDot({ label, color = "var(--ember)" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ash)" }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 0 2px rgba(255,122,26,0.15), 0 0 16px ${color}`,
          animation: "ember-pulse 1.8s ease-in-out infinite",
        }}
      />
      {label}
    </span>
  );
}

// Section label
function Label({ children, style }) {
  return (
    <div
      style={{
        fontFamily: "var(--f-mono)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--ash)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Keyframes injected once
function GlobalAtmosphereStyles() {
  return (
    <style>{`
      @keyframes ember-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.55; transform: scale(1.15); }
      }
      @keyframes arrive {
        0% { opacity: 0; transform: translateY(8px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes glow-breathe {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.12); }
      }
      @keyframes circle-rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes stagger-rise {
        0% { opacity: 0; transform: translateY(14px); filter: blur(4px); }
        100% { opacity: 1; transform: translateY(0); filter: blur(0); }
      }
    `}</style>
  );
}

Object.assign(window, { Logo, Icon, GoogleG, Avatar, Chip, LiveDot, Label, GlobalAtmosphereStyles });
