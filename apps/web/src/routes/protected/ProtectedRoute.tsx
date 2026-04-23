import { PropsWithChildren, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { getSession, isAuthenticated, requireAuthenticatedPath, subscribeToSessionChanges } from "../../features/auth/session";

export function ProtectedRoute({ children }: PropsWithChildren): JSX.Element {
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  useEffect(() => subscribeToSessionChanges(() => setAuthenticated(isAuthenticated())), []);

  if (!authenticated || !getSession()) {
    return <Navigate to={`/?returnTo=${encodeURIComponent(requireAuthenticatedPath(location.pathname))}`} replace />;
  }

  return <>{children}</>;
}
