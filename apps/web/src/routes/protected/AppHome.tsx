import { useNavigate } from "react-router-dom";

import {
  AccentButton,
  DesignGlobalStyles,
  MonoLabel,
  Nav,
  NavLink,
  pageBaseStyle,
} from "../../design/primitives";
import { ACCENT, FONT_DISPLAY } from "../../design/tokens";
import { getSession, signOut } from "../../features/auth/session";
import { useMe } from "../../features/me/useMe";

export function AppHome(): JSX.Element {
  const navigate = useNavigate();
  const session = getSession();
  const { data, isLoading, error } = useMe();

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    navigate("/", { replace: true });
  };

  const displayName = data?.user.displayName ?? session?.displayName ?? "Campfire member";

  return (
    <main style={pageBaseStyle}>
      <DesignGlobalStyles />
      <Nav rightSlot={<NavLink onClick={() => void handleSignOut()}>SIGN OUT</NavLink>} />

      <section
        className="cf-fade-up"
        style={{
          maxWidth: 760,
          margin: "0 auto",
          width: "100%",
          padding:
            "clamp(110px, 16vw, 160px) clamp(24px, 6vw, 64px) clamp(60px, 8vw, 96px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 24, height: 1, background: ACCENT }} />
          <MonoLabel size={10} color={ACCENT}>
            CAMPFIRE · HOME
          </MonoLabel>
        </div>

        <h1
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(42px, 8vw, 72px)",
            lineHeight: 0.95,
            letterSpacing: "0.025em",
            color: "#fff",
            fontWeight: 400,
            marginBottom: 20,
          }}
        >
          WELCOME BACK,
          <br />
          <span style={{ color: ACCENT }}>{displayName.toUpperCase()}.</span>
        </h1>

        <p
          style={{
            fontSize: 17,
            fontWeight: 300,
            color: "#888",
            lineHeight: 1.7,
            maxWidth: 520,
            marginBottom: 40,
          }}
        >
          This is your Campfire. Your repertoire, what you&apos;re learning, and everything your
          circle can play will live here.
        </p>

        {isLoading && (
          <MonoLabel size={10} color="#666">
            RESOLVING YOUR SESSION…
          </MonoLabel>
        )}

        {error && (
          <p style={{ color: "#FF6B6B", fontSize: 13, marginBottom: 16 }}>
            Could not load your profile. Please sign in again.
          </p>
        )}

        {data && (
          <div
            style={{
              border: "1px solid #222",
              borderRadius: 20,
              padding: "clamp(20px, 3vw, 32px)",
              background: "#181818",
              display: "grid",
              gap: 16,
            }}
          >
            <MonoLabel size={10} color={ACCENT}>
              MEMBER · {data.onboarding.status.toUpperCase()}
            </MonoLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <MonoLabel size={9} color="#555" style={{ display: "block", marginBottom: 6 }}>
                  NAME
                </MonoLabel>
                <span style={{ fontSize: 15, color: "#fff" }}>{data.user.displayName}</span>
              </div>
              <div>
                <MonoLabel size={9} color="#555" style={{ display: "block", marginBottom: 6 }}>
                  EMAIL
                </MonoLabel>
                <span style={{ fontSize: 15, color: "#fff", wordBreak: "break-all" }}>
                  {data.user.email}
                </span>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, display: "flex", gap: 14, flexWrap: "wrap" }}>
          <AccentButton size="lg" onClick={() => navigate("/onboarding")}>
            UPDATE PREFERENCES
          </AccentButton>
        </div>
      </section>
    </main>
  );
}
