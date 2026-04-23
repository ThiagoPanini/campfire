import { createBrowserRouter } from "react-router-dom";

import { LandingPage } from "../routes/public/LandingPage";
import { AuthCallbackPage } from "../routes/public/AuthCallbackPage";
import { AppShell } from "../routes/protected/AppShell";
import { MeBootstrapPage } from "../routes/protected/MeBootstrapPage";
import { ProtectedRoute } from "../routes/protected/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallbackPage />,
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <MeBootstrapPage />,
      },
      {
        path: "me",
        element: <MeBootstrapPage />,
      },
    ],
  },
]);
