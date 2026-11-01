const DEFAULT_API_BASE_URL = typeof window !== "undefined" && window.location.hostname === "faresahmedgebril.github.io"
  ? "https://cyberjocx-api.gebrilfares972.workers.dev"
  : "";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
export const apiUrl = (path: string) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
