export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start independent Google OAuth only from an event handler; the server creates
// the one-time state cookie and redirects to Google's account chooser.
import { apiUrl } from "@/features/api/config";

export const startLogin = () => {
  window.location.assign(apiUrl("/api/auth/google/login"));
};
