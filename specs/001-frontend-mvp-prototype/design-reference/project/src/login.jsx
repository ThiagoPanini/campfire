// Login screen — dedicated sign-in / sign-up toggle with Google + email/password

function LoginPage({ lang, intensity, showBg, initialMode = "signin", prefilledEmail = "", onEnter }) {
  const [mode, setMode] = React.useState(initialMode);
  const [email, setEmail] = React.useState(prefilledEmail);
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState(null);

  const submit = (e) => {
    e?.preventDefault?.();
    setError(null);
    if (!email || !password) { setError("Fill in your email and password."); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      if (mode === "signup") onEnter("signup");
      else onEnter("home");
    }, 900);
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "var(--coal)" }}>
      {/* Softer firelit background (always some glow even if scene off) */}
      {showBg && (
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(50% 60% at 50% 50%, rgba(255,120,40,0.22) 0%, rgba(217,54,30,0.12) 30%, transparent 70%)" }} />
      )}
      {showBg && <EmberField intensity={intensity * 0.7} seed={3} />}

      {/* Close / back */}
      <button
        onClick={() => onEnter("landing")}
        aria-label="Back to landing"
        style={{
          position: "absolute", top: 24, left: 24, zIndex: 10,
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(18,12,9,0.6)", border: "1px solid var(--border-card)",
          color: "var(--mist)", cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(12px)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M13 5 L 7 10 L 13 15" />
        </svg>
      </button>

      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "40px 20px",
          position: "relative",
          zIndex: 5,
        }}
      >
        <div style={{ width: "100%", maxWidth: 440 }}>
          {/* Brand mark */}
          <div style={{ textAlign: "center", marginBottom: 28, animation: "stagger-rise 0.7s ease both" }}>
            <Logo size={36} showWordmark />
          </div>

          <form
            onSubmit={submit}
            style={{
              position: "relative",
              background: "linear-gradient(180deg, rgba(38,28,22,0.8) 0%, rgba(18,12,9,0.96) 100%)",
              border: "1px solid rgba(255,214,179,0.14)",
              borderRadius: "var(--r-panel)",
              padding: "34px 30px 28px",
              boxShadow: "var(--sh-fire), var(--sh-inset)",
              animation: "stagger-rise 0.8s ease both",
              animationDelay: "0.08s",
              opacity: 0,
            }}
          >
            {/* Heading */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ember)", marginBottom: 10 }}>
                {T(lang, "enter_campfire")}
              </div>
              <h1
                className="display"
                style={{ fontSize: 32, margin: "0 0 6px", fontStyle: "italic", color: "var(--firelit)" }}
              >
                {mode === "signin" ? (lang === "pt" ? "Volte pra roda" : "Step back in") : (lang === "pt" ? "Entre na roda" : "Step into the circle")}
              </h1>
              <div style={{ color: "var(--ash)", fontSize: 13.5 }}>
                {T(lang, "for_invited")}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", background: "rgba(12,8,6,0.7)", border: "1px solid var(--hairline)", borderRadius: 999, padding: 3, marginBottom: 22, position: "relative" }}>
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 3, bottom: 3,
                  left: mode === "signin" ? 3 : "50%",
                  width: "calc(50% - 3px)",
                  background: "linear-gradient(180deg, rgba(255,122,26,0.3) 0%, rgba(217,54,30,0.22) 100%)",
                  borderRadius: 999,
                  boxShadow: "0 0 0 1px rgba(255,122,26,0.35), 0 0 20px rgba(217,54,30,0.25)",
                  transition: "left 0.25s cubic-bezier(0.3,0.7,0.4,1)",
                }}
              />
              {[{id:"signin",label:T(lang,"sign_in")},{id:"signup",label:T(lang,"sign_up")}].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMode(tab.id)}
                  style={{
                    flex: 1,
                    position: "relative",
                    zIndex: 2,
                    background: "transparent",
                    border: 0,
                    padding: "10px 0",
                    color: mode === tab.id ? "var(--firelit)" : "var(--ash)",
                    fontFamily: "var(--f-strong)",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "color 0.2s ease",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={() => { setSubmitting(true); setTimeout(() => onEnter(mode === "signup" ? "signup" : "home"), 700); }}
              style={{
                width: "100%",
                padding: "14px 18px",
                background: "var(--iron)",
                color: "var(--firelit)",
                border: "1px solid var(--border-card)",
                borderRadius: 999,
                fontFamily: "var(--f-strong)",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.04em",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                cursor: "pointer",
                marginBottom: 18,
              }}
            >
              <GoogleG size={16} />
              {T(lang, "continue_google")}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 18px" }}>
              <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--soot)" }}>
                {T(lang, "or")}
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ash)", marginBottom: 8 }}>
                Email
              </label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={T(lang, "email_placeholder")}
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <label style={{ fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ash)" }}>
                  {lang === "pt" ? "Senha" : "Password"}
                </label>
                {mode === "signin" && (
                  <button type="button" style={{ background: "transparent", border: 0, color: "var(--soot)", fontSize: 11.5, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                    {lang === "pt" ? "Esqueci" : "Forgot?"}
                  </button>
                )}
              </div>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
              />
            </div>

            {error && (
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,90,78,0.08)", border: "1px solid rgba(255,90,78,0.25)", color: "var(--error)", fontSize: 12.5, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={submitting}
              style={{ width: "100%", padding: "16px 22px", opacity: submitting ? 0.75 : 1 }}>
              {submitting ? (lang === "pt" ? "Entrando…" : "Handing off…") : (mode === "signin" ? T(lang, "continue_email") : T(lang, "sign_up"))}
            </button>

            <div style={{ marginTop: 20, textAlign: "center", fontSize: 12.5, color: "var(--soot)" }}>
              {mode === "signin"
                ? <>{T(lang, "new_here")}{" "}<SwitchLink label={T(lang, "sign_up")} onClick={() => setMode("signup")} /></>
                : <>{T(lang, "have_account")}{" "}<SwitchLink label={T(lang, "sign_in")} onClick={() => setMode("signin")} /></>
              }
            </div>
          </form>

          <div style={{ textAlign: "center", marginTop: 20, fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--soot)" }}>
            {T(lang, "private_note")}
          </div>
        </div>
      </div>
    </div>
  );
}

function SwitchLink({ label, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ background: "transparent", border: 0, color: "var(--ember-hover)", fontWeight: 600, padding: 0, fontFamily: "inherit", fontSize: "inherit", cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(255,179,71,0.4)", textUnderlineOffset: 3 }}>
      {label}
    </button>
  );
}

Object.assign(window, { LoginPage });
