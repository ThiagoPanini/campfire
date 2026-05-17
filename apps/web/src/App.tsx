import { Route, Routes } from "react-router-dom";
import { AppPlaceholder } from "./app/Placeholder";
import { Home } from "./home/Home";
import { SignUp } from "./signup/SignUp";
import { SignUpConfirm } from "./signup/SignUpConfirm";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signup/confirm" element={<SignUpConfirm />} />
      <Route path="/signin" element={<div>signin tbd</div>} />
      <Route path="/app" element={<AppPlaceholder />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
