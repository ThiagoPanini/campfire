import { Route, Routes, useLocation } from "react-router-dom";
import { AppConsole } from "./app/AppConsole";
import { Home } from "./home/Home";
import { SignIn } from "./signin/SignIn";
import { SignUp } from "./signup/SignUp";
import { SignUpConfirm } from "./signup/SignUpConfirm";

type ModalRouteLocationState = {
  email?: string;
  username?: string;
};

function ModalRoute() {
  const location = useLocation();
  const state = location.state as ModalRouteLocationState | null;
  const email = typeof state?.email === "string" ? state.email : "";
  const username = typeof state?.username === "string" ? state.username : "";

  if (location.pathname === "/signup") {
    return (
      <>
        <Home />
        <SignUp />
      </>
    );
  }

  if (location.pathname === "/signin") {
    return (
      <>
        <Home />
        <SignIn />
      </>
    );
  }

  if (location.pathname === "/signup/confirm") {
    if (!email) {
      return null;
    }
    return (
      <>
        <Home />
        <SignUpConfirm email={email} username={username} />
      </>
    );
  }

  return null;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<ModalRoute />} />
      <Route path="/signup/confirm" element={<ModalRoute />} />
      <Route path="/signin" element={<ModalRoute />} />
      <Route path="/app/*" element={<AppConsole />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
