// Resolves the FastAPI base URL for browser-side dashboard fetches (public env fallback).

export function getClientBackendBaseUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (fromPublic !== undefined && fromPublic.length > 0) {
    return fromPublic.replace(/\/$/, "");
  }
  return "http://localhost:8000";
}
