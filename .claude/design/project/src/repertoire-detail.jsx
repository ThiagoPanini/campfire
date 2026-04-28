// ENTRY DETAIL — display, edit, duplicate-error, delete-confirm

function DetailShell({ children, kicker = "REPERTOIRE / SONG", title, subtitle }) {
  return (
    <div className="cf-frame">
      <Nav />
      <main className="cf-page cf-fade" style={{ paddingTop: "clamp(50px, 8vw, 88px)" }}>
        <div style={{ width: "min(100%, 640px)", margin: "0 auto" }}>
          <button className="cf-mono" style={{ color: "#888", marginBottom: 28, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <I name="back" size={13} /> BACK TO REPERTOIRE
          </button>
          <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 14px" }}>{kicker}</p>
          {children}
        </div>
      </main>
    </div>
  );
}

function EntryDisplay() {
  return (
    <DetailShell>
      {/* Hero with cover */}
      <div style={{ display: "flex", gap: 22, alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap" }}>
        <CoverBlock title="Hey Jude" artist="The Beatles" size={120} radius={10} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 className="cf-display" style={{ fontSize: "clamp(38px, 6vw, 56px)", lineHeight: 0.95, margin: "0 0 8px" }}>
            HEY JUDE
          </h1>
          <p style={{ color: "#888", margin: 0, fontSize: 17 }}>The Beatles · 1968</p>
        </div>
      </div>

      <div className="cf-panel">
        <div className="cf-row">
          <div>
            <p className="cf-mono" style={{ color: "#666", margin: "0 0 6px", fontSize: 9 }}>INSTRUMENT</p>
            <p style={{ margin: 0, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 10 }}>
              <InstrumentIcon name="Guitar" size={18} color="#bdbdbd" /> Guitar
            </p>
          </div>
        </div>
        <div className="cf-row">
          <div>
            <p className="cf-mono" style={{ color: "#666", margin: "0 0 6px", fontSize: 9 }}>LEVEL</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 16, color: TOKENS.accent }}>Practicing</span>
              <ProficiencyDots level={2} />
            </div>
            <p style={{ color: "#888", margin: "6px 0 0", fontSize: 13 }}>Drilling, not yet smooth</p>
          </div>
        </div>
        <div className="cf-row">
          <div>
            <p className="cf-mono" style={{ color: "#666", margin: "0 0 6px", fontSize: 9 }}>NOTE</p>
            <p style={{ margin: 0, color: "#bdbdbd", fontSize: 14, lineHeight: 1.6 }}>Capo on 2. Watch the bridge — keep it low.</p>
          </div>
        </div>
        <div className="cf-row">
          <div>
            <p className="cf-mono" style={{ color: "#666", margin: "0 0 6px", fontSize: 9 }}>ADDED</p>
            <p style={{ margin: 0, color: "#bdbdbd", fontSize: 14 }}>3 days ago</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
        <button className="cf-btn cf-btn-accent">
          <I name="edit" size={13} /> EDIT
        </button>
        <button className="cf-btn cf-btn-danger">
          <I name="trash" size={13} /> REMOVE
        </button>
      </div>
    </DetailShell>
  );
}

function EntryEdit() {
  return (
    <DetailShell kicker="REPERTOIRE / EDIT SONG">
      <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 28 }}>
        <CoverBlock title="Hey Jude" artist="The Beatles" size={64} radius={8} />
        <div>
          <h1 className="cf-display" style={{ fontSize: 32, lineHeight: 1, margin: "0 0 4px" }}>HEY JUDE</h1>
          <p style={{ color: "#888", margin: 0, fontSize: 14 }}>The Beatles · 1968</p>
        </div>
      </div>
      <div className="cf-panel" style={{ padding: 22 }}>
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
            <p className="cf-mono" style={{ color: "#888", margin: "0 0 10px" }}>LEVEL *</p>
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
            <p className="cf-mono" style={{ color: "#888", margin: "0 0 8px", fontSize: 9 }}>NOTE</p>
            <input className="cf-input" defaultValue="Capo on 2. Watch the bridge — keep it low." />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 24, flexWrap: "wrap" }}>
        <button className="cf-btn cf-btn-ghost">CANCEL</button>
        <button className="cf-btn cf-btn-accent">
          <I name="check" size={13} /> SAVE CHANGES
        </button>
      </div>
    </DetailShell>
  );
}

function ErrorDuplicate() {
  return (
    <DetailShell kicker="REPERTOIRE / ADD SONG">
      <h1 className="cf-display" style={{ fontSize: "clamp(36px, 5vw, 48px)", lineHeight: 0.95, margin: "0 0 32px" }}>
        ALREADY IN<br/>YOUR LIST.
      </h1>
      <div className="cf-panel" style={{ padding: 28, borderColor: "#3a1818" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 22 }}>
          <I name="alert" size={22} color={TOKENS.error} />
          <div>
            <p className="cf-mono" style={{ color: TOKENS.error, margin: "0 0 8px" }}>DUPLICATE</p>
            <p style={{ color: "#bdbdbd", margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: TOKENS.text }}>Hey Jude</strong> is already in your repertoire under{" "}
              <strong style={{ color: TOKENS.accent }}>Guitar / Practicing</strong>. You can update the existing entry or add it under a different instrument.
            </p>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${TOKENS.border}`, paddingTop: 18 }}>
          <p className="cf-mono" style={{ color: "#666", margin: "0 0 10px", fontSize: 9 }}>EXISTING ENTRY</p>
          <div style={{ display: "grid", gridTemplateColumns: "44px 1fr auto auto", gap: 14, alignItems: "center", padding: "12px 14px", background: TOKENS.surface2, borderRadius: 8 }}>
            <CoverBlock title="Hey Jude" artist="The Beatles" size={40} />
            <div>
              <div style={{ fontSize: 15 }}>Hey Jude</div>
              <div style={{ color: "#888", fontSize: 12 }}>The Beatles</div>
            </div>
            <span style={{ color: "#888" }}><InstrumentIcon name="Guitar" size={16} /></span>
            <ProficiencyDots level={2} />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
        <button className="cf-btn cf-btn-accent">
          <I name="edit" size={13} /> UPDATE EXISTING
        </button>
        <button className="cf-btn cf-btn-ghost">ADD WITH ANOTHER INSTRUMENT</button>
      </div>
    </DetailShell>
  );
}

function ConfirmDelete() {
  return (
    <div className="cf-frame">
      <Nav />
      <main className="cf-page" style={{ paddingTop: "clamp(50px, 8vw, 88px)", opacity: 0.35, pointerEvents: "none" }}>
        <div style={{ width: "min(100%, 640px)", margin: "0 auto" }}>
          <p className="cf-mono" style={{ color: TOKENS.accent, margin: "0 0 14px" }}>REPERTOIRE / SONG</p>
          <div style={{ display: "flex", gap: 22, alignItems: "flex-start", marginBottom: 32 }}>
            <CoverBlock title="Hey Jude" artist="The Beatles" size={120} radius={10} />
            <div>
              <h1 className="cf-display" style={{ fontSize: 56, lineHeight: 0.95, margin: "0 0 6px" }}>HEY JUDE</h1>
              <p style={{ color: "#888", margin: 0, fontSize: 17 }}>The Beatles · 1968</p>
            </div>
          </div>
          <div className="cf-panel" style={{ height: 200 }}/>
        </div>
      </main>
      <div style={{ position: "absolute", inset: "58px 0 0", background: "rgba(0,0,0,0.6)" }} />
      <div style={{ position: "absolute", inset: "58px 0 0", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div className="cf-fade" style={{
          width: "min(100%, 460px)", background: TOKENS.surface,
          border: `1px solid ${TOKENS.borderSoft}`, borderRadius: 14,
          padding: 28, boxShadow: "0 30px 80px -20px rgba(0,0,0,0.7)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <I name="trash" size={18} color={TOKENS.error} />
            <p className="cf-mono" style={{ color: TOKENS.error, margin: 0 }}>REMOVE SONG</p>
          </div>
          <h2 className="cf-display" style={{ fontSize: 28, lineHeight: 1, margin: "0 0 12px" }}>
            REMOVE HEY JUDE FROM YOUR REPERTOIRE?
          </h2>
          <p style={{ color: "#888", margin: "0 0 24px", fontSize: 14, lineHeight: 1.6 }}>
            This won't affect anyone else. You can add it back later — your level and notes will be lost.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button className="cf-btn cf-btn-ghost" style={{ minHeight: 40 }}>CANCEL</button>
            <button className="cf-btn cf-btn-danger" style={{ minHeight: 40, background: TOKENS.error, color: "#000", borderColor: TOKENS.error }}>
              <I name="trash" size={13} color="#000" /> REMOVE SONG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EntryDisplay, EntryEdit, ErrorDuplicate, ConfirmDelete });
