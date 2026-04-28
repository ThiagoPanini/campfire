// Landing page — two variants: "scene" (stylized bonfire scene) and "abstract" (firelit gradient).

function LandingPage({ lang, intensity, showBg, variant, onEnter, onVariant }) {
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = (e) => {
    e?.preventDefault?.();
    if (!email) return;
    setSubmitting(true);
    setTimeout(() => { onEnter("login", { email }); setSubmitting(false); }, 700);
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "var(--coal)" }}>
      {/* Atmosphere */}
      {showBg && <BonfireScene variant={variant} intensity={intensity} />}

      {/* Top nav */}
      <header
        style={{
          position: "relative",
          zIndex: 5,
          padding: "24px clamp(20px, 4vw, 48px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Logo size={28} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <VariantSwitch variant={variant} onChange={onVariant} lang={lang} />
          <button
            className="btn-ghost"
            onClick={() => onEnter("login")}
            style={{ padding: "10px 18px", fontSize: 12 }}
          >
            {T(lang, "sign_in")}
          </button>
        </div>
      </header>

      {/* Hero layout */}
      <main
        style={{
          position: "relative",
          zIndex: 4,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(340px, 0.9fr)",
          gap: "clamp(24px, 4vw, 72px)",
          alignItems: "center",
          padding: "clamp(20px, 3vw, 48px) clamp(20px, 4vw, 64px) 80px",
          maxWidth: 1440,
          margin: "0 auto",
          minHeight: "calc(100vh - 92px)",
        }}
        className="landing-main"
      >
        {/* Left — hero copy + session cues */}
        <div style={{ maxWidth: 640 }}>
          <div style={{ animation: "stagger-rise 0.8s ease both", animationDelay: "0.05s", opacity: 0 }}>
            <LiveDot label={T(lang, "for_invited")} />
          </div>

          <h1
            className="display ember-text"
            style={{
              fontSize: "clamp(52px, 8vw, 96px)",
              margin: "20px 0 10px",
              animation: "stagger-rise 0.9s ease both",
              animationDelay: "0.12s",
              opacity: 0,
              fontStyle: "italic",
              letterSpacing: "-0.02em",
            }}
          >
            {T(lang, "hero_title")}
          </h1>

          <p
            style={{
              color: "var(--mist)",
              fontSize: "clamp(16px, 1.4vw, 19px)",
              lineHeight: 1.55,
              maxWidth: 520,
              margin: "0 0 32px",
              animation: "stagger-rise 0.9s ease both",
              animationDelay: "0.22s",
              opacity: 0,
            }}
          >
            {T(lang, "hero_sub")}
          </p>

          {/* Session cues */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 32,
              animation: "stagger-rise 0.9s ease both",
              animationDelay: "0.34s",
              opacity: 0,
            }}
          >
            <Chip tone="brass">
              <Icon name="calendar" size={13} />
              {T(lang, "friday_session")}
            </Chip>
            <Chip tone="smoke">
              <Icon name="spark" size={13} />
              {T(lang, "setlist_warming")}
            </Chip>
            <Chip tone="pine">
              <Icon name="check" size={13} />
              4 {T(lang, "friends_arriving")}
            </Chip>
          </div>

          {/* Arriving avatars */}
          <ArrivingAvatars lang={lang} />
        </div>

        {/* Right — integrated auth panel */}
        <AuthPanel
          lang={lang}
          email={email}
          setEmail={setEmail}
          onSubmit={submit}
          submitting={submitting}
          onEnter={onEnter}
        />
      </main>

      {/* Below the fold — 3 promises */}
      <section
        style={{
          position: "relative",
          zIndex: 3,
          padding: "80px clamp(20px, 4vw, 64px) 120px",
          maxWidth: 1440,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <Label>Small rituals · Familiar songs · One fire</Label>
          <h2
            className="display"
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              margin: "12px 0",
              color: "var(--firelit)",
              fontStyle: "italic",
              letterSpacing: "-0.01em",
            }}
          >
            {T(lang, "below_title")}
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          <PromiseCard icon="calendar" title={T(lang, "promise_plan")} body={T(lang, "promise_plan_body")} tint="#ff7a1a" />
          <PromiseCard icon="notebook" title={T(lang, "promise_remember")} body={T(lang, "promise_remember_body")} tint="#d9a441" />
          <PromiseCard icon="flame" title={T(lang, "promise_private")} body={T(lang, "promise_private_body")} tint="#d9361e" />
        </div>
      </section>

      <footer style={{ position: "relative", zIndex: 3, padding: "32px clamp(20px, 4vw, 64px) 48px", borderTop: "1px solid var(--hairline)", textAlign: "center", color: "var(--soot)", fontSize: 12 }}>
        <div style={{ fontFamily: "var(--f-mono)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
          {T(lang, "private_note")}
        </div>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .landing-main { grid-template-columns: 1fr !important; padding-top: 40px !important; }
        }
      `}</style>
    </div>
  );
}

function VariantSwitch({ variant, onChange, lang }) {
  return (
    <div style={{ display: "inline-flex", background: "rgba(20,12,8,0.6)", border: "1px solid var(--border-card)", borderRadius: 999, padding: 3, fontSize: 11, fontFamily: "var(--f-mono)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
      {["a", "b"].map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            border: 0,
            background: variant === v ? "var(--ember-tint)" : "transparent",
            color: variant === v ? "var(--ember-hover)" : "var(--ash)",
            padding: "6px 14px",
            borderRadius: 999,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "inherit",
            letterSpacing: "inherit",
            textTransform: "inherit",
            fontWeight: 600,
            transition: "all 0.15s ease",
          }}
        >
          {v === "a" ? "Scene" : "Ember"}
        </button>
      ))}
    </div>
  );
}

function ArrivingAvatars({ lang }) {
  const [visible, setVisible] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => {
      setVisible((v) => (v < FRIENDS.length ? v + 1 : v));
    }, 450);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, animation: "stagger-rise 0.9s ease both", animationDelay: "0.44s", opacity: 0 }}>
      <div style={{ display: "flex" }}>
        {FRIENDS.slice(0, 5).map((f, i) => (
          <div
            key={f.name}
            style={{
              marginLeft: i === 0 ? 0 : -10,
              transition: "opacity 0.6s ease, transform 0.6s ease",
              opacity: i < visible ? 1 : 0,
              transform: i < visible ? "translateY(0)" : "translateY(6px)",
            }}
          >
            <Avatar name={f.name} size={38} ring online={f.online} seed={i} />
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontFamily: "var(--f-strong)", fontWeight: 700, fontSize: 15, color: "var(--firelit)" }}>
          {visible >= 4 ? "4 friends arriving" : `${visible} ${T(lang, "friends_arriving")}`}
        </div>
        <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--soot)", marginTop: 2 }}>
          {T(lang, "tuning_a")}
        </div>
      </div>
    </div>
  );
}

function AuthPanel({ lang, email, setEmail, onSubmit, submitting, onEnter }) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        position: "relative",
        background: "linear-gradient(180deg, rgba(38,28,22,0.78) 0%, rgba(18,12,9,0.92) 100%)",
        border: "1px solid rgba(255,214,179,0.14)",
        borderRadius: "var(--r-panel)",
        padding: "32px 28px",
        boxShadow: "var(--sh-fire), var(--sh-inset), 0 0 0 1px rgba(255,122,26,0.08)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        animation: "stagger-rise 0.9s ease both",
        animationDelay: "0.3s",
        opacity: 0,
      }}
    >
      {/* Warm edge highlight */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: -1,
          borderRadius: "var(--r-panel)",
          padding: 1,
          background: "linear-gradient(135deg, rgba(255,180,100,0.35) 0%, transparent 40%, rgba(217,54,30,0.25) 100%)",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ember)" }}>
            {T(lang, "enter_campfire")}
          </div>
          <div className="display" style={{ fontSize: 26, marginTop: 6, color: "var(--firelit)", fontStyle: "italic" }}>
            {T(lang, "tagline")}
          </div>
        </div>
        <LiveDot label="live" />
      </div>

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
        style={{ marginBottom: 14 }}
      />

      <button
        type="submit"
        className="btn-primary"
        disabled={submitting}
        style={{
          width: "100%",
          marginBottom: 16,
          padding: "16px 22px",
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span className="spinner" style={{ width: 12, height: 12, border: "2px solid rgba(23,9,4,0.4)", borderTopColor: "#170904", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
            Handing off…
          </span>
        ) : (
          T(lang, "continue_email")
        )}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 16px" }}>
        <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
        <span style={{ fontFamily: "var(--f-mono)", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--soot)" }}>
          {T(lang, "or")}
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
      </div>

      <button
        type="button"
        onClick={() => onEnter("login")}
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
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--iron-hi)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--iron)"; e.currentTarget.style.borderColor = "var(--border-card)"; }}
      >
        <GoogleG size={16} />
        {T(lang, "continue_google")}
      </button>

      <div style={{ marginTop: 18, textAlign: "center", fontSize: 12.5, color: "var(--soot)" }}>
        {T(lang, "new_here")}{" "}
        <button type="button" onClick={() => onEnter("signup")} style={{ background: "transparent", border: 0, color: "var(--ember-hover)", cursor: "pointer", fontWeight: 600, padding: 0, fontFamily: "inherit", fontSize: "inherit", textDecoration: "underline", textDecorationColor: "rgba(255,179,71,0.4)", textUnderlineOffset: 3 }}>
          {T(lang, "sign_up")}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </form>
  );
}

function PromiseCard({ icon, title, body, tint }) {
  return (
    <div
      className="card"
      style={{
        padding: "28px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${tint}22 0%, transparent 70%)`,
        }}
      />
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${tint}33 0%, ${tint}11 100%)`,
          border: `1px solid ${tint}44`,
          color: tint,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
          boxShadow: `0 0 24px ${tint}22`,
        }}
      >
        <Icon name={icon} size={22} />
      </div>
      <h3 style={{ fontFamily: "var(--f-strong)", fontWeight: 700, fontSize: 19, margin: "0 0 8px", color: "var(--firelit)" }}>
        {title}
      </h3>
      <p style={{ color: "var(--mist)", fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>
        {body}
      </p>
    </div>
  );
}

Object.assign(window, { LandingPage });
