export type RouteId = "landing" | "signin" | "signup" | "onboarding" | "home" | "repertoire";

export const ROUTES: Record<RouteId, string> = {
  landing: "/",
  signin: "/signin",
  signup: "/signup",
  onboarding: "/onboarding",
  home: "/home",
  repertoire: "/repertoire",
};

export const PROTECTED_ROUTES = new Set<RouteId>(["onboarding", "home", "repertoire"]);

export function pathToRoute(pathname: string): RouteId {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const match = Object.entries(ROUTES).find(([, path]) => path === clean);
  return (match?.[0] as RouteId | undefined) ?? "landing";
}

export function routeToPath(route: RouteId) {
  return ROUTES[route];
}
