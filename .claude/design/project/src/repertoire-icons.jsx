// Custom Campfire instrument icon kit.
// Stroke-only, 24x24 viewBox, strokeWidth 1.6 — matches the rest of the icon system.
// All paths use currentColor; size and color drive themselves from props.
//
// Rendered through <InstrumentIcon name="Guitar" size={16} /> — `name` is one of
// the labels in the catalog (case-insensitive). Unknown names render the music note.

const _ICON_PROPS = (size, color, sw) => ({
  width: size, height: size, viewBox: "0 0 24 24",
  fill: "none", stroke: color, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round",
  "aria-hidden": "true",
});

function InstrumentIcon({ name = "Other", size = 16, color = "currentColor", strokeWidth = 1.6 }) {
  const p = _ICON_PROPS(size, color, strokeWidth);
  const key = String(name).toLowerCase().trim();

  switch (key) {
    case "guitar":
      // Steel-string acoustic — full-body silhouette + neck + headstock + soundhole
      return (
        <svg {...p}>
          <path d="M16.5 3 L21 3 L21 6 L17.5 6" />
          <path d="M17 6 L11.5 11.5" />
          <ellipse cx="8.5" cy="14.5" rx="6" ry="6.5" />
          <circle cx="8.5" cy="14.5" r="1.6" />
        </svg>
      );
    case "bass":
      // Longer neck, 4 tuners on headstock — distinguish from guitar
      return (
        <svg {...p}>
          <path d="M19 2.5 L22 2.5 M19 4.5 L22 4.5 M19 6.5 L22 6.5 M19 8.5 L22 8.5" />
          <path d="M18.5 5.5 L11.5 12.5" />
          <ellipse cx="8.5" cy="15.5" rx="5.5" ry="5.5" />
          <circle cx="8.5" cy="15.5" r="1.3" />
        </svg>
      );
    case "drums":
      // Top-down snare with tension lugs — distinct from any string instrument
      return (
        <svg {...p}>
          <ellipse cx="12" cy="12" rx="8.5" ry="3.5" />
          <ellipse cx="12" cy="12" rx="6" ry="2" />
          <line x1="3.5" y1="12" x2="3.5" y2="15" />
          <line x1="20.5" y1="12" x2="20.5" y2="15" />
          <line x1="12" y1="15.5" x2="12" y2="18" />
          <ellipse cx="12" cy="15.5" rx="8.5" ry="3" />
        </svg>
      );
    case "piano / keys":
    case "piano":
    case "keys":
      // 4 white keys with 3 black keys — minimal piano
      return (
        <svg {...p}>
          <rect x="2.5" y="6" width="19" height="12" rx="1" />
          <line x1="7" y1="6" x2="7" y2="18" />
          <line x1="12" y1="6" x2="12" y2="18" />
          <line x1="17" y1="6" x2="17" y2="18" />
          <rect x="5" y="6" width="3" height="6" fill="currentColor" stroke="none" />
          <rect x="10" y="6" width="3" height="6" fill="currentColor" stroke="none" />
          <rect x="15" y="6" width="3" height="6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "vocals":
      // Hand-held mic
      return (
        <svg {...p}>
          <rect x="9" y="2" width="6" height="10" rx="3" />
          <path d="M5 11 a7 7 0 0 0 14 0" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="9" y1="22" x2="15" y2="22" />
        </svg>
      );
    case "violin":
      // F-holes hint + scroll headstock + hourglass body
      return (
        <svg {...p}>
          <path d="M19.5 3 c0.8 0 1.4 0.6 1.4 1.4 c0 1-1 1.6-1.6 1 L18 4" />
          <path d="M18 4 L11 11" />
          <path d="M9 13 c-3 0-5 2-5 5 c0 2 2 4 4.5 4 c2 0 3.5-1.5 3.5-3 c0-1.5 1.5-3 3-3 c2 0 3.5-2 3.5-4 c0-2.2-2-4-4.5-4 c-2 0-3.5 1.3-3.5 3 c0 1.3-0.5 2-1.5 2 z" />
        </svg>
      );
    case "cavaquinho":
      // Small round body + 4 tuners (Brazilian)
      return (
        <svg {...p}>
          <path d="M18 3 L22 3 M18 5 L22 5 M18 7 L22 7 M18 9 L22 9" />
          <path d="M18 6 L13 11" />
          <circle cx="9.5" cy="14.5" r="5.5" />
          <circle cx="9.5" cy="14.5" r="1.2" />
        </svg>
      );
    case "ukulele":
      // Figure-8 small body + 4 strings
      return (
        <svg {...p}>
          <path d="M19 4 L22 4 M19 6 L22 6 M19 8 L22 8 M19 10 L22 10" />
          <path d="M18.5 7 L13 12.5" />
          <path d="M9 17 c-2.8 0-4.5-2.2-4.5-4.5 c0-1.6 1-3 2.4-3.5 c-0.8-0.6-1.4-1.7-1.4-2.8 c0-2 1.6-3.5 3.5-3.5 s3.5 1.5 3.5 3.5 c0 1.1-0.6 2.2-1.4 2.8 c1.4 0.5 2.4 1.9 2.4 3.5 c0 2.3-1.7 4.5-4.5 4.5 z" transform="rotate(-30 9 12)" />
          <circle cx="9" cy="13.5" r="0.9" transform="rotate(-30 9 12)" />
        </svg>
      );
    case "cajón":
    case "cajon":
      // Box drum — front view with sound hole
      return (
        <svg {...p}>
          <rect x="5" y="3" width="14" height="18" rx="0.6" />
          <line x1="5" y1="6" x2="19" y2="6" />
          <circle cx="12" cy="13.5" r="2.2" />
        </svg>
      );
    case "mandolin":
      // Teardrop / almond body + scroll head
      return (
        <svg {...p}>
          <path d="M19.5 3 c0.8 0 1.4 0.6 1.4 1.4 c0 1-1 1.6-1.6 1 L18 4" />
          <path d="M18 4 L12 10" />
          <path d="M12 10 c-4.5 0-8 3.5-8 7.5 c0 2.2 1.8 4 4 4 c1.5 0 2.8-0.8 3.5-2 c0.7 1.2 2 2 3.5 2 c2.2 0 4-1.8 4-4 c0-4-3.5-7.5-7-7.5 z" />
          <circle cx="12" cy="16" r="1.3" />
        </svg>
      );
    case "flute":
      // Horizontal cylinder + finger holes
      return (
        <svg {...p}>
          <path d="M2.5 12 L21.5 12" />
          <path d="M2.5 12 L2.5 14 L4 14 L4 12" />
          <path d="M21.5 12 L21.5 13.5 L19.5 13.5" />
          <circle cx="8"  cy="12" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="11" cy="12" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="14" cy="12" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="17" cy="12" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "other":
    default:
      // Generic music note
      return (
        <svg {...p}>
          <path d="M9 18 L9 5 L20 3 L20 16" />
          <ellipse cx="6" cy="18" rx="3" ry="2.4" />
          <ellipse cx="17" cy="16" rx="3" ry="2.4" />
        </svg>
      );
  }
}

// Algorithmic cover thumbnail — letter on tinted block. No network, on-brand.
// Hash maps artist name to one of the brand-warm tints. Accepts optional coverUrl
// override for future metadata integration; renders that desaturated to 55%.
function CoverBlock({ title, artist, size = 40, coverUrl, radius = 6 }) {
  const palette = [
    { bg: "#3a1d0a", fg: "#FFD166" },
    { bg: "#5C3A00", fg: "#FFE1A3" },
    { bg: "#6B2E00", fg: "#FFD9B8" },
    { bg: "#1f1410", fg: "#E8813A" },
    { bg: "#2a1606", fg: "#FFAA00" },
  ];
  const seed = (artist || title || "?").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const tone = palette[seed % palette.length];
  const initial = (title || "?").trim().charAt(0).toUpperCase();
  const letterSize = Math.round(size * 0.55);

  if (coverUrl) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius, overflow: "hidden",
        backgroundImage: `linear-gradient(rgba(19,19,19,0.4), rgba(19,19,19,0.4)), url(${coverUrl})`,
        backgroundSize: "cover", backgroundPosition: "center",
        filter: "saturate(0.55)", flexShrink: 0,
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: tone.bg, color: tone.fg,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontFamily: TOKENS.fontDisplay, fontSize: letterSize, lineHeight: 1,
      letterSpacing: "0.02em", flexShrink: 0,
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.35)",
    }}>{initial}</div>
  );
}

Object.assign(window, { InstrumentIcon, CoverBlock });
