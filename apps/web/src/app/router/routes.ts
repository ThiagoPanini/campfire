export type RouteId = "landing" | "signin" | "signup" | "home" | "repertoire";

export const ROUTES: Record<RouteId, string> = {
  landing: "/",
  signin: "/signin",
  signup: "/signup",
  home: "/home",
  repertoire: "/repertoire",
};

export const PROTECTED_ROUTES = new Set<RouteId>(["home", "repertoire"]);

const STALE_ONBOARDING_PATH = "/onboarding";

function cleanPath(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

export function isStaleOnboardingPath(pathname: string) {
  return cleanPath(pathname) === STALE_ONBOARDING_PATH;
}

export function pathToRoute(pathname: string): RouteId {
  const clean = cleanPath(pathname);
  if (clean === STALE_ONBOARDING_PATH) return "landing";
  const match = Object.entries(ROUTES).find(([, path]) => path === clean);
  return (match?.[0] as RouteId | undefined) ?? "landing";
}

export function routeToPath(route: RouteId) {
  return ROUTES[route];
}
