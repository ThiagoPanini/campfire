import { Route, Routes, useLocation } from "react-router-dom";
import { AppPlaceholder } from "./app/Placeholder";
import { Home } from "./home/Home";
import { SignIn } from "./signin/SignIn";
import { SignUp } from "./signup/SignUp";
import { SignUpConfirm } from "./signup/SignUpConfirm";

type ModalRouteLocationState = {
  email?: string;
};

function ModalRoute() {
  const location = useLocation();
  const state = location.state as ModalRouteLocationState | null;
  const email = typeof state?.email === "string" ? state.email : "";

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
        <SignUpConfirm email={email} />
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
      <Route path="/app" element={<AppPlaceholder />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
