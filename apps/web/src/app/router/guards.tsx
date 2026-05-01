import { useEffect, type ReactNode } from "react";
import { PROTECTED_ROUTES, type RouteId } from "./routes";

type Props = {
  route: RouteId;
  isAuthenticated: boolean;
  isCheckingAuth?: boolean;
  onUnauthenticated: () => void;
  isUnconfirmed?: boolean;
  onUnconfirmed?: () => void;
  children: ReactNode;
};

export function RequireAuth({
  route,
  isAuthenticated,
  isCheckingAuth = false,
  isUnconfirmed = false,
  onUnauthenticated,
  onUnconfirmed,
  children,
}: Props) {
  const protectedRoute = PROTECTED_ROUTES.has(route);

  useEffect(() => {
    if (protectedRoute && isCheckingAuth) return;
    if (protectedRoute && isUnconfirmed) {
      onUnconfirmed?.();
      return;
    }
    if (protectedRoute && !isAuthenticated) onUnauthenticated();
  }, [
    protectedRoute,
    isAuthenticated,
    isCheckingAuth,
    isUnconfirmed,
    onUnauthenticated,
    onUnconfirmed,
  ]);

  if (protectedRoute && (isCheckingAuth || isUnconfirmed || !isAuthenticated)) return null;
  return <>{children}</>;
}
