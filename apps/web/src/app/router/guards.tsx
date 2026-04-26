import { useEffect, type ReactNode } from "react";
import { PROTECTED_ROUTES, type RouteId } from "./routes";

type Props = {
  route: RouteId;
  isAuthenticated: boolean;
  onUnauthenticated: () => void;
  children: ReactNode;
};

export function RequireAuth({ route, isAuthenticated, onUnauthenticated, children }: Props) {
  const protectedRoute = PROTECTED_ROUTES.has(route);

  useEffect(() => {
    if (protectedRoute && !isAuthenticated) onUnauthenticated();
  }, [protectedRoute, isAuthenticated, onUnauthenticated]);

  if (protectedRoute && !isAuthenticated) return null;
  return <>{children}</>;
}
