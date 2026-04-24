import { PropsWithChildren, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { getSession, isAuthenticated, requireAuthenticatedPath, subscribeToSessionChanges } from "../../features/auth/session";
import { useMe } from "../../features/me/useMe";

export function ProtectedRoute({ children }: PropsWithChildren): JSX.Element {
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  useEffect(() => subscribeToSessionChanges(() => setAuthenticated(isAuthenticated())), []);

  if (!authenticated || !getSession()) {
    return <Navigate to={`/signin?returnTo=${encodeURIComponent(requireAuthenticatedPath(location.pathname))}`} replace />;
  }

  return <AuthenticatedRoute>{children}</AuthenticatedRoute>;
}

function AuthenticatedRoute({ children }: PropsWithChildren): JSX.Element {
  const location = useLocation();
  const me = useMe();

  if (me.isLoading) {
    return <main aria-label="Loading session" />;
  }

  if (me.error) {
    return <Navigate to="/signin" replace />;
  }

  if (
    location.pathname === "/app" &&
    me.data?.onboarding.status === "required"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
