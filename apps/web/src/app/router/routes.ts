export type RouteId = "landing" | "signin" | "signup" | "home" | "repertoire";

export const ROUTES: Record<RouteId, string> = {
  landing: "/",
  signin: "/signin",
  signup: "/signup",
  home: "/",
  repertoire: "/repertoire",
};

export const PROTECTED_ROUTES = new Set<RouteId>(["home", "repertoire"]);

const STALE_ONBOARDING_PATH = "/onboarding";
const LEGACY_HOME_PATH = "/home";

function cleanPath(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

export function isStaleOnboardingPath(pathname: string) {
  return cleanPath(pathname) === STALE_ONBOARDING_PATH;
}

export function pathToRoute(pathname: string): RouteId {
  const clean = cleanPath(pathname);
  if (clean === STALE_ONBOARDING_PATH) return "landing";
  if (clean === LEGACY_HOME_PATH) return "home";
  const match = Object.entries(ROUTES).find(([, path]) => path === clean);
  return (match?.[0] as RouteId | undefined) ?? "landing";
}

export function routeToPath(route: RouteId) {
  return ROUTES[route];
}
