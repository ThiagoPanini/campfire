import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { completeSignIn } from "../../features/auth/session";

export function AuthCallbackPage(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    void completeSignIn()
      .then(() => navigate("/app/me", { replace: true }))
      .catch(() => navigate("/", { replace: true }));
  }, [navigate]);

  return (
    <main className="page page-center">
      <div className="status-card">
        <p className="eyebrow">Auth callback</p>
        <h1>Handing the room key back to Campfire.</h1>
        <p>
          We&apos;re finishing the secure redirect, restoring your session, and routing you into the
          authenticated shell.
        </p>
        <div className="status-actions">
          <span className="status-pill">Secure handoff in progress</span>
        </div>
      </div>
    </main>
  );
}
