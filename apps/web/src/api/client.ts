export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const fallbackMode = import.meta.env.VITE_AUTH_FALLBACK === "session-storage";
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

function fallbackRefreshToken() {
  // XSS trade-off: sessionStorage is readable by injected scripts. This is for demo hosts
  // that cannot preserve the httpOnly refresh cookie path.
  return fallbackMode ? sessionStorage.getItem("campfire.refreshToken") : null;
}

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? body?.detail?.message ?? "Request failed");
  }
  return body as T;
}

async function refreshAccessToken(): Promise<boolean> {
  const headers: HeadersInit = {};
  const fallback = fallbackRefreshToken();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (fallback) headers["X-Refresh-Token"] = fallback;
  try {
    const token = await request<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
      headers,
      credentials: "include",
      skipRefresh: true,
    });
    setAccessToken(token.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

type RequestInitWithRetry = RequestInit & { skipRefresh?: boolean };

export async function request<T>(path: string, init: RequestInitWithRetry = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (accessToken && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: init.credentials ?? (path === "/auth/refresh" || path === "/auth/logout" ? "include" : "same-origin"),
  });
  if (response.status === 401 && !init.skipRefresh && path !== "/auth/refresh") {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(path, { ...init, skipRefresh: true });
  }
  return parse<T>(response);
}
