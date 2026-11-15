const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiUrl = configuredApiUrl || `http://${window.location.hostname}:4000`;
const API_BASE = apiUrl.replace(/\/+$/, "").endsWith("/api")
  ? apiUrl.replace(/\/+$/, "")
  : `${apiUrl.replace(/\/+$/, "")}/api`;

const SESSION_TOKEN_KEY = "om-session-token";

export function setSessionToken(token) {
  if (token) localStorage.setItem(SESSION_TOKEN_KEY, token);
  else localStorage.removeItem(SESSION_TOKEN_KEY);
}

export function clearSessionToken() {
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

export async function apiRequest(path, options = {}) {
  const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      payload.detail || payload.error || "The request could not be completed",
    );
    error.status = response.status;
    throw error;
  }
  return payload;
}
