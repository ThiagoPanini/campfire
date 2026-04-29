// CAMPFIRE — /HOME REDESIGN
// Three concepts for the authenticated dashboard. All built on the spec-003 system
// (copper accent #E8813A, Anton display, Space Mono labels, near-black surfaces).
// Future modules (Jam Sessions, Shared Setlists, Practice Queue, Circle Members)
// are visually present but clearly LOCKED · SOON. No emojis. No invented data.

const HR_USER = {
  displayName: "Ada",
  email: "ada@campfire.test",
  memberSince: "JAN 2026",
  preferences: {
    instruments: ["Guitar", "Vocals"],
    genres: ["MPB", "Rock", "Bossa Nova"],
    context: "Roda de amigos",
    experience: "Intermediate",
  },
};

// Pull a "next move" recommendation from existing repertoire data:
// the song with the lowest proficiency, oldest in the list.
const HR_NEXT_MOVE = SAMPLE_REPERTOIRE
  .filter(s => s.level === "learning" || s.level === "practicing")
  .sort((a, b) => (a.level === "learning" ? -1 : 1))[0] || SAMPLE_REPERTOIRE[0];

// Future modules — clearly unavailable
const HR_FUTURE = [
  { id: "jam",     title: "JAM SESSIONS",    sub: "Schedule a circle. See who's in. Build the night's setlist together.",            shape: "circle" },
  { id: "setlist", title: "SHARED SETLISTS", sub: "A setlist your whole group can edit. Synced before the session, not after.",       shape: "lines"  },
  { id: "queue",   title: "PRACTICE QUEUE",  sub: "A daily plan made of your weakest songs. Open it, play it, mark it.",              shape: "stack"  },
  { id: "circle",  title: "CIRCLE MEMBERS",  sub: "The people you actually play with. See their repertoire next to yours.",           shape: "ring"   },
];

// Counts derived from existing repertoire data
function hrCounts() {
  return {
    total:      SAMPLE_REPERTOIRE.length,
    ready:      SAMPLE_REPERTOIRE.filter(s => s.level === "ready").length,
    practicing: SAMPLE_REPERTOIRE.filter(s => s.level === "practicing").length,
    learning:   SAMPLE_REPERTOIRE.filter(s => s.level === "learning").length,
    wishlist:   SAMPLE_WISHLIST.length,
  };
}

// ─── Reusable bits ──────────────────────────────────────────────────────────

function HRLockBadge({ children = "LOCKED · SOON" }) {
  return (
    <span className="cf-mono" style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 9px", borderRadius: 999,
      background: "transparent", border: `1px solid ${TOKENS.border}`,
      color: "#666", fontSize: 9, letterSpacing: "0.18em",
    }}>
      <span aria-hidden style={{ width: 5, height: 5, borderRadius: "50%", background: "#444" }} />
      {children}
    </span>
  );
}

// Tiny abstract glyph for each future module — no icons-as-decoration, just shapes.
function HRFutureGlyph({ shape, size = 28, color = "#3a3a3a" }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.4, "aria-hidden": true };
  switch (shape) {
    case "circle": return <svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>;
    case "lines":  return <svg {...p}><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="17" x2="19" y2="17"/></svg>;
    case "stack":  return <svg {...p}><rect x="3" y="4" width="18" height="3"/><rect x="3" y="10.5" width="18" height="3"/><rect x="3" y="17" width="18" height="3"/></svg>;
    case "ring":   return <svg {...p}><circle cx="8" cy="10" r="3"/><circle cx="16" cy="10" r="3"/><path d="M3 19c0-2.5 2.2-4 5-4M21 19c0-2.5-2.2-4-5-4"/></svg>;
    default: return null;
  }
}

// Hero greeting time-of-day
function HRGreeting() {
  // static for the mockup, but reads natural
  return "EVENING, ADA.";
}

// Micro horizontal pref-strip — preferences as quiet typography, no bordered chips
function HRIdentityStrip({ prefs }) {
  const cells = [
    { label: "PLAYS",      value: prefs.instruments.join(" · ") },
    { label: "LIKES",      value: prefs.genres.slice(0,3).join(" · ") },
    { label: "CONTEXT",    value: prefs.context },
    { label: "EXPERIENCE", value: prefs.experience },
  ];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
      gap: 0, borderTop: `1px solid ${TOKENS.border}`, borderBottom: `1px solid ${TOKENS.border}`,
    }}>
      {cells.map((c, i) => (
        <div key={c.label} style={{
          padding: "16px 18px",
          borderLeft: i === 0 ? "0" : `1px solid ${TOKENS.border}`,
        }}>
          <div className="cf-mono" style={{ color: "#666", fontSize: 9, marginBottom: 8 }}>{c.label}</div>
          <div style={{ fontSize: 14, color: TOKENS.text, lineHeight: 1.35 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// Stat counter — big numerals, mono label
function HRStat({ label, value, accent = false }) {
  return (
    <div>
      <div className="cf-display" style={{ fontSize: 56, lineHeight: 0.9, color: accent ? TOKENS.accent : TOKENS.text }}>
        {String(value).padStart(2, "0")}
      </div>
      <div className="cf-mono" style={{ color: "#777", fontSize: 9, marginTop: 8 }}>{label}</div>
    </div>
  );
}

// Mini repertoire row used in the snapshot section
function HRMiniRow({ song }) {
  const prof = PROFICIENCY.find(p => p.id === song.level);
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 70px 18px",
      gap: 14, alignItems: "center", padding: "10px 0",
      borderTop: `1px solid ${TOKENS.border}`,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, color: TOKENS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</div>
        <div style={{ fontSize: 12, color: "#777", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.artist}</div>
      </div>
      <ProficiencyDots level={prof.dots} />
      <span style={{ color: "#666" }} title={song.instrument} aria-label={song.instrument}>
        <InstrumentIcon name={song.instrument} size={14} />
      </span>
    </div>
  );
}


// ───────────────────────────────────────────────────────────────────────────
// VARIANT A — THE CONSOLE
// Vertical stack. Hero strip → identity strip → repertoire snapshot →
// next move → roadmap rail. Reads top-to-bottom like a tape deck readout.
// ───────────────────────────────────────────────────────────────────────────
function HomeConsole() {
  const c = hrCounts();
  return (
    <div className="cf-frame">
      <Nav />
      <main className="cf-page cf-fade" style={{ paddingTop: "clamp(36px, 5vw, 52px)" }}>
        <div style={{ width: "min(100%, 1100px)", margin: "0 auto" }}>

          {/* HERO STRIP */}
          <section style={{ marginBottom: 28 }}>
            <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 16px" }}>{HRGreeting()}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "end" }}>
              <h1 className="cf-display" style={{ fontSize: "clamp(48px, 8vw, 96px)", margin: 0, lineHeight: 0.9 }}>
                YOUR<br/>CAMPFIRE.
              </h1>
              <div style={{ textAlign: "right" }}>
                <p className="cf-mono" style={{ color: "#666", margin: "0 0 14px", fontSize: 9 }}>
                  {c.total} SONGS · {c.ready} READY · {c.wishlist} WISHED
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button className="cf-btn cf-btn-accent" style={{ padding: "13px 28px" }}>
                    <I name="plus" size={14} /> ADD SONG
                  </button>
                  <button className="cf-btn cf-btn-ghost">OPEN REPERTOIRE</button>
                </div>
              </div>
            </div>
          </section>

          {/* IDENTITY STRIP */}
          <section style={{ marginBottom: 36 }}>
            <HRIdentityStrip prefs={HR_USER.preferences} />
          </section>

          {/* MAIN GRID — snapshot + next move */}
          <section style={{
            display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 28, marginBottom: 40,
          }}>
            {/* Repertoire snapshot */}
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
                <p className="cf-mono" style={{ color: "#888", margin: 0 }}>REPERTOIRE · SNAPSHOT</p>
                <button className="cf-nav-link" style={{ color: TOKENS.accent }}>OPEN ALL →</button>
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0,
                padding: "20px 0", borderTop: `1px solid ${TOKENS.border}`, borderBottom: `1px solid ${TOKENS.border}`, marginBottom: 8,
              }}>
                <div style={{ paddingLeft: 0,  paddingRight: 18, borderRight: `1px solid ${TOKENS.border}` }}>
                  <HRStat label="READY"      value={c.ready}      accent />
                </div>
                <div style={{ paddingLeft: 18, paddingRight: 18, borderRight: `1px solid ${TOKENS.border}` }}>
                  <HRStat label="PRACTICING" value={c.practicing} />
                </div>
                <div style={{ paddingLeft: 18 }}>
                  <HRStat label="LEARNING"   value={c.learning}   />
                </div>
              </div>
              <div>
                {SAMPLE_REPERTOIRE.slice(0, 4).map(s => <HRMiniRow key={s.id} song={s} />)}
              </div>
            </div>

            {/* Next move */}
            <div>
              <p className="cf-mono" style={{ color: "#888", margin: "0 0 18px" }}>YOUR NEXT MOVE</p>
              <div className="cf-panel" style={{
                padding: 24, position: "relative", overflow: "hidden",
                background: `linear-gradient(180deg, rgba(232,129,58,0.06), ${TOKENS.surface})`,
                borderColor: "rgba(232,129,58,0.25)",
              }}>
                <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 14px", fontSize: 9 }}>
                  PRACTICE THIS NEXT
                </p>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
                  <CoverBlock title={HR_NEXT_MOVE.title} artist={HR_NEXT_MOVE.artist} size={60} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="cf-display" style={{ fontSize: 26, lineHeight: 1.0, marginBottom: 6 }}>
                      {HR_NEXT_MOVE.title.toUpperCase()}
                    </div>
                    <div style={{ color: "#999", fontSize: 13 }}>{HR_NEXT_MOVE.artist}</div>
                  </div>
                </div>
                <div className="cf-mono" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, color: "#888", fontSize: 9, marginBottom: 18 }}>
                  <div>
                    <div style={{ color: "#555", marginBottom: 6 }}>INSTRUMENT</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <InstrumentIcon name={HR_NEXT_MOVE.instrument} size={14} /> {HR_NEXT_MOVE.instrument.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#555", marginBottom: 6 }}>LEVEL</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <ProficiencyDots level={PROFICIENCY.find(p=>p.id===HR_NEXT_MOVE.level).dots} />
                      {PROFICIENCY.find(p=>p.id===HR_NEXT_MOVE.level).short}
                    </div>
                  </div>
                </div>
                <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.55, margin: "0 0 18px" }}>
                  Oldest song in your learning queue. Run it once today and bump it forward.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="cf-btn cf-btn-accent" style={{ padding: "10px 18px", fontSize: 10 }}>OPEN SONG</button>
                  <button className="cf-btn cf-btn-ghost" style={{ padding: "10px 18px", fontSize: 10 }}>MARK PRACTICED</button>
                </div>
              </div>
            </div>
          </section>

          {/* ROADMAP RAIL */}
          <section style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
              <p className="cf-mono" style={{ color: "#888", margin: 0 }}>WHAT'S COMING TO CAMPFIRE</p>
              <span className="cf-mono" style={{ color: "#555", fontSize: 9 }}>4 MODULES · ALPHA-LOCKED</span>
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
              border: `1px solid ${TOKENS.border}`, borderRadius: 8, overflow: "hidden",
            }} className="hr-roadmap-grid">
              {HR_FUTURE.map((m, i) => (
                <div key={m.id} aria-disabled="true" style={{
                  padding: 22,
                  borderLeft: i === 0 ? "0" : `1px solid ${TOKENS.border}`,
                  background: TOKENS.surface,
                  position: "relative",
                  minHeight: 200,
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  cursor: "not-allowed",
                }}>
                  <div>
                    <HRFutureGlyph shape={m.shape} size={28} color="#3a3a3a" />
                  </div>
                  <div>
                    <div className="cf-display" style={{ fontSize: 18, color: "#7a7a7a", marginBottom: 8 }}>{m.title}</div>
                    <p style={{ color: "#666", fontSize: 12.5, lineHeight: 1.5, margin: "0 0 14px" }}>{m.sub}</p>
                    <HRLockBadge />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PROFILE FOOTER */}
          <section style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 24,
            padding: "22px 0", borderTop: `1px solid ${TOKENS.border}`, alignItems: "center",
          }}>
            <div>
              <div className="cf-mono" style={{ color: "#666", fontSize: 9, marginBottom: 6 }}>EMAIL</div>
              <div style={{ fontSize: 13, color: "#bdbdbd" }}>{HR_USER.email}</div>
            </div>
            <div>
              <div className="cf-mono" style={{ color: "#666", fontSize: 9, marginBottom: 6 }}>MEMBER SINCE</div>
              <div style={{ fontSize: 13, color: "#bdbdbd" }}>{HR_USER.memberSince}</div>
            </div>
            <div>
              <div className="cf-mono" style={{ color: "#666", fontSize: 9, marginBottom: 6 }}>ACCENT</div>
              <div style={{ fontSize: 13, color: "#bdbdbd" }}>COPPER</div>
            </div>
            <button className="cf-btn cf-btn-ghost" style={{ minHeight: 36, padding: "8px 16px", fontSize: 10 }}>
              UPDATE PREFERENCES
            </button>
          </section>
        </div>
      </main>
      <style>{`
        @media (max-width: 880px) {
          .hr-roadmap-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .hr-roadmap-grid > div:nth-child(2) { border-left: 0 !important; }
          .hr-roadmap-grid > div:nth-child(3),
          .hr-roadmap-grid > div:nth-child(4) { border-top: 1px solid ${TOKENS.border}; }
          .hr-roadmap-grid > div:nth-child(3) { border-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}


// ───────────────────────────────────────────────────────────────────────────
// VARIANT B — THE MANTLE
// Two-column: hero + tall identity card on the left, repertoire snapshot
// + next move + roadmap stacked on the right. Reads more like a control room.
// ───────────────────────────────────────────────────────────────────────────
function HomeMantle() {
  const c = hrCounts();
  return (
    <div className="cf-frame">
      <Nav />
      <main className="cf-page cf-fade" style={{ paddingTop: "clamp(28px, 4vw, 44px)" }}>
        <div style={{ width: "min(100%, 1180px)", margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 380px) minmax(0, 1fr)", gap: 32 }} className="hr-mantle-grid">

          {/* LEFT COLUMN — identity + actions */}
          <aside>
            <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 14px" }}>{HRGreeting()}</p>
            <h1 className="cf-display" style={{ fontSize: "clamp(40px, 5vw, 60px)", margin: "0 0 22px", lineHeight: 0.92 }}>
              THE FIRE<br/>IS LIT.
            </h1>
            <p style={{ color: "#bdbdbd", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px", maxWidth: 320 }}>
              Six songs in your pocket, one waiting for practice tonight. Add another or open the book.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
              <button className="cf-btn cf-btn-accent" style={{ padding: "14px 24px", justifyContent: "flex-start" }}>
                <I name="plus" size={14} /> ADD A SONG
              </button>
              <button className="cf-btn cf-btn-ghost" style={{ justifyContent: "flex-start" }}>
                <I name="music" size={14} /> OPEN REPERTOIRE
              </button>
              <button className="cf-btn cf-btn-ghost" style={{ justifyContent: "flex-start" }}>
                <I name="edit" size={13} /> UPDATE PREFERENCES
              </button>
            </div>

            {/* Identity card */}
            <div className="cf-panel" style={{ padding: 22 }}>
              <p className="cf-mono" style={{ color: "#888", margin: "0 0 16px", fontSize: 9 }}>YOUR MUSIC IDENTITY</p>

              <div style={{ marginBottom: 14 }}>
                <div className="cf-mono" style={{ color: "#555", fontSize: 9, marginBottom: 8 }}>PLAYS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {HR_USER.preferences.instruments.map(i => (
                    <span key={i} className="cf-chip" style={{ minHeight: 28, fontSize: 11, padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <InstrumentIcon name={i} size={11} /> {i.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div className="cf-mono" style={{ color: "#555", fontSize: 9, marginBottom: 8 }}>LIKES</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {HR_USER.preferences.genres.map(g => (
                    <span key={g} className="cf-chip" style={{ minHeight: 28, fontSize: 11, padding: "4px 10px" }}>{g.toUpperCase()}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, paddingTop: 14, borderTop: `1px solid ${TOKENS.border}` }}>
                <div>
                  <div className="cf-mono" style={{ color: "#555", fontSize: 9, marginBottom: 6 }}>CONTEXT</div>
                  <div style={{ fontSize: 13, color: "#ddd" }}>{HR_USER.preferences.context}</div>
                </div>
                <div>
                  <div className="cf-mono" style={{ color: "#555", fontSize: 9, marginBottom: 6 }}>EXPERIENCE</div>
                  <div style={{ fontSize: 13, color: "#ddd" }}>{HR_USER.preferences.experience}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${TOKENS.border}` }}>
              <div className="cf-mono" style={{ color: "#666", fontSize: 9, marginBottom: 6 }}>ACCOUNT</div>
              <div style={{ fontSize: 12, color: "#bdbdbd" }}>{HR_USER.email}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>Member since {HR_USER.memberSince}</div>
            </div>
          </aside>

          {/* RIGHT COLUMN — snapshot + next move + roadmap */}
          <div>
            {/* Repertoire snapshot — wide */}
            <section style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                <p className="cf-mono" style={{ color: "#888", margin: 0 }}>REPERTOIRE</p>
                <button className="cf-nav-link" style={{ color: TOKENS.accent }}>OPEN ALL →</button>
              </div>
              <div className="cf-panel" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: `1px solid ${TOKENS.border}` }}>
                  {[
                    { l: "TOTAL",      v: c.total      },
                    { l: "READY",      v: c.ready, accent: true },
                    { l: "PRACTICING", v: c.practicing },
                    { l: "LEARNING",   v: c.learning   },
                  ].map((s, i) => (
                    <div key={s.l} style={{
                      padding: "20px 22px",
                      borderLeft: i === 0 ? "0" : `1px solid ${TOKENS.border}`,
                    }}>
                      <div className="cf-display" style={{ fontSize: 38, lineHeight: 0.9, color: s.accent ? TOKENS.accent : TOKENS.text }}>
                        {String(s.v).padStart(2, "0")}
                      </div>
                      <div className="cf-mono" style={{ color: "#777", fontSize: 9, marginTop: 8 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "8px 22px 18px" }}>
                  {SAMPLE_REPERTOIRE.slice(0, 3).map(s => <HRMiniRow key={s.id} song={s} />)}
                </div>
              </div>
            </section>

            {/* Next move — banner-style */}
            <section style={{ marginBottom: 28 }}>
              <p className="cf-mono" style={{ color: "#888", margin: "0 0 14px" }}>YOUR NEXT MOVE</p>
              <div className="cf-panel" style={{
                display: "grid", gridTemplateColumns: "70px 1fr auto", gap: 18, alignItems: "center", padding: 22,
                background: `linear-gradient(90deg, rgba(232,129,58,0.10), ${TOKENS.surface} 60%)`,
                borderColor: "rgba(232,129,58,0.28)",
              }}>
                <CoverBlock title={HR_NEXT_MOVE.title} artist={HR_NEXT_MOVE.artist} size={60} />
                <div style={{ minWidth: 0 }}>
                  <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 8px", fontSize: 9 }}>PRACTICE TONIGHT</p>
                  <div className="cf-display" style={{ fontSize: 24, lineHeight: 1, marginBottom: 4 }}>{HR_NEXT_MOVE.title.toUpperCase()}</div>
                  <div style={{ color: "#999", fontSize: 13 }}>{HR_NEXT_MOVE.artist} · {HR_NEXT_MOVE.instrument}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button className="cf-btn cf-btn-accent" style={{ padding: "10px 18px", fontSize: 10 }}>OPEN</button>
                  <button className="cf-btn cf-btn-ghost" style={{ padding: "10px 18px", fontSize: 10 }}>SKIP</button>
                </div>
              </div>
            </section>

            {/* Roadmap — 2x2 grid */}
            <section>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                <p className="cf-mono" style={{ color: "#888", margin: 0 }}>COMING TO CAMPFIRE</p>
                <span className="cf-mono" style={{ color: "#555", fontSize: 9 }}>ALPHA-LOCKED</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }} className="hr-future-2col">
                {HR_FUTURE.map(m => (
                  <div key={m.id} aria-disabled="true" className="cf-panel" style={{
                    padding: 18, position: "relative",
                    display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "flex-start",
                    cursor: "not-allowed",
                  }}>
                    <HRFutureGlyph shape={m.shape} size={26} color="#3a3a3a" />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                        <div className="cf-display" style={{ fontSize: 16, color: "#8a8a8a" }}>{m.title}</div>
                        <HRLockBadge>SOON</HRLockBadge>
                      </div>
                      <p style={{ color: "#666", fontSize: 12, lineHeight: 1.5, margin: 0 }}>{m.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
      <style>{`
        @media (max-width: 900px) {
          .hr-mantle-grid { grid-template-columns: 1fr !important; }
          .hr-future-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}


// ───────────────────────────────────────────────────────────────────────────
// VARIANT C — THE WALL
// Asymmetric panel grid — info-rich rehearsal-room board. Bold typographic
// hero spans the full width; below it everything is on one shared baseline.
// ───────────────────────────────────────────────────────────────────────────
function HomeWall() {
  const c = hrCounts();
  const prof = PROFICIENCY.find(p => p.id === HR_NEXT_MOVE.level);
  return (
    <div className="cf-frame">
      <Nav />
      <main className="cf-page cf-fade" style={{ paddingTop: "clamp(28px, 4vw, 44px)" }}>
        <div style={{ width: "min(100%, 1200px)", margin: "0 auto" }}>

          {/* HERO — typographic + actionbar */}
          <section style={{ marginBottom: 24, display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "flex-end" }}>
            <div>
              <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 14px" }}>WELCOME BACK, ADA</p>
              <h1 className="cf-display" style={{ fontSize: "clamp(56px, 10vw, 124px)", margin: 0, lineHeight: 0.86 }}>
                CAMPFIRE<br/><span style={{ color: TOKENS.accent }}>·</span> CONTROL ROOM.
              </h1>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button className="cf-btn cf-btn-accent" style={{ padding: "13px 22px" }}>
                <I name="plus" size={14} /> ADD SONG
              </button>
              <button className="cf-btn cf-btn-ghost"><I name="music" size={13} /> REPERTOIRE</button>
            </div>
          </section>

          {/* WALL GRID */}
          <section style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gridAutoRows: "auto",
            gap: 10,
            marginBottom: 32,
          }} className="hr-wall-grid">

            {/* PANEL 1 — Counter (cols 1-2) */}
            <div className="cf-panel" style={{ gridColumn: "span 2", padding: 22 }}>
              <p className="cf-mono" style={{ color: "#888", margin: "0 0 18px", fontSize: 9 }}>SONGS IN POCKET</p>
              <div className="cf-display" style={{ fontSize: 96, lineHeight: 0.85, color: TOKENS.accent }}>
                {String(c.total).padStart(2, "0")}
              </div>
              <div style={{ display: "flex", gap: 18, marginTop: 18, flexWrap: "wrap" }}>
                <div>
                  <div className="cf-display" style={{ fontSize: 22, lineHeight: 1, color: "#fff" }}>{c.ready}</div>
                  <div className="cf-mono" style={{ fontSize: 9, color: "#777", marginTop: 6 }}>READY</div>
                </div>
                <div>
                  <div className="cf-display" style={{ fontSize: 22, lineHeight: 1, color: "#fff" }}>{c.practicing}</div>
                  <div className="cf-mono" style={{ fontSize: 9, color: "#777", marginTop: 6 }}>PRACTICING</div>
                </div>
                <div>
                  <div className="cf-display" style={{ fontSize: 22, lineHeight: 1, color: "#fff" }}>{c.learning}</div>
                  <div className="cf-mono" style={{ fontSize: 9, color: "#777", marginTop: 6 }}>LEARNING</div>
                </div>
                <div>
                  <div className="cf-display" style={{ fontSize: 22, lineHeight: 1, color: "#999" }}>{c.wishlist}</div>
                  <div className="cf-mono" style={{ fontSize: 9, color: "#777", marginTop: 6 }}>WISHED</div>
                </div>
              </div>
            </div>

            {/* PANEL 2 — Recently in repertoire (cols 3-4) */}
            <div className="cf-panel" style={{ gridColumn: "span 2", padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                <p className="cf-mono" style={{ color: "#888", margin: 0, fontSize: 9 }}>LAST ADDED</p>
                <button className="cf-nav-link" style={{ color: TOKENS.accent, fontSize: 9 }}>SEE ALL →</button>
              </div>
              {SAMPLE_REPERTOIRE.slice(0, 4).map(s => <HRMiniRow key={s.id} song={s} />)}
            </div>

            {/* PANEL 3 — Next move (cols 5-6) */}
            <div className="cf-panel" style={{
              gridColumn: "span 2", padding: 22, position: "relative",
              background: `linear-gradient(160deg, rgba(232,129,58,0.10), ${TOKENS.surface} 65%)`,
              borderColor: "rgba(232,129,58,0.28)",
            }}>
              <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 14px", fontSize: 9 }}>PRACTICE NEXT</p>
              <div className="cf-display" style={{ fontSize: 28, lineHeight: 1.0, marginBottom: 6 }}>
                {HR_NEXT_MOVE.title.toUpperCase()}
              </div>
              <div style={{ color: "#999", fontSize: 13, marginBottom: 18 }}>{HR_NEXT_MOVE.artist}</div>
              <div className="cf-mono" style={{ display: "flex", gap: 18, color: "#888", fontSize: 9, marginBottom: 18 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <InstrumentIcon name={HR_NEXT_MOVE.instrument} size={12} /> {HR_NEXT_MOVE.instrument.toUpperCase()}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <ProficiencyDots level={prof.dots} /> {prof.short}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="cf-btn cf-btn-accent" style={{ padding: "10px 16px", fontSize: 10, minHeight: 36 }}>OPEN</button>
                <button className="cf-btn cf-btn-ghost" style={{ padding: "10px 16px", fontSize: 10, minHeight: 36 }}>MARK PRACTICED</button>
              </div>
            </div>

            {/* PANEL 4 — Identity (cols 1-3, full row) */}
            <div className="cf-panel" style={{ gridColumn: "span 3", padding: 22 }}>
              <p className="cf-mono" style={{ color: "#888", margin: "0 0 18px", fontSize: 9 }}>MUSIC IDENTITY · FROM ONBOARDING</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
                <div>
                  <div className="cf-mono" style={{ color: "#555", fontSize: 9, marginBottom: 8 }}>PLAYS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {HR_USER.preferences.instruments.map(i => (
                      <span key={i} className="cf-chip" style={{ minHeight: 28, fontSize: 11, padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <InstrumentIcon name={i} size={11} /> {i.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="cf-mono" style={{ color: "#555", fontSize: 9, marginBottom: 8 }}>LIKES</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {HR_USER.preferences.genres.map(g => (
                      <span key={g} className="cf-chip" style={{ minHeight: 28, fontSize: 11, padding: "4px 10px" }}>{g.toUpperCase()}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="cf-mono" style={{ color: "#555", fontSize: 9, marginBottom: 6 }}>CONTEXT</div>
                  <div style={{ fontSize: 13, color: "#ddd" }}>{HR_USER.preferences.context}</div>
                </div>
                <div>
                  <div className="cf-mono" style={{ color: "#555", fontSize: 9, marginBottom: 6 }}>EXPERIENCE</div>
                  <div style={{ fontSize: 13, color: "#ddd" }}>{HR_USER.preferences.experience}</div>
                </div>
              </div>
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${TOKENS.border}` }}>
                <button className="cf-btn cf-btn-ghost" style={{ minHeight: 36, padding: "8px 16px", fontSize: 10 }}>UPDATE PREFERENCES</button>
              </div>
            </div>

            {/* PANEL 5 — Future · split into 4 stacked tiles (cols 4-6) */}
            <div style={{ gridColumn: "span 3", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }} className="hr-wall-future">
              {HR_FUTURE.map(m => (
                <div key={m.id} aria-disabled="true" className="cf-panel" style={{
                  padding: 18, position: "relative", cursor: "not-allowed",
                  display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 132,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <HRFutureGlyph shape={m.shape} size={22} color="#3a3a3a" />
                    <HRLockBadge>SOON</HRLockBadge>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <div className="cf-display" style={{ fontSize: 15, color: "#8a8a8a", marginBottom: 4 }}>{m.title}</div>
                    <p style={{ color: "#666", fontSize: 11.5, lineHeight: 1.45, margin: 0 }}>{m.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PROFILE FOOTER (compact) */}
          <section style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14,
            padding: "18px 0", borderTop: `1px solid ${TOKENS.border}`,
          }}>
            <div className="cf-mono" style={{ color: "#666", fontSize: 9, display: "flex", gap: 22, flexWrap: "wrap" }}>
              <span>{HR_USER.email}</span>
              <span>MEMBER · {HR_USER.memberSince}</span>
              <span>ACCENT · COPPER</span>
            </div>
            <button className="cf-btn cf-btn-ghost" style={{ minHeight: 32, padding: "6px 14px", fontSize: 9 }}>SIGN OUT</button>
          </section>
        </div>
      </main>
      <style>{`
        @media (max-width: 1000px) {
          .hr-wall-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .hr-wall-grid > div { grid-column: span 2 !important; }
          .hr-wall-future { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .hr-wall-future { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

Object.assign(window, { HomeConsole, HomeMantle, HomeWall });
