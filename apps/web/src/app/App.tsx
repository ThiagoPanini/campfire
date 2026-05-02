import { useCallback, useEffect, useState } from "react";
import { useSessionStore } from "@features/auth";
import { sanitizeNext } from "@features/auth/redirect";
import { translate } from "@i18n";
import { Nav } from "@shared/components/Nav";
import { HomePage } from "@pages/HomePage";
import { LandingPage } from "@pages/LandingPage";
import { ConfirmEmailPage } from "@pages/ConfirmEmailPage";
import { RepertoirePage } from "@pages/RepertoirePage";
import { SignInPage } from "@pages/SignInPage";
import { SignUpPage } from "@pages/SignUpPage";
import { RequireAuth } from "./router/guards";
import { isStaleOnboardingPath, pathToRoute, routeToPath, type RouteId } from "./router/routes";

export function App() {
  const session = useSessionStore();
  const [route, setRoute] = useState<RouteId>(() => pathToRoute(window.location.pathname));

  const navigate = useCallback((next: RouteId, replace = false) => {
    setRoute(next);
    const path = routeToPath(next);
    if (replace) window.history.replaceState(null, "", path);
    else window.history.pushState(null, "", path);
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(pathToRoute(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--cf-accent", session.accentPreset.hex);
    document.documentElement.style.setProperty("--cf-accent-dark", session.accentPreset.dark);
  }, [session.accentPreset]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_error")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    if (session.currentUser && route === "landing") {
      navigate("home", true);
    }
  }, [navigate, route, session.currentUser]);

  useEffect(() => {
    if (!isStaleOnboardingPath(window.location.pathname)) return;
    navigate(session.currentUser ? "home" : "landing", true);
  }, [navigate, session.currentUser]);

  const t = translate(session.language);
  const isProtected = route === "home" || route === "repertoire";
  const navAction = route === "landing"
    ? <button className="nav-button" onClick={() => navigate("signin")}>{t.nav.signin}</button>
    : isProtected
      ? <button className="nav-button" onClick={() => { session.signOut(); navigate("landing"); }}>{t.nav.signout}</button>
      : <button className="nav-button" onClick={() => navigate(route === "signin" ? "landing" : "signup")}>{t.nav.back}</button>;

  function renderRoute() {
    switch (route) {
      case "signin":
        return (
          <SignInPage
            language={session.language}
            googleEnabled={session.authConfig?.google.enabled ?? false}
            authSubmitting={session.authSubmitting}
            onSubmit={async (email, password) => {
              const result = await session.signIn(email, password);
              if (result === "authenticated") navigate("home");
              if (result === "confirmation_required") navigate("confirm");
              return result;
            }}
            onGoogle={() => session.signInWithGoogle()}
            onSwap={() => navigate("signup")}
          />
        );
      case "signup":
        return (
          <SignUpPage
            language={session.language}
            googleEnabled={session.authConfig?.google.enabled ?? false}
            authSubmitting={session.authSubmitting}
            onSubmit={async (email, password) => {
              const result = await session.signUp(email, password);
              if (result === "authenticated") navigate("home");
              if (result === "confirmation_required") navigate("confirm");
              return result;
            }}
            onGoogle={() => session.signUpWithGoogle()}
            onSwap={() => navigate("signin")}
          />
        );
      case "confirm": {
        const params = new URLSearchParams(window.location.search);
        const email = params.get("email") ?? session.unconfirmedEmail ?? "";
        return (
          <ConfirmEmailPage
            language={session.language}
            email={email}
            authSubmitting={session.authSubmitting}
            expiresInSeconds={session.confirmationTimings?.expiresInSeconds ?? null}
            resendCooldownSeconds={session.confirmationTimings?.resendCooldownSeconds ?? null}
            issuedAt={session.confirmationIssuedAt}
            onConfirm={async (confirmEmail, code) => {
              const ok = await session.confirm(confirmEmail, code);
              if (ok) {
                const next = sanitizeNext(params.get("next"));
                navigate(pathToRoute(next ?? "/home"), true);
              }
              return ok;
            }}
            onResend={session.resend}
          />
        );
      }
      case "home":
        return session.currentUser ? (
          <HomePage
            language={session.language}
            onRepertoire={() => navigate("repertoire")}
          />
        ) : null;
      case "repertoire":
        return <RepertoirePage language={session.language} onHome={() => navigate("home")} />;
      default:
        return (
          <LandingPage
            language={session.language}
            accent={session.accent}
            onLanguage={session.setLanguage}
            onAccent={session.setAccent}
            onEnter={() => navigate("signup")}
          />
        );
    }
  }

  return (
    <>
      <Nav action={navAction} onHome={() => navigate(session.currentUser ? "home" : "landing")} />
      <RequireAuth
        route={route}
        isAuthenticated={Boolean(session.currentUser)}
        isCheckingAuth={!session.authReady}
        isUnconfirmed={Boolean(session.unconfirmedEmail)}
        onUnconfirmed={() => navigate("confirm", true)}
        onUnauthenticated={() => {
          const next = sanitizeNext(window.location.pathname + window.location.search);
          if (next) sessionStorage.setItem("campfire.auth.next", next);
          navigate("signin", true);
        }}
      >
        {renderRoute()}
      </RequireAuth>
    </>
  );
}
