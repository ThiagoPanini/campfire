import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppHome } from "../routes/protected/AppHome";
import { OnboardingPage } from "../routes/protected/OnboardingPage";
import { ProtectedRoute } from "../routes/protected/ProtectedRoute";
import { AuthCallbackPage } from "../routes/public/AuthCallbackPage";
import { AuthPage } from "../routes/public/AuthPage";
import { LandingPage } from "../routes/public/LandingPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/signin",
    element: <AuthPage mode="signin" />,
  },
  {
    path: "/signup",
    element: <AuthPage mode="signup" />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallbackPage />,
  },
  {
    path: "/onboarding",
    element: (
      <ProtectedRoute>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AppHome />
      </ProtectedRoute>
    ),
  },
  {
    path: "/app/me",
    element: <Navigate to="/app" replace />,
  },
]);
