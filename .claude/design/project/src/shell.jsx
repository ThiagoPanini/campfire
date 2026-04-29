// App shell — sidebar nav + top bar, used by home and profile.

function AppShell({ lang, current, onNav, children, topBar, intensity, showBg, onEnter }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--umber)", position: "relative" }}>
      {/* Subtle ambient glow at bottom */}
      {showBg && (
        <div aria-hidden="true" style={{
          position: "fixed", inset: "auto 0 0 0", height: 200, pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(50% 100% at 50% 100%, rgba(255,122,26,0.1) 0%, transparent 70%)",
        }} />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh", position: "relative", zIndex: 1 }} className="shell-grid">
        <Sidebar lang={lang} current={current} onNav={onNav} onEnter={onEnter} />
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          {topBar}
          <div style={{ flex: 1, overflow: "auto" }}>
            {children}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav lang={lang} current={current} onNav={onNav} />

      <style>{`
        @media (max-width: 860px) {
          .shell-grid { grid-template-columns: 1fr !important; }
          .sidebar-rail { display: none !important; }
          .desktop-topbar-right { display: none !important; }
          .mobile-bottom-nav { display: flex !important; }
          .main-pad-mobile { padding-bottom: 96px !important; }
        }
      `}</style>
    </div>
  );
}

function Sidebar({ lang, current, onNav, onEnter }) {
  const NAV = [
    { id: "home", label: T(lang, "nav_tonight"), icon: "tonight" },
    { id: "songs", label: T(lang, "nav_songs"), icon: "songs" },
    { id: "groups", label: T(lang, "nav_groups"), icon: "groups" },
    { id: "history", label: T(lang, "nav_history"), icon: "history" },
    { id: "profile", label: T(lang, "nav_profile"), icon: "profile" },
  ];
  return (
    <aside className="sidebar-rail" style={{
      borderRight: "1px solid var(--hairline)",
      background: "var(--umber)",
      padding: "24px 16px",
      display: "flex", flexDirection: "column", gap: 4,
      position: "sticky", top: 0, height: "100vh",
    }}>
      <div style={{ padding: "4px 10px 22px" }}>
        <Logo size={24} />
      </div>

      <Label style={{ padding: "8px 12px 6px", fontSize: 10 }}>Circle</Label>
      {NAV.map((item) => {
        const active = current === item.id || (item.id === "home" && current === "home");
        return (
          <button key={item.id} onClick={() => onNav(item.id)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", borderRadius: 10,
              background: active ? "linear-gradient(90deg, rgba(255,122,26,0.15), rgba(255,122,26,0.04))" : "transparent",
              border: "0",
              color: active ? "var(--firelit)" : "var(--ash)",
              fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 14,
              cursor: "pointer",
              transition: "all 0.15s ease",
              position: "relative",
              textAlign: "left",
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "var(--firelit)"; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "var(--ash)"; }}
          >
            {active && <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 2, borderRadius: 2, background: "var(--ember)", boxShadow: "0 0 12px var(--ember)" }} />}
            <Icon name={item.icon} size={17} color={active ? "var(--ember)" : "currentColor"} strokeWidth={active ? 1.8 : 1.6} />
            {item.label}
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Me card */}
      <button onClick={() => onNav("profile")} style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px", borderRadius: 12,
        background: "var(--burnt)", border: "1px solid var(--border-card)",
        cursor: "pointer", textAlign: "left",
      }}>
        <Avatar name="Helena" size={32} ring online />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--f-strong)", fontWeight: 700, fontSize: 13, color: "var(--firelit)" }}>Helena</div>
          <div style={{ fontSize: 11, color: "var(--soot)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>helena@friends.fm</div>
        </div>
      </button>
    </aside>
  );
}

function MobileNav({ lang, current, onNav }) {
  const NAV = [
    { id: "home", label: T(lang, "nav_tonight"), icon: "tonight" },
    { id: "songs", label: T(lang, "nav_songs"), icon: "songs" },
    { id: "history", label: T(lang, "nav_history"), icon: "history" },
    { id: "profile", label: T(lang, "nav_profile"), icon: "profile" },
  ];
  return (
    <nav className="mobile-bottom-nav" style={{
      display: "none",
      position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 50,
      background: "rgba(18,12,9,0.85)", backdropFilter: "blur(20px)",
      border: "1px solid var(--border-card)", borderRadius: 18,
      padding: 8, justifyContent: "space-around",
      boxShadow: "var(--sh-fire)",
    }}>
      {NAV.map(item => {
        const active = current === item.id;
        return (
          <button key={item.id} onClick={() => onNav(item.id)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "8px 4px", border: 0, background: "transparent",
              color: active ? "var(--ember)" : "var(--ash)", cursor: "pointer",
              fontFamily: "var(--f-body)", fontSize: 10.5, fontWeight: 600,
            }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: active ? "rgba(255,122,26,0.14)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={item.icon} size={18} strokeWidth={active ? 1.8 : 1.6} />
            </div>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function TopBar({ lang, children, showSearch = true, onNav }) {
  return (
    <div className="topbar" style={{
      position: "sticky", top: 0, zIndex: 20,
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px clamp(16px, 3vw, 28px)",
      background: "rgba(12,8,6,0.82)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--hairline)",
    }}>
      {showSearch && (
        <div style={{ flex: 1, maxWidth: 520, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "var(--burnt)", border: "1px solid var(--border-card)", borderRadius: 999, minWidth: 0 }}>
          <Icon name="search" size={16} color="var(--ash)" />
          <input placeholder={T(lang, "search_songs")} style={{
            flex: 1, background: "transparent", border: 0, outline: "none",
            color: "var(--firelit)", fontFamily: "var(--f-body)", fontSize: 14, minWidth: 0,
          }} />
          <span className="mono" style={{ color: "var(--soot)", fontSize: 10 }}>⌘ K</span>
        </div>
      )}
      <div style={{ flex: 1 }} />
      <div className="desktop-topbar-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { AppShell, TopBar });
