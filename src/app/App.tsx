import { useEffect, useState } from "react";
import { Nav } from "../components/Nav";
import { copy } from "../data/copy";
import { Home } from "../screens/Home";
import { Landing } from "../screens/Landing";
import { Onboarding } from "../screens/Onboarding";
import { SignIn } from "../screens/SignIn";
import { SignUp } from "../screens/SignUp";
import { pathToRoute, PROTECTED_ROUTES, routeToPath, type RouteId } from "./routes";
import { useSessionStore } from "./session-store";

export function App() {
  const session = useSessionStore();
  const [route, setRoute] = useState<RouteId>(() => pathToRoute(window.location.pathname));

  function navigate(next: RouteId, replace = false) {
    setRoute(next);
    const path = routeToPath(next);
    if (replace) window.history.replaceState(null, "", path);
    else window.history.pushState(null, "", path);
  }

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
    if (PROTECTED_ROUTES.has(route) && !session.currentUser) navigate("landing", true);
  }, [route, session.currentUser]);

  const t = copy[session.language];
  const navAction = route === "landing"
    ? <button className="nav-button" onClick={() => navigate("signin")}>{t.nav.signin}</button>
    : route === "home"
      ? <button className="nav-button" onClick={() => { session.signOut(); navigate("landing"); }}>{t.nav.signout}</button>
      : <button className="nav-button" onClick={() => navigate(route === "signin" ? "landing" : "signup")}>{t.nav.back}</button>;

  function renderScreen() {
    switch (route) {
      case "signin":
        return <SignIn language={session.language} onSubmit={(email, password) => {
          const ok = session.signIn(email, password);
          if (ok) navigate("home");
          return ok;
        }} onGoogle={() => { session.signInWithGoogle(); navigate("home"); }} onSwap={() => navigate("signup")} />;
      case "signup":
        return <SignUp language={session.language} onSubmit={(email, password) => { session.signUp(email, password); navigate("onboarding"); }} onGoogle={() => { session.signUpWithGoogle(); navigate("onboarding"); }} onSwap={() => navigate("signin")} />;
      case "onboarding":
        if (!session.currentUser) return null;
        return <Onboarding language={session.language} preferences={session.preferences} onSave={(preferences) => { session.savePreferences(preferences); navigate("home"); }} onSkip={() => navigate("home")} />;
      case "home":
        if (!session.currentUser) return null;
        return <Home language={session.language} user={session.currentUser} preferences={session.preferences} authMode={session.authMode} onUpdatePreferences={() => navigate("onboarding")} />;
      default:
        return <Landing language={session.language} accent={session.accent} onLanguage={session.setLanguage} onAccent={session.setAccent} onEnter={() => navigate("signup")} />;
    }
  }

  return (
    <>
      <Nav action={navAction} />
      {renderScreen()}
    </>
  );
}
