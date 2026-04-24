import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  DesignGlobalStyles,
  MonoLabel,
  Nav,
  pageBaseStyle,
} from "../../design/primitives";
import { ACCENT, FONT_DISPLAY } from "../../design/tokens";
import { completeRedirect } from "../../features/auth/cognitoRedirect";

export function AuthCallbackPage(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    void completeRedirect()
      .then(() => navigate("/app", { replace: true }))
      .catch(() => navigate("/", { replace: true }));
  }, [navigate]);

  return (
    <main style={pageBaseStyle}>
      <DesignGlobalStyles />
      <Nav />
      <section
        className="cf-fade-up"
        style={{
          maxWidth: 560,
          margin: "0 auto",
          width: "100%",
          padding:
            "clamp(120px, 18vw, 160px) clamp(24px, 6vw, 64px) clamp(60px, 8vw, 96px)",
        }}
      >
        <MonoLabel size={10} color={ACCENT}>
          AUTH CALLBACK
        </MonoLabel>
        <h1
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(34px, 6vw, 48px)",
            lineHeight: 0.95,
            letterSpacing: "0.03em",
            color: "#fff",
            marginTop: 16,
            marginBottom: 18,
            fontWeight: 400,
          }}
        >
          HANDING THE KEY BACK
          <br />
          <span style={{ color: ACCENT }}>TO CAMPFIRE.</span>
        </h1>
        <p style={{ fontSize: 15, color: "#777", lineHeight: 1.7 }}>
          We&apos;re finishing the secure redirect, restoring your session, and routing you into
          the authenticated shell.
        </p>
      </section>
    </main>
  );
}
