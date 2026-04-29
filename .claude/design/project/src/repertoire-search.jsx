// SEARCH + CONFIGURE flow — modal-style overlay screens
// 1. Empty search   2. Searching/results   3. Configure form   4. Saving   5. Success toast

const searchStyles = {
  overlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" },
  modal: {
    position: "absolute", inset: "58px 0 0",
    display: "flex", alignItems: "flex-start", justifyContent: "center",
    paddingTop: "clamp(40px, 6vw, 72px)", paddingInline: 20,
  },
  card: {
    width: "min(100%, 640px)", background: TOKENS.surface,
    border: `1px solid ${TOKENS.borderSoft}`, borderRadius: 14,
    boxShadow: "0 30px 80px -20px rgba(0,0,0,0.7)",
  },
  cardHead: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 22px", borderBottom: `1px solid ${TOKENS.border}`,
  },
  cardBody: { padding: "22px 22px 24px" },
  cardFoot: {
    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
    padding: "16px 22px", borderTop: `1px solid ${TOKENS.border}`, flexWrap: "wrap",
  },
  searchInput: {
    width: "100%", background: TOKENS.surface2, border: `1px solid ${TOKENS.borderInput}`,
    borderRadius: 8, padding: "14px 16px 14px 46px", color: TOKENS.text,
    fontSize: 16, outline: "none",
  },
  searchWrap: { position: "relative" },
  searchIcon: { position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#666" },
  resultRow: {
    display: "grid", gridTemplateColumns: "44px 1fr auto", alignItems: "center",
    gap: 14, padding: "10px 12px", borderRadius: 8, cursor: "pointer",
    transition: "background .15s ease",
  },
};

function SearchShell({ children, title = "ADD SONG", subtitle, footer }) {
  return (
    <div className="cf-frame" style={{ background: TOKENS.bg }}>
      <Nav />
      <div style={{ padding: "calc(58px + 36px) 24px 0", opacity: 0.18, pointerEvents: "none" }}>
        <div className="cf-lane-home">
          <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 14px" }}>CAMPFIRE · REPERTOIRE</p>
          <h1 className="cf-display" style={{ fontSize: 64, margin: 0 }}>YOUR<br/>REPERTOIRE</h1>
        </div>
      </div>
      <div style={searchStyles.overlay} />
      <div style={searchStyles.modal}>
        <div style={searchStyles.card} className="cf-fade">
          <div style={searchStyles.cardHead}>
            <div>
              <p className="cf-mono" style={{ color: TOKENS.accent, margin: 0, marginBottom: 4 }}>{title}</p>
              {subtitle && <p style={{ margin: 0, color: "#888", fontSize: 13 }}>{subtitle}</p>}
            </div>
            <button className="cf-btn-icon" style={{ border: `1px solid ${TOKENS.border}` }}>
              <I name="x" size={14} color="#888" />
            </button>
          </div>
          <div style={searchStyles.cardBody}>{children}</div>
          {footer && <div style={searchStyles.cardFoot}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}

function SearchEmpty() {
  return (
    <SearchShell subtitle="Search a song to add to your repertoire">
      <div style={searchStyles.searchWrap}>
        <span style={searchStyles.searchIcon}><I name="search" size={18} /></span>
        <input style={searchStyles.searchInput} placeholder="Title, artist, or both…" autoFocus />
      </div>
      <div style={{ marginTop: 28, padding: "32px 16px", textAlign: "center" }}>
        <p className="cf-mono" style={{ color: "#666", margin: "0 0 8px" }}>NOTHING YET</p>
        <p style={{ color: "#777", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Try "wonderwall", "tom jobim", or paste a YouTube link.
        </p>
      </div>
    </SearchShell>
  );
}

function SearchResults() {
  return (
    <SearchShell subtitle="5 matches for 'hey'">
      <div style={searchStyles.searchWrap}>
        <span style={searchStyles.searchIcon}><I name="search" size={18} color={TOKENS.accent} /></span>
        <input style={{ ...searchStyles.searchInput, borderColor: TOKENS.accent }} defaultValue="hey" />
        <button style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
          <I name="x" size={14} color="#888" />
        </button>
      </div>
      <div style={{ marginTop: 14 }}>
        {SAMPLE_SEARCH_RESULTS.map((r, i) => (
          <div key={r.id} style={{
            ...searchStyles.resultRow,
            background: i === 0 ? "rgba(232,129,58,0.08)" : "transparent",
            border: i === 0 ? `1px solid ${TOKENS.accent}` : "1px solid transparent",
          }}>
            <CoverBlock title={r.title} artist={r.artist} size={40} />
            <div>
              <div style={{ fontSize: 15, marginBottom: 2 }}>{r.title}</div>
              <div style={{ color: "#888", fontSize: 13 }}>{r.artist} · {r.year}</div>
            </div>
            <span className="cf-mono" style={{ color: i === 0 ? TOKENS.accent : "#555", fontSize: 9 }}>
              {i === 0 ? "↵ ENTER" : ""}
            </span>
          </div>
        ))}
      </div>
      <p className="cf-mono" style={{ color: "#555", marginTop: 16, fontSize: 9 }}>
        DON'T SEE IT?  <button style={{ color: TOKENS.accent, textDecoration: "underline" }}>ADD MANUALLY</button>
      </p>
    </SearchShell>
  );
}

function ConfigureForm() {
  return (
    <SearchShell title="CONFIGURE SONG" subtitle="Hey Jude — The Beatles" footer={
      <>
        <button className="cf-btn cf-btn-ghost" style={{ minHeight: 40 }}>
          <I name="back" size={13} /> BACK
        </button>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="cf-btn cf-btn-ghost" style={{ minHeight: 40 }}>★ SAVE TO WISHLIST</button>
          <button className="cf-btn cf-btn-accent" style={{ minHeight: 40 }}>
            <I name="check" size={13} /> ADD TO REPERTOIRE
          </button>
        </div>
      </>
    }>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 22, paddingBottom: 18, borderBottom: `1px solid ${TOKENS.border}` }}>
        <CoverBlock title="Hey Jude" artist="The Beatles" size={56} radius={8} />
        <div>
          <div style={{ fontSize: 17 }}>Hey Jude</div>
          <div style={{ color: "#888", fontSize: 13 }}>The Beatles · 1968</div>
        </div>
      </div>
      <div style={{ display: "grid", gap: 22 }}>
        <div>
          <p className="cf-mono" style={{ color: "#888", margin: "0 0 10px" }}>INSTRUMENT *</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {INSTRUMENTS.slice(0, 8).map((ins, i) => (
              <span key={ins} className="cf-chip" data-selected={i === 0 ? "true" : undefined}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <InstrumentIcon name={ins} size={14} /> {ins}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="cf-mono" style={{ color: "#888", margin: "0 0 10px" }}>HOW WELL DO YOU PLAY IT? *</p>
          <div style={{ display: "grid", gap: 10 }}>
            {PROFICIENCY.map((p, i) => (
              <button key={p.id} style={{
                textAlign: "left", padding: "14px 16px", borderRadius: 10,
                background: i === 1 ? "rgba(232,129,58,0.08)" : TOKENS.surface2,
                border: `1px solid ${i === 1 ? TOKENS.accent : TOKENS.border}`,
                color: i === 1 ? TOKENS.accent : TOKENS.text,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div className="cf-mono" style={{ fontSize: 10, marginBottom: 6 }}>{p.label}</div>
                  <span style={{ color: "#888", fontSize: 12 }}>{p.hint}</span>
                </div>
                <ProficiencyDots level={p.dots} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="cf-mono" style={{ color: "#888", margin: "0 0 8px", fontSize: 9 }}>NOTE (OPTIONAL)</p>
          <input className="cf-input" placeholder="Capo on 2, drop tuning, lyrics on the bridge…" />
        </div>
      </div>
    </SearchShell>
  );
}

function ConfigureSaving() {
  return (
    <SearchShell title="ADDING SONG" subtitle="Hey Jude — The Beatles">
      <div style={{ padding: "48px 12px", textAlign: "center" }}>
        <svg className="cf-spin" width="36" height="36" viewBox="0 0 36 36" style={{ marginBottom: 22 }} aria-hidden="true">
          <circle cx="18" cy="18" r="14" stroke={TOKENS.border} strokeWidth="2.5" fill="none"/>
          <path d="M18 4 a14 14 0 0 1 14 14" stroke={TOKENS.accent} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        </svg>
        <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 8px" }}>SAVING…</p>
        <p style={{ color: "#888", fontSize: 13, margin: 0 }}>Adding to your repertoire</p>
      </div>
    </SearchShell>
  );
}

function HomeWithSuccessToast() {
  return (
    <div className="cf-frame" style={{ position: "relative" }}>
      <Nav />
      <main className="cf-page cf-fade">
        <div className="cf-lane-home">
          <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 16px" }}>CAMPFIRE · REPERTOIRE</p>
          <h1 className="cf-display" style={{ fontSize: 56, margin: "0 0 22px", lineHeight: 0.95 }}>
            7 SONGS<br/>IN YOUR<br/>POCKET.
          </h1>
          <div style={{ display: "grid", gap: 10 }}>
            <div className="cf-panel" style={{
              padding: "14px 18px", display: "grid", gridTemplateColumns: "48px 1fr auto auto auto",
              gap: 16, alignItems: "center",
              borderColor: TOKENS.accent, background: "rgba(232,129,58,0.06)",
            }}>
              <CoverBlock title="Hey Jude" artist="The Beatles" size={44} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 16 }}>Hey Jude</span>
                  <span className="cf-mono" style={{ color: TOKENS.accent, fontSize: 8, padding: "3px 8px", border: `1px solid ${TOKENS.accent}`, borderRadius: 20 }}>NEW</span>
                </div>
                <div style={{ color: "#888", fontSize: 13 }}>The Beatles</div>
              </div>
              <span style={{ color: "#888" }}><InstrumentIcon name="Guitar" size={18} /></span>
              <ProficiencyDots level={2} />
              <button className="cf-btn-icon" style={{ border: `1px solid ${TOKENS.border}` }}>
                <I name="edit" size={13} color="#888" />
              </button>
            </div>
            {SAMPLE_REPERTOIRE.slice(0, 3).map(song => {
              const prof = PROFICIENCY.find(p => p.id === song.level);
              return (
                <div key={song.id} className="cf-panel" style={{
                  display: "grid", gridTemplateColumns: "48px 1fr auto auto auto", gap: 16,
                  alignItems: "center", padding: "14px 18px",
                }}>
                  <CoverBlock title={song.title} artist={song.artist} size={44} />
                  <div>
                    <div style={{ fontSize: 16, marginBottom: 3 }}>{song.title}</div>
                    <div style={{ color: "#777", fontSize: 13 }}>{song.artist}</div>
                  </div>
                  <span style={{ color: "#888" }}><InstrumentIcon name={song.instrument} size={18} /></span>
                  <ProficiencyDots level={prof.dots} />
                  <button className="cf-btn-icon" style={{ border: `1px solid ${TOKENS.border}` }}>
                    <I name="edit" size={13} color="#888" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <div className="cf-fade" style={{
        position: "absolute", left: "50%", bottom: 32, transform: "translateX(-50%)",
        background: TOKENS.surface, border: `1px solid ${TOKENS.accent}`, borderRadius: 12,
        padding: "14px 20px", display: "flex", alignItems: "center", gap: 14,
        boxShadow: "0 12px 40px -8px rgba(232,129,58,0.3)",
      }}>
        <I name="check" size={16} color={TOKENS.accent} />
        <div>
          <p className="cf-mono" style={{ margin: 0, color: TOKENS.text, fontSize: 10 }}>SONG ADDED</p>
          <p style={{ margin: "2px 0 0", color: "#888", fontSize: 12 }}>Hey Jude · GUITAR · PRACTICING</p>
        </div>
        <button className="cf-mono" style={{ color: TOKENS.accent, fontSize: 9, marginLeft: 12, padding: 4 }}>UNDO</button>
      </div>
    </div>
  );
}

Object.assign(window, { SearchEmpty, SearchResults, ConfigureForm, ConfigureSaving, HomeWithSuccessToast });
