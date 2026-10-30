export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const startLogin = () => {
  if (typeof window === "undefined") return;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  window.location.assign(base + "login");
};
