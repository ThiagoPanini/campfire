// Shared tokens, primitives, and screen frames for the Repertoire Song Entry designs.
// All colors and typography come from DESIGN.md / tokens.css. No new tokens introduced.

const TOKENS = {
  bg: "#131313",
  surface: "#181818",
  surface2: "#1a1a1a",
  border: "#1e1e1e",
  borderSoft: "#222",
  borderInput: "#2e2e2e",
  borderHover: "#555",
  accent: "#E8813A",       // COPPER — current default in tokens.css
  accentDark: "#6B2E00",
  selected: "rgba(232,129,58,0.10)",
  text: "#ffffff",
  muted: "#bdbdbd",
  subtle: "#888",
  faint: "#666",
  fainter: "#444",
  error: "#FF6B6B",
  fontDisplay: "'Anton', Impact, sans-serif",
  fontBody: "'Space Grotesk', Helvetica, Arial, sans-serif",
  fontMono: "'Space Mono', monospace",
};

const SHARED_CSS = `
  .cf * { box-sizing: border-box; }
  .cf { background: ${TOKENS.bg}; color: ${TOKENS.text}; font-family: ${TOKENS.fontBody}; min-height: 100%; -webkit-font-smoothing: antialiased; }
  .cf input, .cf button { font: inherit; }
  .cf button { cursor: pointer; border: 0; background: transparent; color: inherit; }
  .cf input::placeholder { color: #555; }
  .cf-mono { font-family: ${TOKENS.fontMono}; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
  .cf-display { font-family: ${TOKENS.fontDisplay}; font-weight: 400; letter-spacing: 0.025em; text-transform: uppercase; }

  /* Nav */
  .cf-nav { position: absolute; inset: 0 0 auto; height: 58px; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 0 clamp(18px, 4vw, 36px); background: ${TOKENS.bg}; border-bottom: 1px solid ${TOKENS.border}; }
  .cf-brand { display: inline-flex; align-items: center; gap: 10px; }
  .cf-wordmark { font-family: ${TOKENS.fontDisplay}; font-size: 20px; letter-spacing: 0.05em; }
  .cf-alpha { display: inline-flex; align-items: center; border-radius: 20px; padding: 3px 9px; background: ${TOKENS.accent}; color: #000; font-family: ${TOKENS.fontMono}; font-size: 9px; font-weight: 700; letter-spacing: 0.18em; line-height: 1; }
  .cf-nav-link { background: transparent; color: ${TOKENS.subtle}; font-family: ${TOKENS.fontMono}; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; padding: 4px 0; }
  .cf-nav-link:hover { color: ${TOKENS.text}; }

  /* Frame: every artboard renders the nav-offset page padding */
  .cf-frame { position: relative; min-height: 100%; padding: 58px 0 0; }
  .cf-page { padding: clamp(36px, 6vw, 56px) clamp(20px, 5vw, 56px) 48px; }
  .cf-lane-home { width: min(100%, 780px); margin: 0 auto; }
  .cf-lane-mid  { width: min(100%, 640px); margin: 0 auto; }

  /* Buttons */
  .cf-btn { min-height: 44px; border-radius: 40px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-family: ${TOKENS.fontMono}; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; transition: all .18s ease; padding: 11px 24px; white-space: nowrap; }
  .cf-btn-accent { color: #000; background: ${TOKENS.accent}; border: 1px solid transparent; }
  .cf-btn-accent:hover { color: ${TOKENS.text}; background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.25); }
  .cf-btn-ghost  { color: ${TOKENS.subtle}; border: 1px solid ${TOKENS.border}; }
  .cf-btn-ghost:hover { color: ${TOKENS.text}; border-color: ${TOKENS.borderHover}; }
  .cf-btn-danger { color: ${TOKENS.error}; border: 1px solid #3a1818; }
  .cf-btn-danger:hover { background: rgba(255,107,107,.06); }
  .cf-btn-icon { width: 36px; height: 36px; min-height: 0; padding: 0; border-radius: 50%; }

  /* Form inputs */
  .cf-field { display: grid; gap: 7px; }
  .cf-field-label { color: ${TOKENS.faint}; font-family: ${TOKENS.fontMono}; font-size: 9px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
  .cf-input { width: 100%; border-radius: 6px; border: 1px solid ${TOKENS.borderInput}; background: ${TOKENS.surface2}; color: ${TOKENS.text}; padding: 12px 14px; outline: none; transition: border-color .15s ease; }
  .cf-input:focus { border-color: ${TOKENS.accent}; }

  /* Chips */
  .cf-chip { display: inline-flex; align-items: center; min-height: 36px; border-radius: 999px; padding: 7px 13px; border: 1px solid ${TOKENS.border}; background: ${TOKENS.surface2}; color: ${TOKENS.text}; font-size: 13px; transition: all .15s ease; }
  .cf-chip[data-selected="true"] { border-color: ${TOKENS.accent}; background: ${TOKENS.selected}; color: ${TOKENS.accent}; }

  /* Card surfaces */
  .cf-panel { background: ${TOKENS.surface}; border: 1px solid ${TOKENS.borderSoft}; border-radius: 8px; }
  .cf-row { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center; padding: 16px 18px; border-top: 1px solid ${TOKENS.border}; }
  .cf-row:first-child { border-top: 0; }

  /* Anim */
  @keyframes cfFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .cf-fade { animation: cfFadeUp .35s ease both; }
  @keyframes cfFlicker  { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(.95)} }
  @keyframes cfFlicker2 { 0%,100%{transform:scaleY(1) scaleX(1)} 50%{transform:scaleY(1.05) scaleX(.95)} }
  @keyframes cfEmber    { 0%,100%{opacity:.7} 50%{opacity:1} }
  .cf-flame-outer { transform-origin: 50% 100%; animation: cfFlicker 1.6s ease-in-out infinite; }
  .cf-flame-inner { transform-origin: 50% 100%; animation: cfFlicker2 1.1s ease-in-out infinite; }
  .cf-ember { animation: cfEmber 1.4s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .cf-flame-outer, .cf-flame-inner, .cf-ember, .cf-fade { animation: none !important; }
  }

  /* Spinner */
  @keyframes cfSpin { to { transform: rotate(360deg); } }
  .cf-spin { animation: cfSpin .9s linear infinite; transform-origin: 50% 50%; }
  @media (prefers-reduced-motion: reduce) { .cf-spin { animation: none !important; } }
`;

function FireMark({ size = 22 }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 28 32" aria-hidden="true" style={{ flexShrink: 0 }}>
      <g className="cf-flame-outer">
        <path d="M14 30C7.5 30 3 25 3 19C3 12 9 7 11 2C11 7 13.5 9 14 10C14.5 9 16 6 15 1C19 5 25 12 25 19C25 25 20.5 30 14 30Z" fill="#E8813A" />
      </g>
      <g className="cf-flame-inner">
        <path d="M14 26C10 26 8 23 8 20C8 16.5 10.5 14 12 12C12 15 13.5 16 14 17C14.5 16 15.5 14.5 15 12C17.5 14 20 17 20 20.5C20 23.5 17.5 26 14 26Z" fill="#FFD166" />
      </g>
      <ellipse className="cf-ember" cx="14" cy="26" rx="3" ry="2" fill="#FFF5B0" opacity="0.7" />
    </svg>
  );
}

function Nav({ rightAction = "SIGN OUT" }) {
  return (
    <div className="cf-nav">
      <div className="cf-brand">
        <FireMark size={20} />
        <span className="cf-wordmark">CAMPFIRE</span>
        <span className="cf-alpha">ALPHA</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <button className="cf-nav-link" style={{ color: "#E8813A" }}>HOME</button>
        <button className="cf-nav-link">{rightAction}</button>
      </div>
    </div>
  );
}

function MonoLabel({ children, color = "#888", size = 11, style }) {
  return <span className="cf-mono" style={{ color, fontSize: size, ...style }}>{children}</span>;
}

// Generic icon set — minimal stroke icons reused across the screens
function I({ name, size = 16, color = "currentColor", strokeWidth = 1.6 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" };
  switch (name) {
    case "search":  return <svg {...p}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case "plus":    return <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "x":       return <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case "edit":    return <svg {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>;
    case "trash":   return <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
    case "music":   return <svg {...p}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
    case "alert":   return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
    case "check":   return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "back":    return <svg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
    case "filter":  return <svg {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
    case "sort":    return <svg {...p}><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>;
    default: return null;
  }
}

// Proficiency: 3 levels per spec 003 — Learning → Practicing → Performance-ready.
// Wishlist ("want to learn") is a SEPARATE concept, not a level — see WISHLIST below.
const PROFICIENCY = [
  { id: "learning",   label: "LEARNING",          short: "LEARNING",   dots: 1, hint: "Working out the parts" },
  { id: "practicing", label: "PRACTICING",        short: "PRACTICING", dots: 2, hint: "Drilling, not yet smooth" },
  { id: "ready",      label: "PERFORMANCE-READY", short: "READY",      dots: 3, hint: "Can play it in front of others" },
];

function ProficiencyDots({ level = 0 }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0,1,2].map(i => (
        <span key={i} aria-hidden="true" style={{
          width: 6, height: 6, borderRadius: "50%",
          background: i < level ? "#E8813A" : "#2a2a2a",
        }} />
      ))}
    </span>
  );
}

const INSTRUMENTS = ["Guitar", "Bass", "Drums", "Piano / Keys", "Vocals", "Violin", "Cavaquinho", "Ukulele", "Cajón", "Mandolin", "Flute", "Other"];

// Sample data — repertoire (active) + wishlist (separate)
const SAMPLE_REPERTOIRE = [
  { id: 1, title: "Trem Bala",          artist: "Ana Vilela",       instrument: "Guitar",       level: "ready",      added: "2 weeks" },
  { id: 2, title: "Sozinho",             artist: "Caetano Veloso",   instrument: "Vocals",       level: "practicing", added: "3 weeks" },
  { id: 3, title: "Tocando Em Frente",   artist: "Almir Sater",      instrument: "Guitar",       level: "practicing", added: "1 mo"    },
  { id: 4, title: "Wonderwall",          artist: "Oasis",            instrument: "Guitar",       level: "ready",      added: "2 mo"    },
  { id: 5, title: "Aquarela",            artist: "Toquinho",         instrument: "Piano / Keys", level: "learning",   added: "5 days"  },
  { id: 6, title: "Smoke On The Water",  artist: "Deep Purple",      instrument: "Bass",         level: "practicing", added: "1 wk"    },
];

const SAMPLE_WISHLIST = [
  { id: 101, title: "Garota de Ipanema",  artist: "Tom Jobim",        instrument: "Vocals", added: "today"   },
  { id: 102, title: "Black Hole Sun",     artist: "Soundgarden",      instrument: "Guitar", added: "yesterday" },
];

const SAMPLE_SEARCH_RESULTS = [
  { id: "s1", title: "Hey Jude",                      artist: "The Beatles",          year: 1968 },
  { id: "s2", title: "Hey Joe",                       artist: "Jimi Hendrix",         year: 1966 },
  { id: "s3", title: "Heyyeyaaeyaaaeyaeyaa",          artist: "The Italian Singer",   year: 2010 },
  { id: "s4", title: "Hey Ya!",                       artist: "Outkast",              year: 2003 },
  { id: "s5", title: "Hey There Delilah",             artist: "Plain White T's",      year: 2006 },
];

Object.assign(window, {
  TOKENS, SHARED_CSS, FireMark, Nav, MonoLabel, I,
  PROFICIENCY, ProficiencyDots, INSTRUMENTS,
  SAMPLE_REPERTOIRE, SAMPLE_WISHLIST, SAMPLE_SEARCH_RESULTS,
});
