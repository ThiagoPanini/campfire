// HOME — empty state + populated states
// Three populated variants explore: dense rows w/ icons, grouped cards w/ cover blocks, wishlist tab.

const homeStyles = {
  emptyTitle: { fontSize: "clamp(42px, 7vw, 72px)", lineHeight: 0.95, margin: "0 0 26px" },
  emptyCopy:  { color: "#bdbdbd", fontSize: 17, lineHeight: 1.65, maxWidth: 540, margin: "0 0 32px" },
  illusWrap:  { marginTop: 36, padding: "44px 24px", border: `1px dashed ${TOKENS.borderInput}`, borderRadius: 14, textAlign: "center", background: "rgba(255,255,255,0.012)" },
  tab: {
    background: "transparent", color: "#888", padding: "10px 0", marginRight: 24,
    fontFamily: TOKENS.fontMono, fontSize: 11, fontWeight: 700,
    letterSpacing: "0.16em", textTransform: "uppercase",
    borderBottom: "2px solid transparent", marginBottom: -1,
  },
  tabActive: { color: TOKENS.text, borderBottomColor: TOKENS.accent },
};

// ---------- 1. EMPTY STATE ----------
function HomeEmpty() {
  return (
    <div className="cf-frame">
      <Nav />
      <main className="cf-page cf-fade">
        <div className="cf-lane-home">
          <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 18px" }}>CAMPFIRE · REPERTOIRE</p>
          <h1 className="cf-display" style={homeStyles.emptyTitle}>YOUR<br/>REPERTOIRE<br/>IS EMPTY.</h1>
          <p style={homeStyles.emptyCopy}>
            Add the songs you can play — or want to learn — and Campfire will keep them honest.
            The next session will know what to call.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="cf-btn cf-btn-accent" style={{ padding: "15px 40px", fontSize: 13 }}>
              <I name="plus" size={14} /> ADD YOUR FIRST SONG
            </button>
            <button className="cf-btn cf-btn-ghost">UPDATE PREFERENCES</button>
          </div>
          <div style={homeStyles.illusWrap}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, opacity: 0.55 }}>
              <FireMark size={42} />
            </div>
            <p className="cf-mono" style={{ color: "#777", margin: "0 0 8px" }}>STARTER IDEAS</p>
            <p style={{ color: "#888", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              Start with three songs you played this week. You can refine the level later.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ---------- 2. POPULATED — dense rows with instrument icons ----------
function HomePopulatedTable() {
  return (
    <div className="cf-frame">
      <Nav />
      <main className="cf-page cf-fade" style={{ paddingTop: "clamp(40px, 5vw, 56px)" }}>
        <div style={{ width: "min(100%, 1080px)", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24, marginBottom: 28 }}>
            <div>
              <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 12px" }}>CAMPFIRE · REPERTOIRE</p>
              <h1 className="cf-display" style={{ fontSize: "clamp(40px, 6vw, 64px)", margin: 0, lineHeight: 0.95 }}>
                YOUR REPERTOIRE
              </h1>
              <p className="cf-mono" style={{ color: "#777", marginTop: 14, fontSize: 10 }}>
                6 SONGS · 2 PERFORMANCE-READY · 3 PRACTICING · 1 LEARNING
              </p>
            </div>
            <button className="cf-btn cf-btn-accent" style={{ padding: "13px 28px" }}>
              <I name="plus" size={14} /> ADD SONG
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${TOKENS.border}`, marginBottom: 18 }}>
            <button style={{ ...homeStyles.tab, ...homeStyles.tabActive }}>REPERTOIRE · 6</button>
            <button style={homeStyles.tab}>WISHLIST · 2</button>
          </div>

          {/* Filter chips with icons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 18, marginBottom: 4 }}>
            <span className="cf-chip" data-selected="true">ALL · 6</span>
            <span className="cf-chip" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <InstrumentIcon name="Guitar" size={14} /> GUITAR · 3
            </span>
            <span className="cf-chip" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <InstrumentIcon name="Vocals" size={14} /> VOCALS · 1
            </span>
            <span className="cf-chip" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <InstrumentIcon name="Piano" size={14} /> PIANO · 1
            </span>
            <span className="cf-chip" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <InstrumentIcon name="Bass" size={14} /> BASS · 1
            </span>
            <div style={{ marginLeft: "auto" }}>
              <button className="cf-btn cf-btn-ghost" style={{ minHeight: 36, padding: "8px 14px", fontSize: 10 }}>
                <I name="sort" size={13} /> RECENT
              </button>
            </div>
          </div>

          {/* Header row */}
          <div className="cf-mono" style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px 130px 40px", gap: 16, padding: "14px 4px", color: "#666", fontSize: 9, borderBottom: `1px solid ${TOKENS.border}`, alignItems: "center" }}>
            <span></span>
            <span>SONG</span>
            <span style={{ textAlign: "center" }}>INSTR.</span>
            <span>LEVEL</span>
            <span></span>
          </div>

          {SAMPLE_REPERTOIRE.map(song => {
            const prof = PROFICIENCY.find(p => p.id === song.level);
            return (
              <div key={song.id} style={{
                display: "grid", gridTemplateColumns: "44px 1fr 44px 130px 40px",
                gap: 16, padding: "14px 4px", alignItems: "center",
                borderBottom: `1px solid ${TOKENS.border}`,
              }}>
                <CoverBlock title={song.title} artist={song.artist} size={40} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 3 }}>{song.title}</div>
                  <div style={{ color: "#777", fontSize: 13 }}>{song.artist}</div>
                </div>
                <span style={{ display: "inline-flex", justifyContent: "center", color: "#bdbdbd" }}
                      title={song.instrument} aria-label={song.instrument}>
                  <InstrumentIcon name={song.instrument} size={18} />
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <ProficiencyDots level={prof.dots} />
                  <span className="cf-mono" style={{ color: TOKENS.text, fontSize: 9 }}>{prof.short}</span>
                </span>
                <button className="cf-btn-icon" style={{ background: TOKENS.surface2, border: `1px solid ${TOKENS.border}` }}>
                  <I name="edit" size={13} color="#888" />
                </button>
              </div>
            );
          })}

          <div style={{ marginTop: 28, textAlign: "center" }}>
            <span className="cf-mono" style={{ fontSize: 9, color: "#555" }}>END OF LIST</span>
          </div>
        </div>
      </main>
    </div>
  );
}

// ---------- 3. POPULATED — grouped cards with cover blocks ----------
function HomePopulatedCards() {
  const grouped = {
    "Performance-ready": SAMPLE_REPERTOIRE.filter(s => s.level === "ready"),
    "Practicing":         SAMPLE_REPERTOIRE.filter(s => s.level === "practicing"),
    "Learning":           SAMPLE_REPERTOIRE.filter(s => s.level === "learning"),
  };
  return (
    <div className="cf-frame">
      <Nav />
      <main className="cf-page cf-fade">
        <div className="cf-lane-home">
          <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 16px" }}>CAMPFIRE · REPERTOIRE</p>
          <h1 className="cf-display" style={{ fontSize: "clamp(42px, 7vw, 68px)", margin: "0 0 22px", lineHeight: 0.95 }}>
            6 SONGS<br/>IN YOUR<br/>POCKET.
          </h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 36 }}>
            <button className="cf-btn cf-btn-accent" style={{ padding: "13px 28px" }}>
              <I name="plus" size={14} /> ADD SONG
            </button>
            <button className="cf-btn cf-btn-ghost"><I name="filter" size={13} /> FILTER</button>
          </div>

          {Object.entries(grouped).map(([group, songs]) => (
            <section key={group} style={{ marginBottom: 36 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 16 }}>
                <p className="cf-mono" style={{ color: "#888", margin: 0 }}>{group.toUpperCase()}</p>
                <span style={{ flex: 1, height: 1, background: TOKENS.border }} />
                <p className="cf-mono" style={{ color: "#555", margin: 0, fontSize: 9 }}>{songs.length}</p>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {songs.map(song => {
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
                      <span style={{ color: "#888" }} title={song.instrument} aria-label={song.instrument}>
                        <InstrumentIcon name={song.instrument} size={18} />
                      </span>
                      <ProficiencyDots level={prof.dots} />
                      <button className="cf-btn-icon" style={{ background: "transparent", border: `1px solid ${TOKENS.border}` }}>
                        <I name="edit" size={13} color="#888" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

// ---------- 4. WISHLIST TAB ----------
function HomeWishlist() {
  return (
    <div className="cf-frame">
      <Nav />
      <main className="cf-page cf-fade" style={{ paddingTop: "clamp(40px, 5vw, 56px)" }}>
        <div style={{ width: "min(100%, 1080px)", margin: "0 auto" }}>
          <div style={{ marginBottom: 28 }}>
            <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 12px" }}>CAMPFIRE · REPERTOIRE</p>
            <h1 className="cf-display" style={{ fontSize: "clamp(40px, 6vw, 64px)", margin: 0, lineHeight: 0.95 }}>
              YOUR REPERTOIRE
            </h1>
          </div>

          <div style={{ display: "flex", borderBottom: `1px solid ${TOKENS.border}`, marginBottom: 22 }}>
            <button style={homeStyles.tab}>REPERTOIRE · 6</button>
            <button style={{ ...homeStyles.tab, ...homeStyles.tabActive }}>WISHLIST · 2</button>
          </div>

          <p style={{ color: "#888", fontSize: 14, margin: "0 0 24px", maxWidth: 540, lineHeight: 1.6 }}>
            Songs you want to learn. Move them to your repertoire when you start practicing.
          </p>

          <div style={{ display: "grid", gap: 10 }}>
            {SAMPLE_WISHLIST.map(song => (
              <div key={song.id} className="cf-panel" style={{
                display: "grid", gridTemplateColumns: "48px 1fr auto auto auto", gap: 16,
                alignItems: "center", padding: "14px 18px",
              }}>
                <CoverBlock title={song.title} artist={song.artist} size={44} />
                <div>
                  <div style={{ fontSize: 16, marginBottom: 3 }}>{song.title}</div>
                  <div style={{ color: "#777", fontSize: 13 }}>{song.artist}</div>
                </div>
                <span style={{ color: "#888" }} title={song.instrument}>
                  <InstrumentIcon name={song.instrument} size={18} />
                </span>
                <span className="cf-mono" style={{ color: "#666", fontSize: 9 }}>SAVED · {song.added.toUpperCase()}</span>
                <button className="cf-btn cf-btn-accent" style={{ minHeight: 32, padding: "6px 14px", fontSize: 9 }}>
                  START LEARNING
                </button>
              </div>
            ))}
          </div>

          <button className="cf-btn cf-btn-ghost" style={{ marginTop: 24 }}>
            <I name="plus" size={13} /> ADD TO WISHLIST
          </button>
        </div>
      </main>
    </div>
  );
}

Object.assign(window, { HomeEmpty, HomePopulatedTable, HomePopulatedCards, HomeWishlist });
