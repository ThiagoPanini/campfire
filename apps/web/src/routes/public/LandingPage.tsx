import { useNavigate } from "react-router-dom";

import {
  AccentButton,
  DesignGlobalStyles,
  MonoLabel,
  Nav,
  NavLink,
  pageBaseStyle,
} from "../../design/primitives";
import { ACCENT, ACCENT_DARK, FONT_DISPLAY, SURFACE } from "../../design/tokens";

type CardIconType = "list" | "target" | "people";

function CardIcon({ type, color }: { type: CardIconType; color: string }): JSX.Element {
  if (type === "list") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect x="2" y="6" width="10" height="2" rx="1" fill={color} />
        <rect x="2" y="12" width="10" height="2" rx="1" fill={color} opacity={0.7} />
        <rect x="2" y="18" width="10" height="2" rx="1" fill={color} opacity={0.4} />
        <rect x="16" y="5" width="10" height="4" rx="2" fill={color} opacity={0.25} />
        <rect x="16" y="11" width="7" height="4" rx="2" fill={color} opacity={0.25} />
        <rect x="16" y="17" width="8" height="4" rx="2" fill={color} opacity={0.25} />
      </svg>
    );
  }
  if (type === "target") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <circle cx="14" cy="14" r="11" stroke={color} strokeWidth="1.5" opacity={0.3} />
        <circle cx="14" cy="14" r="7" stroke={color} strokeWidth="1.5" opacity={0.6} />
        <circle cx="14" cy="14" r="3" fill={color} />
        <line x1="22" y1="6" x2="17" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="19" y1="4" x2="22" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="6" x2="24" y2="3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="9" cy="10" r="4" stroke={color} strokeWidth="1.5" opacity={0.5} />
      <circle cx="19" cy="10" r="4" stroke={color} strokeWidth="1.5" opacity={0.5} />
      <circle cx="14" cy="9" r="4" fill={color} opacity={0.9} />
      <path d="M4 24c0-4 2.5-6 5-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity={0.4} />
      <path d="M24 24c0-4-2.5-6-5-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity={0.4} />
      <path d="M8 24c0-3.5 2.7-6 6-6s6 2.5 6 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

type TileVariant = "accent" | "surface" | "dark";

const FEATURES: Array<{
  kicker: string;
  body: string;
  icon: CardIconType;
  variant: TileVariant;
}> = [
  {
    kicker: "YOUR REPERTOIRE",
    body: "Every song you know, organised by instrument and how well you play it.",
    icon: "list",
    variant: "accent",
  },
  {
    kicker: "WHAT TO PRACTICE",
    body: "Songs you're still learning surface automatically so you always know what to work on next.",
    icon: "target",
    variant: "surface",
  },
  {
    kicker: "SHARE WITH YOUR CIRCLE",
    body: "Let your group see your set — so everyone knows what the room can play before the session starts.",
    icon: "people",
    variant: "dark",
  },
];

function tileColors(variant: TileVariant): {
  background: string;
  iconColor: string;
  kickerColor: string;
  textColor: string;
} {
  if (variant === "accent") {
    return {
      background: ACCENT,
      iconColor: "#000",
      kickerColor: "rgba(0,0,0,0.6)",
      textColor: "#000",
    };
  }
  if (variant === "dark") {
    return {
      background: ACCENT_DARK,
      iconColor: "#FFD9B8",
      kickerColor: "#FFD9B8",
      textColor: "#F2D4BC",
    };
  }
  return {
    background: SURFACE,
    iconColor: ACCENT,
    kickerColor: "#b5b5b5",
    textColor: "#bbb",
  };
}

export function LandingPage(): JSX.Element {
  const navigate = useNavigate();

  const goSignIn = (): void => navigate("/signin");
  const goSignUp = (): void => navigate("/signup");

  return (
    <main style={{ ...pageBaseStyle, display: "flex", flexDirection: "column" }}>
      <DesignGlobalStyles />
      <Nav rightSlot={<NavLink onClick={goSignIn}>SIGN IN</NavLink>} />

      <section
        style={{
          flex: 1,
          padding: "clamp(110px, 18vw, 168px) clamp(24px, 6vw, 80px) clamp(60px, 8vw, 100px)",
          maxWidth: 1300,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          className="cf-fade-up"
          style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 14 }}
        >
          <div style={{ width: 32, height: 1, background: ACCENT }} />
          <MonoLabel size={10} color={ACCENT}>
            EARLY ACCESS · CURRENTLY IN ALPHA
          </MonoLabel>
        </div>

        <h1
          className="cf-fade-up"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(52px, 11.5vw, 118px)",
            lineHeight: 0.93,
            letterSpacing: "0.025em",
            color: "#fff",
            marginBottom: "clamp(28px, 5vw, 48px)",
            maxWidth: 860,
            animationDelay: "0.06s",
            fontWeight: 400,
          }}
        >
          TRACK THE SONGS
          <br />
          YOU KNOW TO PLAY
          <br />
          AND SHARE
          <br />
          <span style={{ color: ACCENT }}>WITH YOUR GROUP.</span>
        </h1>

        <p
          className="cf-fade-up"
          style={{
            fontSize: "clamp(15px, 1.8vw, 17px)",
            fontWeight: 300,
            lineHeight: 1.7,
            color: "#777",
            maxWidth: 480,
            marginBottom: "clamp(36px, 6vw, 56px)",
            letterSpacing: "0.01em",
            animationDelay: "0.12s",
          }}
        >
          Build your personal repertoire by instrument, track what you&apos;re learning, and share
          your set with your group.
        </p>

        <div className="cf-fade-up" style={{ animationDelay: "0.18s" }}>
          <AccentButton size="lg" onClick={goSignUp}>
            ENTER CAMPFIRE
          </AccentButton>
        </div>
      </section>

      <section
        style={{
          borderTop: "1px solid #1e1e1e",
          padding: "clamp(40px, 7vw, 72px) clamp(24px, 6vw, 80px)",
          maxWidth: 1300,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            border: "1px solid #222",
            borderRadius: 20,
            overflow: "hidden",
            gap: 0,
          }}
        >
          {FEATURES.map((feature, index) => {
            const colors = tileColors(feature.variant);
            return (
              <div
                key={feature.kicker}
                style={{
                  background: colors.background,
                  padding: "clamp(24px, 3vw, 36px)",
                  minHeight: 220,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 20,
                  borderRight: index < FEATURES.length - 1 ? "1px solid #222" : "none",
                }}
              >
                <CardIcon type={feature.icon} color={colors.iconColor} />
                <div>
                  <MonoLabel
                    size={10}
                    color={colors.kickerColor}
                    style={{
                      display: "block",
                      marginBottom: 10,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }}
                  >
                    {feature.kicker}
                  </MonoLabel>
                  <p
                    style={{
                      fontSize: "clamp(13px, 1.3vw, 15px)",
                      fontWeight: 400,
                      lineHeight: 1.6,
                      color: colors.textColor,
                      letterSpacing: "0.01em",
                    }}
                  >
                    {feature.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer
        style={{
          borderTop: "1px solid #1a1a1a",
          padding: "20px clamp(24px, 6vw, 80px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          maxWidth: 1300,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <MonoLabel size={9} color="#444">
          Campfire is in alpha. Expect rough edges.
        </MonoLabel>
        <MonoLabel size={9} color="#333">
          © 2025 CAMPFIRE
        </MonoLabel>
      </footer>
    </main>
  );
}
