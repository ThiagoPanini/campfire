// Home — two modes via tab: "circle" (jam session campfire) & "library" (song book rails)

function HomePage({ lang, intensity, showBg, onEnter }) {
  const [mode, setMode] = React.useState("circle");
  const [setlist, setSetlist] = React.useState(SETLIST_TONIGHT);
  const [draggingSong, setDraggingSong] = React.useState(null);
  const [search, setSearch] = React.useState("");

  const addToSetlist = (song) => {
    if (setlist.find(s => s.id === song.id)) return;
    setSetlist([...setlist, { ...song, status: "queued" }]);
  };
  const removeFromSetlist = (id) => setSetlist(setlist.filter(s => s.id !== id));

  return (
    <AppShell
      lang={lang} current="home" onNav={(id) => onEnter(id)}
      intensity={intensity} showBg={showBg} onEnter={onEnter}
      topBar={
        <TopBar lang={lang}>
          <ModeToggle mode={mode} setMode={setMode} lang={lang} />
          <button className="btn-ghost" style={{ padding: "10px 16px", fontSize: 12 }}>
            <Icon name="gear" size={14} />
          </button>
        </TopBar>
      }
    >
      <div className="main-pad-mobile" style={{ padding: "clamp(16px, 3vw, 28px)", maxWidth: 1440, margin: "0 auto" }}>
        {mode === "circle" ? (
          <CircleMode lang={lang} intensity={intensity} setlist={setlist} addSong={addToSetlist} removeSong={removeFromSetlist} search={search} setSearch={setSearch} draggingSong={draggingSong} setDraggingSong={setDraggingSong} />
        ) : (
          <LibraryMode lang={lang} search={search} setSearch={setSearch} addSong={addToSetlist} setlist={setlist} />
        )}
      </div>
    </AppShell>
  );
}

function ModeToggle({ mode, setMode, lang }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--burnt)", border: "1px solid var(--border-card)", borderRadius: 999, padding: 3, position: "relative" }}>
      <div aria-hidden="true" style={{
        position: "absolute", top: 3, bottom: 3,
        left: mode === "circle" ? 3 : "50%",
        width: "calc(50% - 3px)",
        background: "linear-gradient(180deg, rgba(255,122,26,0.28), rgba(217,54,30,0.18))",
        borderRadius: 999,
        boxShadow: "0 0 0 1px rgba(255,122,26,0.3), 0 0 16px rgba(217,54,30,0.2)",
        transition: "left 0.25s cubic-bezier(0.3,0.7,0.4,1)",
      }} />
      {[{id:"circle",icon:"flame",label:T(lang,"circle_mode")},{id:"library",icon:"songs",label:T(lang,"library_mode")}].map((m) => (
        <button key={m.id} onClick={() => setMode(m.id)} style={{
          position: "relative", zIndex: 2, background: "transparent", border: 0,
          padding: "8px 16px", color: mode === m.id ? "var(--firelit)" : "var(--ash)",
          fontFamily: "var(--f-strong)", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase",
          cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
          transition: "color 0.2s ease",
        }}>
          <Icon name={m.icon} size={14} />
          {m.label}
        </button>
      ))}
    </div>
  );
}

// ─── Circle Mode ─────────────────────────────────────────────────────────
function CircleMode({ lang, intensity, setlist, addSong, removeSong, search, setSearch, draggingSong, setDraggingSong }) {
  const [countdownMin, setCountdownMin] = React.useState(47);
  React.useEffect(() => {
    const t = setInterval(() => setCountdownMin(m => Math.max(0, m - 1)), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 24 }} className="circle-grid">
      {/* Left — Campfire circle */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <Label>{T(lang, "friday_session")}</Label>
            <h1 className="display" style={{ fontSize: "clamp(28px, 3.5vw, 40px)", margin: "6px 0 0", color: "var(--firelit)", fontStyle: "italic" }}>
              {T(lang, "tonight_title")}
            </h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--soot)" }}>
              {T(lang, "session_in")}
            </div>
            <div style={{ fontFamily: "var(--f-display)", fontSize: 28, fontWeight: 700, color: "var(--ember-hover)", fontVariantNumeric: "tabular-nums" }}>
              {Math.floor(countdownMin / 60)}:{String(countdownMin % 60).padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* The campfire visual + friends around */}
        <CampfireCircleViz lang={lang} intensity={intensity} setlist={setlist} draggingSong={draggingSong} onDrop={(song) => { addSong(song); setDraggingSong(null); }} />

        {/* Setlist under the fire */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "var(--f-strong)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--firelit)" }}>
              {T(lang, "setlist")} · <span style={{ color: "var(--soot)", fontWeight: 500 }}>{setlist.length}</span>
            </h2>
            <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: 11 }}>
              <Icon name="plus" size={12} />
              <span style={{ marginLeft: 6 }}>{T(lang, "add_song")}</span>
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {setlist.map((song, i) => (
              <SetlistRow key={song.id} song={song} index={i} onRemove={() => removeSong(song.id)} />
            ))}
            {setlist.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", color: "var(--soot)", border: "1px dashed var(--border-card)", borderRadius: 14, fontSize: 13 }}>
                {T(lang, "drag_songs")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right — search & suggestions */}
      <aside style={{ display: "flex", flexDirection: "column", gap: 18 }} className="circle-side">
        <SearchPanel lang={lang} search={search} setSearch={setSearch} addSong={addSong} setlist={setlist} setDraggingSong={setDraggingSong} />
        <SuggestionsPanel lang={lang} addSong={addSong} setlist={setlist} />
      </aside>

      <style>{`
        @media (max-width: 1100px) { .circle-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

function CampfireCircleViz({ lang, intensity, setlist, draggingSong, onDrop }) {
  const [dragOver, setDragOver] = React.useState(false);
  const size = 440;
  const people = FRIENDS.slice(0, 5);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); if (draggingSong) onDrop(draggingSong); }}
      style={{
        position: "relative",
        height: size, width: "100%",
        maxWidth: 620,
        margin: "0 auto",
        background: `radial-gradient(55% 55% at 50% 55%, rgba(255,120,40,${0.22 * intensity}) 0%, rgba(217,54,30,${0.1 * intensity}) 40%, transparent 70%), var(--burnt)`,
        borderRadius: "var(--r-panel)",
        border: `1px solid ${dragOver ? "rgba(255,122,26,0.55)" : "var(--border-card)"}`,
        boxShadow: dragOver ? "0 0 0 1px rgba(255,122,26,0.4), 0 0 60px rgba(217,54,30,0.3), var(--sh-panel)" : "var(--sh-panel), var(--sh-inset)",
        overflow: "hidden",
        transition: "box-shadow 0.25s ease, border-color 0.25s ease",
      }}
    >
      <EmberField intensity={intensity * 0.9} seed={7} origin="center" />

      {/* Central fire */}
      <div style={{ position: "absolute", left: "50%", top: "55%", transform: "translate(-50%, -50%)", width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Glow halo */}
        <div style={{
          position: "absolute", inset: -40, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,160,60,0.35) 0%, rgba(217,54,30,0.15) 40%, transparent 70%)",
          animation: "glow-breathe 3.5s ease-in-out infinite",
          filter: "blur(6px)",
        }} />
        {/* Flame */}
        <svg width="120" height="150" viewBox="0 0 120 150" style={{ animation: "flame-flicker 1.2s ease-in-out infinite alternate", position: "relative", zIndex: 2 }}>
          <defs>
            <radialGradient id="homeFlame" cx="50%" cy="60%" r="55%">
              <stop offset="0%" stopColor="#fff2cc" />
              <stop offset="30%" stopColor="#ffc567" />
              <stop offset="65%" stopColor="#ff7a1a" />
              <stop offset="100%" stopColor="#d9361e" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d="M60 10 C 30 45 20 75 35 105 C 18 95 15 75 22 55 C 12 80 10 110 30 130 C 20 125 12 115 10 100 C 5 135 30 148 60 148 C 90 148 115 135 110 100 C 108 115 100 125 90 130 C 110 110 108 80 98 55 C 105 75 102 95 85 105 C 100 75 90 45 60 10 Z" fill="url(#homeFlame)" />
          <path d="M60 40 C 48 60 45 78 52 95 C 58 88 60 72 60 55 C 60 72 62 88 68 95 C 75 78 72 60 60 40 Z" fill="#fff8e0" opacity="0.85" />
        </svg>
        {/* Logs */}
        <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", width: 160, height: 22 }}>
          <div style={{ position: "absolute", inset: 0, background: "#2a1509", borderRadius: 4, transform: "rotate(-8deg)" }} />
          <div style={{ position: "absolute", inset: "6px 0 auto 0", background: "#3a2214", borderRadius: 4, transform: "rotate(6deg)", height: 16 }} />
        </div>
      </div>

      {/* Drop hint when dragging */}
      {draggingSong && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 5, pointerEvents: "none",
        }}>
          <div style={{
            padding: "12px 20px",
            background: "rgba(18,12,9,0.9)",
            border: "1px solid rgba(255,122,26,0.5)",
            borderRadius: 999,
            color: "var(--ember-hover)",
            fontFamily: "var(--f-strong)", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            boxShadow: "0 0 30px rgba(217,54,30,0.4)",
          }}>
            🔥 {lang === "pt" ? "Solte aqui pra adicionar" : "Drop here to add"}
          </div>
        </div>
      )}

      {/* Friends around the fire */}
      {people.map((f, i) => {
        const angle = (i / people.length) * Math.PI * 2 - Math.PI / 2;
        const r = 180;
        const cx = size / 2 + Math.cos(angle) * r;
        const cy = size * 0.55 + Math.sin(angle) * r * 0.62;
        return (
          <div key={f.name} style={{
            position: "absolute",
            left: `calc(50% + ${Math.cos(angle) * 240}px - 40px)`,
            top: `calc(55% + ${Math.sin(angle) * 150}px - 40px)`,
            width: 80,
            textAlign: "center",
            animation: `arrive 0.7s ease both ${0.1 + i * 0.12}s`,
          }}>
            <Avatar name={f.name} size={56} ring online={f.online} seed={i + 20} />
            <div style={{ marginTop: 8, fontFamily: "var(--f-strong)", fontWeight: 700, fontSize: 12, color: "var(--firelit)" }}>
              {f.name}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--soot)", marginTop: 2 }}>
              {f.instrument}
            </div>
            {f.ready && (
              <div style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9.5, color: "var(--pine)", fontFamily: "var(--f-mono)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--pine)" }} /> ready
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SetlistRow({ song, index, onRemove }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "grid", gridTemplateColumns: "24px 1fr auto auto auto", gap: 14, alignItems: "center",
        padding: "10px 14px",
        background: hover ? "var(--iron)" : "var(--burnt)",
        border: "1px solid var(--border-card)", borderRadius: 12,
        transition: "background 0.15s ease",
      }}>
      <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--soot)", textAlign: "right" }}>{String(index + 1).padStart(2, "0")}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "var(--f-strong)", fontWeight: 700, fontSize: 14, color: "var(--firelit)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</div>
        <div style={{ fontSize: 12, color: "var(--ash)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.artist}</div>
      </div>
      <span style={{ fontFamily: "var(--f-mono)", fontSize: 10.5, color: "var(--brass)", letterSpacing: "0.1em" }}>{song.key}</span>
      <Chip tone={song.status === "ready" ? "pine" : song.status === "learning" ? "brass" : "smoke"} size="sm">
        {song.status === "ready" ? "ready" : song.status === "learning" ? "learning" : "queued"}
      </Chip>
      <button onClick={onRemove} aria-label="Remove" style={{
        width: 28, height: 28, borderRadius: "50%", background: "transparent",
        border: 0, color: hover ? "var(--ash)" : "var(--soot)", cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name="close" size={12} />
      </button>
    </div>
  );
}

function SearchPanel({ lang, search, setSearch, addSong, setlist, setDraggingSong }) {
  const results = search ? SONGS_LIB.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.artist.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 6) : SONGS_LIB.slice(0, 4);

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Label>Add songs</Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--umber)", border: "1px solid var(--border-card)", borderRadius: 999, marginBottom: 12 }}>
        <Icon name="search" size={14} color="var(--ash)" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={T(lang, "search_songs")}
          style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: "var(--firelit)", fontSize: 13, minWidth: 0 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
        {results.map(song => {
          const added = setlist.find(s => s.id === song.id);
          return (
            <div key={song.id}
              draggable={!added}
              onDragStart={(e) => { setDraggingSong(song); e.dataTransfer.effectAllowed = "move"; }}
              onDragEnd={() => setDraggingSong(null)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "8px 10px",
                borderRadius: 10, background: "transparent",
                cursor: added ? "default" : "grab",
                opacity: added ? 0.5 : 1,
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => { if (!added) e.currentTarget.style.background = "var(--iron)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, var(--iron), var(--burnt))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brass)", flexShrink: 0 }}>
                <Icon name="songs" size={16} fill />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--f-strong)", fontWeight: 600, fontSize: 13, color: "var(--firelit)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</div>
                <div style={{ fontSize: 11, color: "var(--soot)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.artist} · {song.key}</div>
              </div>
              <button onClick={() => addSong(song)} disabled={added}
                style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: added ? "var(--iron)" : "var(--ember)",
                  border: 0, color: added ? "var(--soot)" : "#170904",
                  cursor: added ? "default" : "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                <Icon name={added ? "check" : "plus"} size={12} strokeWidth={2.4} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SuggestionsPanel({ lang, addSong, setlist }) {
  const sugg = [
    { song: SONGS_LIB[4], reason: lang === "pt" ? "4 de vocês sabem tocar, 5★ da última roda" : "4 of you can play it · 5★ last time" },
    { song: SONGS_LIB[7], reason: lang === "pt" ? "Todos firmes · combina com o clima" : "Everyone solid · matches the vibe" },
    { song: SONGS_LIB[5], reason: lang === "pt" ? "Helena adora · Rafael tá aprendendo" : "Helena loves it · Rafael is learning" },
  ];
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Icon name="spark" size={13} color="var(--brass)" fill />
        <Label>{T(lang, "suggestions")}</Label>
      </div>
      <p style={{ fontSize: 11.5, color: "var(--soot)", margin: "0 0 14px" }}>
        {lang === "pt" ? "Baseado em quem você toca e na história da roda." : "Based on who you play with and your jam history."}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sugg.map(({ song, reason }) => {
          const added = setlist.find(s => s.id === song.id);
          return (
            <div key={song.id} style={{ padding: "12px 14px", background: "var(--umber)", border: "1px solid var(--hairline)", borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--f-strong)", fontWeight: 700, fontSize: 13, color: "var(--firelit)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</div>
                  <div style={{ fontSize: 11, color: "var(--ash)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.artist}</div>
                </div>
                <button onClick={() => addSong(song)} disabled={added}
                  className={added ? "btn-ghost" : "btn-primary"}
                  style={{ padding: "6px 12px", fontSize: 10.5, opacity: added ? 0.5 : 1 }}>
                  {added ? "✓" : T(lang, "add_song")}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--brass)", fontStyle: "italic", lineHeight: 1.4 }}>
                {reason}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Library Mode ─────────────────────────────────────────────────────────
function LibraryMode({ lang, search, setSearch, addSong, setlist }) {
  const [filter, setFilter] = React.useState("all");
  const filtered = SONGS_LIB.filter(s => {
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.artist.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Label>{T(lang, "library_mode")}</Label>
        <h1 className="display" style={{ fontSize: "clamp(28px, 3.5vw, 40px)", margin: "6px 0 0", color: "var(--firelit)", fontStyle: "italic" }}>
          {T(lang, "song_library")}
        </h1>
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240, display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "var(--burnt)", border: "1px solid var(--border-card)", borderRadius: 999 }}>
          <Icon name="search" size={16} color="var(--ash)" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={T(lang, "search_songs")}
            style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: "var(--firelit)", fontSize: 14, minWidth: 0 }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "mpb", "rock", "folk", "bossa"].map(f => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)} size="sm">{f === "all" ? (lang === "pt" ? "Todos" : "All") : f}</Chip>
          ))}
        </div>
      </div>

      {/* Recently played rail */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontFamily: "var(--f-strong)", fontSize: 17, fontWeight: 700, margin: 0, color: "var(--firelit)" }}>
            {T(lang, "recently_played")}
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          {SONGS_LIB.slice(0, 4).map(song => <SongCard key={song.id} song={song} lang={lang} addSong={addSong} added={!!setlist.find(s => s.id === song.id)} />)}
        </div>
      </section>

      {/* Full library */}
      <section>
        <h2 style={{ fontFamily: "var(--f-strong)", fontSize: 17, fontWeight: 700, margin: "0 0 14px", color: "var(--firelit)" }}>
          {T(lang, "song_library")} · <span style={{ color: "var(--soot)", fontWeight: 500 }}>{filtered.length}</span>
        </h2>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 60px 60px 80px 100px", gap: 16, padding: "12px 18px", borderBottom: "1px solid var(--hairline)", fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--soot)" }} className="lib-header">
            <span>#</span><span>Song</span><span>Artist</span><span>Key</span><span>BPM</span><span>Length</span><span style={{ textAlign: "right" }}>Capable</span>
          </div>
          {filtered.map((song, i) => <LibraryRow key={song.id} song={song} index={i} lang={lang} addSong={addSong} added={!!setlist.find(s => s.id === song.id)} />)}
        </div>
      </section>

      <style>{`
        @media (max-width: 760px) {
          .lib-header { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function SongCard({ song, lang, addSong, added }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        padding: 14,
        background: "var(--burnt)",
        border: "1px solid var(--border-card)",
        borderRadius: 14,
        transition: "all 0.2s ease",
        boxShadow: hover ? "0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,122,26,0.15)" : "var(--sh-inset)",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
      }}>
      <div style={{
        aspectRatio: "1.2/1", borderRadius: 10, marginBottom: 12,
        background: `linear-gradient(135deg, ${["#ff7a1a", "#d9361e", "#d9a441", "#7d6a86"][song.id % 4]}44, var(--iron))`,
        border: "1px solid var(--hairline)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: ["#ffb347", "#ff5a4e", "#d9a441", "#b094c2"][song.id % 4], position: "relative", overflow: "hidden",
      }}>
        <Icon name="songs" size={32} fill strokeWidth={1.2} />
        {hover && (
          <button onClick={() => !added && addSong(song)} disabled={added}
            style={{
              position: "absolute", right: 10, bottom: 10,
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--ember)", border: 0, color: "#170904",
              cursor: added ? "default" : "pointer", boxShadow: "0 6px 20px rgba(217,54,30,0.4)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              opacity: added ? 0.6 : 1,
            }}>
            <Icon name={added ? "check" : "plus"} size={16} strokeWidth={2.6} />
          </button>
        )}
      </div>
      <div style={{ fontFamily: "var(--f-strong)", fontWeight: 700, fontSize: 14, color: "var(--firelit)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</div>
      <div style={{ fontSize: 12, color: "var(--ash)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.artist}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", fontFamily: "var(--f-mono)", fontSize: 10.5, color: "var(--soot)", letterSpacing: "0.1em" }}>
        <span style={{ color: "var(--brass)" }}>{song.key}</span>
        <span>·</span>
        <span>{song.duration}</span>
        <span>·</span>
        <span>{song.capable} play</span>
      </div>
    </div>
  );
}

function LibraryRow({ song, index, lang, addSong, added }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "grid", gridTemplateColumns: "24px 1fr 1fr 60px 60px 80px 100px",
        gap: 16, padding: "12px 18px", alignItems: "center",
        borderBottom: "1px solid var(--hairline)",
        background: hover ? "var(--iron)" : "transparent",
        transition: "background 0.12s ease",
      }}
      className="lib-row">
      <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--soot)", textAlign: "right" }}>{String(index + 1).padStart(2, "0")}</span>
      <div style={{ fontFamily: "var(--f-strong)", fontWeight: 600, fontSize: 14, color: "var(--firelit)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</div>
      <div style={{ fontSize: 13, color: "var(--ash)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.artist}</div>
      <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--brass)", letterSpacing: "0.1em" }}>{song.key}</span>
      <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--ash)", fontVariantNumeric: "tabular-nums" }}>{song.bpm}</span>
      <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--ash)", fontVariantNumeric: "tabular-nums" }}>{song.duration}</span>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--soot)" }}>{song.capable}/5</span>
        <button onClick={() => !added && addSong(song)}
          style={{
            width: 26, height: 26, borderRadius: "50%",
            background: added ? "var(--iron)" : "var(--ember)",
            border: 0, color: added ? "var(--soot)" : "#170904", cursor: added ? "default" : "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
          <Icon name={added ? "check" : "plus"} size={11} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { HomePage });
