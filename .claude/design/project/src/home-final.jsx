// CAMPFIRE — /HOME · FINAL DASHBOARD
// Single direction, merging the strongest pieces from earlier concepts:
//   • Mantle: confident title + subtitle + visible CTAs (one active, one coming-soon)
//   • Wall:   compact repertoire-status indicator layer (no fake metrics)
//   • Console:"Last added" feature card + horizontal "What's coming" rail
//
// Built on the spec-003 visual system (copper accent #E8813A, Anton, Space
// Grotesk, Space Mono) — no new tokens, no invented data, no preferences panel,
// no practice/coaching language.

// ─── Data — same shape the production app already exposes ──────────────────
const HF_USER = { displayName: "Ada", email: "ada@campfire.test", memberSince: "JAN 2026" };

// Counters from existing repertoire data
function hfCounts() {
  return {
    total:      SAMPLE_REPERTOIRE.length,
    ready:      SAMPLE_REPERTOIRE.filter(s => s.level === "ready").length,
    practicing: SAMPLE_REPERTOIRE.filter(s => s.level === "practicing").length,
    learning:   SAMPLE_REPERTOIRE.filter(s => s.level === "learning").length,
    wishlist:   SAMPLE_WISHLIST.length,
    recent7:    3, // count of songs added in the last 7 days; sample/static
  };
}

// Last-added song = first item the way the existing repertoire-home renders it.
// (Production code would do `repertoire[0]` after a `createdAt` desc sort.)
const HF_LAST_ADDED = SAMPLE_REPERTOIRE[0];

// Future modules — clearly unavailable
const HF_FUTURE = [
  { id: "jam",     title: "JAM SESSIONS",    sub: "Schedule a circle. See who's in. Build the night together.", shape: "circle" },
  { id: "setlist", title: "SHARED SETLISTS", sub: "A setlist your group can edit. Synced before the session.",   shape: "lines"  },
  { id: "queue",   title: "PRACTICE QUEUE",  sub: "A daily plan made of your weakest songs.",                    shape: "stack"  },
  { id: "circle",  title: "CIRCLE MEMBERS",  sub: "The people you actually play with, repertoire side-by-side.", shape: "ring"   },
];


// ─── Reusable bits ──────────────────────────────────────────────────────────
function HFLockBadge({ children = "COMING SOON" }) {
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

function HFFutureGlyph({ shape, size = 26, color = "#3a3a3a" }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.4, "aria-hidden": true };
  switch (shape) {
    case "circle": return <svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>;
    case "lines":  return <svg {...p}><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="17" x2="19" y2="17"/></svg>;
    case "stack":  return <svg {...p}><rect x="3" y="4"  width="18" height="3"/><rect x="3" y="10.5" width="18" height="3"/><rect x="3" y="17" width="18" height="3"/></svg>;
    case "ring":   return <svg {...p}><circle cx="8" cy="10" r="3"/><circle cx="16" cy="10" r="3"/><path d="M3 19c0-2.5 2.2-4 5-4M21 19c0-2.5-2.2-4-5-4"/></svg>;
    default: return null;
  }
}

// Disabled-CTA — same shape/size as accent button so the visual rhythm is preserved
function HFComingSoonBtn({ children, icon }) {
  return (
    <button
      type="button"
      aria-disabled="true"
      title="Coming soon"
      style={{
        minHeight: 44, padding: "13px 24px",
        borderRadius: 40, border: `1px dashed ${TOKENS.borderInput}`,
        background: "rgba(255,255,255,0.02)", color: "#666",
        fontFamily: TOKENS.fontMono, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
        display: "inline-flex", alignItems: "center", gap: 10,
        cursor: "not-allowed",
        position: "relative",
      }}
      onClick={(e) => e.preventDefault()}
    >
      {icon ? <I name={icon} size={14} color="#666" /> : null}
      {children}
      <span aria-hidden style={{
        marginLeft: 4, padding: "3px 7px", borderRadius: 999,
        background: "rgba(232,129,58,0.08)", border: "1px solid rgba(232,129,58,0.20)",
        color: "#E8813A", fontSize: 8.5, letterSpacing: "0.2em",
      }}>SOON</span>
    </button>
  );
}

// Single status-layer indicator — compact, no chrome stacked on chrome
function HFStat({ label, value, accent = false, sub }) {
  return (
    <div style={{ padding: "20px 22px" }}>
      <div className="cf-mono" style={{ color: "#666", fontSize: 9, marginBottom: 12 }}>{label}</div>
      <div className="cf-display" style={{ fontSize: 44, lineHeight: 0.9, color: accent ? TOKENS.accent : TOKENS.text }}>
        {String(value).padStart(2, "0")}
      </div>
      {sub ? <div className="cf-mono" style={{ color: "#555", fontSize: 9, marginTop: 10 }}>{sub}</div> : null}
    </div>
  );
}

// Proficiency split — three thin bars showing relative composition of repertoire
function HFProficiencyBar({ counts }) {
  const total = Math.max(counts.total, 1);
  const segs = [
    { id: "ready",      label: "READY",      v: counts.ready,      color: TOKENS.accent },
    { id: "practicing", label: "PRACTICING", v: counts.practicing, color: "#7a5536"     },
    { id: "learning",   label: "LEARNING",   v: counts.learning,   color: "#3d2c20"     },
  ];
  return (
    <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 18, height: "100%" }}>
      <div>
        <div className="cf-mono" style={{ color: "#666", fontSize: 9, marginBottom: 12 }}>BY STATUS</div>
        <div style={{ display: "flex", gap: 3, height: 8, borderRadius: 4, overflow: "hidden", background: "#222" }}>
          {segs.map(s => s.v > 0 ? (
            <div key={s.id} style={{ flex: s.v, background: s.color }} aria-label={`${s.label} ${s.v}`} title={`${s.label} ${s.v}`} />
          ) : null)}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {segs.map(s => (
          <div key={s.id}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span aria-hidden style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
              <span className="cf-display" style={{ fontSize: 18, color: TOKENS.text }}>{String(s.v).padStart(2, "0")}</span>
            </div>
            <div className="cf-mono" style={{ color: "#666", fontSize: 8.5, marginTop: 4, letterSpacing: "0.14em" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── PAGE ──────────────────────────────────────────────────────────────────
function HomeFinal({ empty = false } = {}) {
  const c = hfCounts();
  const lastAdded = empty ? null : HF_LAST_ADDED;
  const lastProf  = lastAdded ? PROFICIENCY.find(p => p.id === lastAdded.level) : null;

  return (
    <div className="cf-frame">
      <Nav />
      <main className="cf-page cf-fade" style={{ paddingTop: "clamp(28px, 4vw, 44px)" }}>
        <div style={{ width: "min(100%, 1200px)", margin: "0 auto" }}>

          {/* ─── 1. TOP CONTROL AREA ─────────────────────────────────────── */}
          <section style={{ marginBottom: 36 }}>
            <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 16px" }}>
              CAMPFIRE · DASHBOARD
            </p>
            <div style={{
              display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: 32, alignItems: "flex-end",
            }} className="hf-hero-grid">
              <div>
                <h1 className="cf-display" style={{
                  fontSize: "clamp(46px, 8vw, 96px)", margin: 0, lineHeight: 0.88,
                  letterSpacing: "0.02em",
                }}>
                  YOUR CAMPFIRE<br/>CONTROL ROOM.
                </h1>
                <p style={{
                  color: "#bdbdbd", fontSize: "clamp(14px, 1.4vw, 16.5px)", lineHeight: 1.6,
                  margin: "20px 0 0", maxWidth: 560,
                }}>
                  The one place to keep your repertoire honest and watch the rest of Campfire arrive — songs you can play, songs you're working on, sessions on the way.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }} className="hf-cta-stack">
                <button className="cf-btn cf-btn-accent" style={{ padding: "14px 26px" }}>
                  <I name="plus" size={14} /> ADD SONGS TO REPERTOIRE
                </button>
                <button className="cf-btn cf-btn-ghost" style={{ padding: "13px 24px" }}>
                  <I name="music" size={13} /> OPEN REPERTOIRE
                </button>
                <HFComingSoonBtn icon="circle">ENTER A JAM SESSION</HFComingSoonBtn>
              </div>
            </div>
          </section>

          {/* ─── 2. REPERTOIRE STATUS LAYER ──────────────────────────────── */}
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
              <p className="cf-mono" style={{ color: "#888", margin: 0 }}>REPERTOIRE · STATUS</p>
              <button className="cf-nav-link" style={{ color: TOKENS.accent }}>OPEN REPERTOIRE →</button>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1.6fr",
              border: `1px solid ${TOKENS.border}`,
              borderRadius: 8,
              overflow: "hidden",
              background: TOKENS.surface,
            }} className="hf-status-grid">
              <div style={{ borderRight: `1px solid ${TOKENS.border}` }}>
                <HFStat
                  label="TOTAL SONGS"
                  value={c.total}
                  accent
                  sub={c.total === 1 ? "1 IN POCKET" : `${c.total} IN POCKET`}
                />
              </div>
              <div style={{ borderRight: `1px solid ${TOKENS.border}` }}>
                <HFStat
                  label="ADDED · LAST 7 DAYS"
                  value={c.recent7}
                  sub={c.recent7 ? "FRESH ENTRIES" : "QUIET WEEK"}
                />
              </div>
              <div style={{ borderRight: `1px solid ${TOKENS.border}` }}>
                <HFStat
                  label="ON THE WISHLIST"
                  value={c.wishlist}
                  sub="WANT TO LEARN"
                />
              </div>
              <HFProficiencyBar counts={c} />
            </div>
          </section>

          {/* ─── 3. LAST ADDED SONG CARD ─────────────────────────────────── */}
          <section style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
              <p className="cf-mono" style={{ color: "#888", margin: 0 }}>YOU ADDED LAST</p>
              {lastAdded ? (
                <span className="cf-mono" style={{ color: "#555", fontSize: 9 }}>{lastAdded.added.toUpperCase()} AGO</span>
              ) : null}
            </div>

            {lastAdded ? (
              <div style={{
                display: "grid", gridTemplateColumns: "84px 1fr auto",
                gap: 22, alignItems: "center", padding: 24,
                border: "1px solid rgba(232,129,58,0.28)", borderRadius: 12,
                background: `linear-gradient(90deg, rgba(232,129,58,0.10) 0%, ${TOKENS.surface} 55%, ${TOKENS.surface} 100%)`,
              }} className="hf-last-card">
                <CoverBlock title={lastAdded.title} artist={lastAdded.artist} size={84} />
                <div style={{ minWidth: 0 }}>
                  <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 10px", fontSize: 9 }}>
                    NEWEST IN YOUR REPERTOIRE
                  </p>
                  <div className="cf-display" style={{
                    fontSize: "clamp(28px, 3.5vw, 38px)", lineHeight: 1.0, marginBottom: 6,
                  }}>
                    {lastAdded.title.toUpperCase()}
                  </div>
                  <div style={{ color: "#bdbdbd", fontSize: 14.5, marginBottom: 14 }}>{lastAdded.artist}</div>
                  <div className="cf-mono" style={{ display: "flex", gap: 22, color: "#888", fontSize: 9, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#555" }}>INSTRUMENT</span>
                      <InstrumentIcon name={lastAdded.instrument} size={13} />
                      <span style={{ color: TOKENS.text }}>{lastAdded.instrument.toUpperCase()}</span>
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#555" }}>STATUS</span>
                      <ProficiencyDots level={lastProf.dots} />
                      <span style={{ color: TOKENS.text }}>{lastProf.short}</span>
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#555" }}>ADDED</span>
                      <span style={{ color: TOKENS.text }}>{lastAdded.added.toUpperCase()} AGO</span>
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }} className="hf-last-actions">
                  <button className="cf-btn cf-btn-accent" style={{ padding: "10px 18px", fontSize: 10, minHeight: 38 }}>
                    OPEN ENTRY
                  </button>
                  <button className="cf-btn cf-btn-ghost" style={{ padding: "10px 18px", fontSize: 10, minHeight: 38 }}>
                    <I name="edit" size={12} /> EDIT
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                padding: "44px 28px", textAlign: "center",
                border: `1px dashed ${TOKENS.borderInput}`, borderRadius: 12,
                background: "rgba(255,255,255,0.012)",
              }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, opacity: 0.55 }}>
                  <FireMark size={36} />
                </div>
                <div className="cf-display" style={{ fontSize: 30, margin: "0 0 10px" }}>
                  YOUR REPERTOIRE IS EMPTY.
                </div>
                <p style={{ color: "#888", fontSize: 14, margin: "0 0 22px", maxWidth: 460, marginInline: "auto", lineHeight: 1.6 }}>
                  Add the first song you can play — Campfire will keep it from here. The latest entry will live in this card.
                </p>
                <button className="cf-btn cf-btn-accent" style={{ padding: "13px 28px" }}>
                  <I name="plus" size={14} /> ADD YOUR FIRST SONG
                </button>
              </div>
            )}
          </section>

          {/* ─── 4. WHAT'S COMING TO CAMPFIRE — horizontal rail ──────────── */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
              <p className="cf-mono" style={{ color: "#888", margin: 0 }}>WHAT'S COMING TO CAMPFIRE</p>
              <span className="cf-mono" style={{ color: "#555", fontSize: 9 }}>4 MODULES · ALL COMING SOON</span>
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
              border: `1px solid ${TOKENS.border}`, borderRadius: 8, overflow: "hidden",
              background: TOKENS.surface,
            }} className="hf-future-rail">
              {HF_FUTURE.map((m, i) => (
                <div key={m.id} aria-disabled="true" style={{
                  padding: 22,
                  borderLeft: i === 0 ? "0" : `1px solid ${TOKENS.border}`,
                  cursor: "not-allowed",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  minHeight: 168,
                  position: "relative",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <HFFutureGlyph shape={m.shape} size={26} color="#3a3a3a" />
                    <HFLockBadge>SOON</HFLockBadge>
                  </div>
                  <div>
                    <div className="cf-display" style={{ fontSize: 16, color: "#8a8a8a", marginBottom: 6 }}>{m.title}</div>
                    <p style={{ color: "#666", fontSize: 12, lineHeight: 1.5, margin: 0 }}>{m.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Compact account footer — preferences live here as a secondary link */}
          <section style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14,
            padding: "18px 0", borderTop: `1px solid ${TOKENS.border}`,
          }}>
            <div className="cf-mono" style={{ color: "#666", fontSize: 9, display: "flex", gap: 22, flexWrap: "wrap" }}>
              <span>{HF_USER.email}</span>
              <span>MEMBER · {HF_USER.memberSince}</span>
            </div>
            <button className="cf-nav-link" style={{ color: "#888" }}>UPDATE PREFERENCES →</button>
          </section>

        </div>
      </main>

      <style>{`
        @media (max-width: 980px) {
          .hf-hero-grid { grid-template-columns: 1fr !important; }
          .hf-cta-stack { align-items: stretch !important; }
          .hf-status-grid { grid-template-columns: 1fr 1fr !important; }
          .hf-status-grid > div:nth-child(1),
          .hf-status-grid > div:nth-child(2) { border-bottom: 1px solid ${TOKENS.border} !important; }
          .hf-status-grid > div:nth-child(2) { border-right: 0 !important; }
          .hf-status-grid > div:nth-child(3) { border-right: 1px solid ${TOKENS.border} !important; }
          .hf-future-rail { grid-template-columns: repeat(2, 1fr) !important; }
          .hf-future-rail > div:nth-child(2) { border-left: 0 !important; }
          .hf-future-rail > div:nth-child(3),
          .hf-future-rail > div:nth-child(4) { border-top: 1px solid ${TOKENS.border} !important; }
          .hf-future-rail > div:nth-child(3) { border-left: 0 !important; }
          .hf-last-card { grid-template-columns: 64px 1fr !important; }
          .hf-last-actions { grid-column: span 2; flex-direction: row !important; }
        }
        @media (max-width: 560px) {
          .hf-status-grid { grid-template-columns: 1fr !important; }
          .hf-status-grid > div { border-right: 0 !important; border-bottom: 1px solid ${TOKENS.border} !important; }
          .hf-status-grid > div:last-child { border-bottom: 0 !important; }
          .hf-future-rail { grid-template-columns: 1fr !important; }
          .hf-future-rail > div { border-left: 0 !important; border-top: 1px solid ${TOKENS.border}; }
          .hf-future-rail > div:first-child { border-top: 0; }
        }
      `}</style>
    </div>
  );
}

function HomeFinalEmpty() { return <HomeFinal empty />; }

Object.assign(window, { HomeFinal, HomeFinalEmpty });
