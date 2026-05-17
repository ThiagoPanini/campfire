import { Route, Routes, useLocation } from "react-router-dom";
import { AppPlaceholder } from "./app/Placeholder";
import { Home } from "./home/Home";
import { SignIn } from "./signin/SignIn";
import { SignUp } from "./signup/SignUp";
import { SignUpConfirm } from "./signup/SignUpConfirm";

function ModalRoute() {
  const location = useLocation();

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

  return null;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<ModalRoute />} />
      <Route path="/signin" element={<ModalRoute />} />
      <Route path="/signup/confirm" element={<SignUpConfirm />} />
      <Route path="/app" element={<AppPlaceholder />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
