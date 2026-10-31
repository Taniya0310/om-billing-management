const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiUrl = configuredApiUrl || `http://${window.location.hostname}:4000`;
const API_BASE = apiUrl.replace(/\/+$/, "").endsWith("/api")
  ? apiUrl.replace(/\/+$/, "")
  : `${apiUrl.replace(/\/+$/, "")}/api`;

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
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
