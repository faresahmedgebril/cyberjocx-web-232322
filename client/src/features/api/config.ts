export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "https://cyberjocx-api-232322.onrender.com").replace(/\/$/, "");
export const apiUrl = (path: string) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
