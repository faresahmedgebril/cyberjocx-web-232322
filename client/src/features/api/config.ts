export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "https://cyberjocx-api.gebrilfares972.workers.dev").replace(/\/$/, "");
export const apiUrl = (path: string) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
