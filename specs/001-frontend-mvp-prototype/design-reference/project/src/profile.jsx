// Profile — song capabilities (by instrument) + jam history

function ProfilePage({ lang, intensity, showBg, onEnter }) {
  const [tab, setTab] = React.useState("capabilities");
  const instrumentsPlayed = Array.from(new Set(USER_CAPABILITIES.map(c => c.instrument)));
  const capsByInstrument = instrumentsPlayed.map(inst => ({
    instrument: inst,
    songs: USER_CAPABILITIES.filter(c => c.instrument === inst),
  }));

  return (
    <AppShell
      lang={lang} current="profile" onNav={onEnter}
      intensity={intensity} showBg={showBg} onEnter={onEnter}
      topBar={<TopBar lang={lang}>
        <button className="btn-ghost" style={{ padding: "10px 16px", fontSize: 12 }}>
          <Icon name="gear" size={14} />
          <span style={{ marginLeft: 6 }}>{T(lang, "edit_profile")}</span>
        </button>
      </TopBar>}
    >
      <div className="main-pad-mobile" style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(16px, 3vw, 32px)" }}>

        {/* Hero card */}
        <div style={{
          position: "relative",
          background: "linear-gradient(135deg, rgba(255,122,26,0.12) 0%, var(--burnt) 40%)",
          border: "1px solid var(--border-card)",
          borderRadius: "var(--r-panel)",
          padding: "clamp(20px, 3vw, 32px)",
          overflow: "hidden",
          marginBottom: 28,
          boxShadow: "var(--sh-panel), var(--sh-inset)",
        }}>
          <div aria-hidden="true" style={{
            position: "absolute", right: -60, top: -60, width: 280, height: 280, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,122,26,0.18) 0%, transparent 65%)",
            pointerEvents: "none",
          }} />
          {showBg && <EmberField intensity={intensity * 0.4} seed={12} />}

          <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <Avatar name="Helena" size={96} ring online seed={1} />
            <div style={{ flex: 1, minWidth: 240 }}>
              <Label>Helena · she/her</Label>
              <h1 className="display" style={{ fontSize: "clamp(32px, 4.5vw, 48px)", margin: "6px 0 8px", color: "var(--firelit)", fontStyle: "italic" }}>
                Helena
              </h1>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "var(--mist)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Icon name="calendar" size={13} color="var(--brass)" />
                  {T(lang, "member_since")} March 2025
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Icon name="groups" size={13} color="var(--brass)" />
                  2 {lang === "pt" ? "grupos" : "groups"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Icon name="flame" size={13} color="var(--ember)" fill />
                  12 {T(lang, "sessions_attended")}
                </span>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                {["Acoustic Guitar", "Vocals", "Piano"].map(i => (
                  <Chip key={i} tone="brass" size="md">
                    <Icon name={i === "Piano" ? "piano" : i === "Vocals" ? "mic" : "guitar"} size={12} />
                    {i}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Tiny stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, auto)", gap: 20, padding: "16px 24px", background: "rgba(12,8,6,0.6)", borderRadius: 16, border: "1px solid var(--hairline)" }}>
              <Stat label={T(lang, "songs_i_play")} value={USER_CAPABILITIES.length} color="var(--ember)" />
              <Stat label={T(lang, "sessions_attended")} value="12" color="var(--brass)" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--hairline)", marginBottom: 24 }}>
          {[
            { id: "capabilities", label: T(lang, "song_capabilities"), icon: "songs" },
            { id: "history", label: T(lang, "jam_history_title"), icon: "history" },
          ].map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "12px 16px", background: "transparent", border: 0,
                borderBottom: `2px solid ${active ? "var(--ember)" : "transparent"}`,
                color: active ? "var(--firelit)" : "var(--ash)",
                fontFamily: "var(--f-strong)", fontWeight: 700, fontSize: 13, letterSpacing: "0.04em",
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
                marginBottom: -1, transition: "color 0.15s ease",
              }}>
                <Icon name={t.icon} size={14} color={active ? "var(--ember)" : "currentColor"} />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "capabilities" ? (
          <CapabilitiesTab lang={lang} capsByInstrument={capsByInstrument} />
        ) : (
          <HistoryTab lang={lang} />
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--f-display)", fontSize: 28, fontWeight: 700, color, fontStyle: "italic", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--soot)", marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}

function ProficiencyDot({ level }) {
  const MAP = {
    novice: { color: "var(--smoke-blue)", fill: 1, label: "Novice" },
    learning: { color: "var(--brass)", fill: 2, label: "Learning" },
    solid: { color: "var(--ember)", fill: 3, label: "Solid" },
    lead: { color: "var(--ember-hover)", fill: 4, label: "Can lead" },
  };
  const m = MAP[level] || MAP.novice;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ display: "inline-flex", gap: 2 }}>
        {[0,1,2,3].map(i => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: i < m.fill ? m.color : "var(--iron)",
            boxShadow: i < m.fill ? `0 0 6px ${m.color}66` : "none",
          }} />
        ))}
      </span>
      <span style={{ fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: m.color }}>{m.label}</span>
    </div>
  );
}

function CapabilitiesTab({ lang, capsByInstrument }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ fontSize: 13, color: "var(--ash)", fontStyle: "italic", padding: "0 4px", marginBottom: 4 }}>
        {lang === "pt"
          ? "Cada música aqui carrega o instrumento e seu nível — auto-declarado, pra roda saber pra onde olhar."
          : "Every song carries its instrument and your self-declared level — so the circle knows where to look."}
      </div>
      {capsByInstrument.map(group => (
        <div key={group.instrument} className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid var(--hairline)" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, rgba(217,164,65,0.2), rgba(217,164,65,0.05))",
              border: "1px solid rgba(217,164,65,0.3)",
              color: "var(--brass)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={group.instrument.includes("Piano") ? "piano" : group.instrument.includes("Vocals") ? "mic" : group.instrument.includes("Cajón") ? "drum" : "guitar"} size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--f-strong)", fontWeight: 700, fontSize: 16, color: "var(--firelit)" }}>
                {group.instrument}
              </div>
              <div style={{ fontSize: 12, color: "var(--soot)" }}>
                {group.songs.length} {lang === "pt" ? "músicas" : "songs"}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 2 }}>
            {group.songs.map((s, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center",
                padding: "10px 4px",
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--f-strong)", fontWeight: 600, fontSize: 14, color: "var(--firelit)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.song}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ash)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.artist}</div>
                </div>
                <ProficiencyDot level={s.proficiency} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryTab({ lang }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: "var(--ash)", fontStyle: "italic", padding: "0 4px", marginBottom: 16 }}>
        {lang === "pt"
          ? "Cada roda guarda suas músicas, notas e pequenos momentos. A memória do grupo continua queimando."
          : "Every session keeps its songs, notes, and small moments. The group's memory keeps burning."}
      </div>
      <div style={{ position: "relative", paddingLeft: 20 }}>
        {/* Timeline line */}
        <div aria-hidden="true" style={{
          position: "absolute", left: 7, top: 12, bottom: 12,
          width: 2, borderRadius: 2,
          background: "linear-gradient(180deg, rgba(255,122,26,0.5) 0%, rgba(255,122,26,0.1) 100%)",
        }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {JAM_HISTORY.map((entry, i) => (
            <div key={i} style={{ position: "relative" }}>
              {/* Node */}
              <div aria-hidden="true" style={{
                position: "absolute", left: -20, top: 22,
                width: 16, height: 16, borderRadius: "50%",
                background: i === 0 ? "var(--ember)" : "var(--iron)",
                border: `2px solid ${i === 0 ? "rgba(255,122,26,0.4)" : "var(--border-card)"}`,
                boxShadow: i === 0 ? "0 0 16px rgba(255,122,26,0.6)" : "none",
              }} />
              <div className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontFamily: "var(--f-strong)", fontWeight: 700, fontSize: 15, color: "var(--firelit)" }}>
                      {entry.sessionLabel}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--soot)", fontFamily: "var(--f-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
                      {entry.date}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--ash)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Icon name="groups" size={12} color="var(--brass)" /> {entry.attendees}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Icon name="songs" size={12} color="var(--brass)" /> {entry.songs}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {entry.highlights.map(h => (
                    <span key={h} style={{
                      padding: "4px 10px",
                      background: "var(--iron)",
                      borderRadius: 999,
                      fontSize: 11.5,
                      color: "var(--mist)",
                      fontFamily: "var(--f-body)",
                      fontWeight: 500,
                    }}>
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProfilePage });
