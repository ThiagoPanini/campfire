// Cadastro — multi-step signup: name/avatar → instruments → genres

function SignupPage({ lang, intensity, showBg, onEnter }) {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [avatarIdx, setAvatarIdx] = React.useState(0);
  const [instruments, setInstruments] = React.useState([]);
  const [genres, setGenres] = React.useState([]);

  const STEPS = 3;
  const avatarHues = ["#ff7a1a", "#ffb347", "#d9361e", "#d9a441", "#7d6a86", "#6f8ea3", "#4d7c59", "#c97a4a"];

  const next = () => step < STEPS - 1 ? setStep(step + 1) : onEnter("home");
  const back = () => step > 0 ? setStep(step - 1) : onEnter("login");

  const canContinue = step === 0 ? name.trim().length > 1 : step === 1 ? instruments.length > 0 : true;

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "var(--coal)" }}>
      {showBg && <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 70% at 50% 100%, rgba(255,120,40,0.18) 0%, rgba(217,54,30,0.1) 30%, transparent 65%)" }} />}
      {showBg && <EmberField intensity={intensity * 0.5} seed={5} />}

      <header style={{ position: "relative", zIndex: 5, padding: "24px clamp(20px, 4vw, 48px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo size={26} />
        <button onClick={() => onEnter("home")} style={{ background: "transparent", border: 0, color: "var(--soot)", fontSize: 12.5, cursor: "pointer", fontFamily: "var(--f-strong)", fontWeight: 600, letterSpacing: "0.02em" }}>
          {T(lang, "skip_for_now")}
        </button>
      </header>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px clamp(20px, 4vw, 32px) 80px", position: "relative", zIndex: 5 }}>
        {/* Progress */}
        <div style={{ display: "flex", gap: 8, marginBottom: 36 }}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 999,
              background: i <= step ? "linear-gradient(90deg, #ff7a1a, #ffb347)" : "var(--iron)",
              boxShadow: i === step ? "0 0 16px rgba(255,122,26,0.6)" : "none",
              transition: "all 0.4s ease",
            }} />
          ))}
        </div>

        <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ember)", marginBottom: 12 }}>
          {lang === "pt" ? `Passo ${step + 1} de ${STEPS}` : `Step ${step + 1} of ${STEPS}`}
        </div>

        <h1 className="display" key={step} style={{
          fontSize: "clamp(32px, 4.5vw, 44px)",
          margin: "0 0 12px", color: "var(--firelit)", fontStyle: "italic", letterSpacing: "-0.01em",
          animation: "stagger-rise 0.5s ease both",
        }}>
          {step === 0 ? T(lang, "step_1_title") : step === 1 ? T(lang, "step_2_title") : T(lang, "step_3_title")}
        </h1>
        <p style={{ color: "var(--mist)", fontSize: 16, lineHeight: 1.55, marginBottom: 36, maxWidth: 480 }}>
          {step === 0 ? T(lang, "step_1_sub") : step === 1 ? T(lang, "step_2_sub") : T(lang, "step_3_sub")}
        </p>

        {/* Content */}
        <div style={{ minHeight: 260 }}>
          {step === 0 && (
            <div style={{ animation: "stagger-rise 0.5s ease both" }}>
              {/* Big avatar preview */}
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
                <div style={{ position: "relative" }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: "50%",
                    background: `radial-gradient(circle at 30% 25%, ${avatarHues[avatarIdx]}ee, ${avatarHues[avatarIdx]}66)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--f-strong)", fontWeight: 700, fontSize: 40, color: "#170904",
                    boxShadow: `0 0 0 3px var(--coal), 0 0 0 5px ${avatarHues[avatarIdx]}, 0 0 40px ${avatarHues[avatarIdx]}66, inset 0 2px 0 rgba(255,255,255,0.2)`,
                    transition: "box-shadow 0.3s ease, background 0.3s ease",
                  }}>
                    {(name.trim()[0] || "?").toUpperCase()}
                  </div>
                </div>
                <div>
                  <Label>{T(lang, "pick_avatar")}</Label>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {avatarHues.map((h, i) => (
                      <button key={h} type="button" onClick={() => setAvatarIdx(i)}
                        style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: `radial-gradient(circle at 30% 25%, ${h}ee, ${h}77)`,
                          border: "0",
                          cursor: "pointer",
                          boxShadow: avatarIdx === i ? `0 0 0 2px var(--coal), 0 0 0 3px ${h}, 0 0 12px ${h}99` : "inset 0 1px 0 rgba(255,255,255,0.2)",
                          transition: "box-shadow 0.15s ease, transform 0.15s ease",
                          transform: avatarIdx === i ? "scale(1.1)" : "scale(1)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <label style={{ display: "block", fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ash)", marginBottom: 8 }}>
                {T(lang, "your_name")}
              </label>
              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={lang === "pt" ? "Helena" : "Helena"}
                autoFocus
                style={{ fontSize: 17 }}
              />
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, animation: "stagger-rise 0.5s ease both" }}>
              {INSTRUMENTS_CATALOG.map((inst) => {
                const selected = instruments.includes(inst.id);
                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => setInstruments(selected ? instruments.filter(i => i !== inst.id) : [...instruments, inst.id])}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "16px 14px",
                      background: selected ? "linear-gradient(135deg, rgba(255,122,26,0.15), rgba(217,54,30,0.08))" : "var(--burnt)",
                      border: `1px solid ${selected ? "rgba(255,122,26,0.45)" : "var(--border-card)"}`,
                      borderRadius: 14,
                      color: selected ? "var(--firelit)" : "var(--mist)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: selected ? "0 0 0 1px rgba(255,122,26,0.2), 0 0 20px rgba(217,54,30,0.15)" : "var(--sh-inset)",
                      textAlign: "left",
                      position: "relative",
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: selected ? "rgba(255,122,26,0.25)" : "var(--iron)",
                      color: selected ? "var(--ember-hover)" : "var(--ash)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Icon name={inst.icon} size={18} />
                    </div>
                    <span style={{ fontFamily: "var(--f-strong)", fontWeight: 600, fontSize: 14 }}>
                      {inst.label[lang] || inst.label.en}
                    </span>
                    {selected && (
                      <div style={{ position: "absolute", top: 10, right: 10, width: 16, height: 16, borderRadius: "50%", background: "var(--ember)", display: "flex", alignItems: "center", justifyContent: "center", color: "#170904" }}>
                        <Icon name="check" size={11} strokeWidth={2.4} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, animation: "stagger-rise 0.5s ease both" }}>
              {GENRES_CATALOG.map((g) => {
                const selected = genres.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGenres(selected ? genres.filter(x => x !== g.id) : [...genres, g.id])}
                    style={{
                      padding: "12px 18px",
                      background: selected ? "linear-gradient(135deg, rgba(255,122,26,0.18), rgba(217,54,30,0.1))" : "var(--burnt)",
                      border: `1px solid ${selected ? "rgba(255,122,26,0.5)" : "var(--border-card)"}`,
                      borderRadius: 999,
                      color: selected ? "var(--firelit)" : "var(--mist)",
                      cursor: "pointer",
                      fontFamily: "var(--f-strong)",
                      fontWeight: 600,
                      fontSize: 14,
                      transition: "all 0.15s ease",
                      boxShadow: selected ? "0 0 20px rgba(217,54,30,0.25)" : "none",
                    }}
                  >
                    {g.label[lang] || g.label.en}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
          <button onClick={back} className="btn-ghost" style={{ padding: "12px 18px" }}>
            {step === 0 ? (lang === "pt" ? "Cancelar" : "Cancel") : T(lang, "back")}
          </button>
          <button onClick={next} className="btn-primary" disabled={!canContinue}
            style={{ padding: "14px 28px", opacity: canContinue ? 1 : 0.4, cursor: canContinue ? "pointer" : "not-allowed" }}>
            {step === STEPS - 1 ? T(lang, "finish") : T(lang, "continue")}
            <span style={{ marginLeft: 8, display: "inline-block" }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SignupPage });
