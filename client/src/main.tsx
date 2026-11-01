import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiUrl } from "@/features/api/config";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";

// OAuth returns the short-lived app session in the URL fragment. The fragment
// is never sent to the server; bind it to the state created in this browser tab,
// store the session, then remove the fragment before rendering the app.
if (typeof window !== "undefined") {
  try {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const returnedToken = fragment.get("session");
    const returnedState = fragment.get("oauthState");
    if (returnedToken || returnedState) {
      const expectedState = sessionStorage.getItem("cyberjocx-oauth-state");
      if (returnedToken && returnedState && expectedState && returnedState === expectedState) {
        sessionStorage.setItem("cyberjocx-session", returnedToken);
      }
      sessionStorage.removeItem("cyberjocx-oauth-state");
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
  } catch (error) {
    console.error("[Auth bootstrap] Could not restore OAuth session", error);
  }
}

const queryClient = new QueryClient();
const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;
  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;
  if (!isUnauthorized) return;
  startLogin();
};
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});
queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: apiUrl("/api/trpc"),
      transformer: superjson,
      fetch(input, init) {
        const headers = new Headers(init?.headers);
        try {
          const sessionToken = sessionStorage.getItem("cyberjocx-session");
          if (sessionToken) headers.set("Authorization", "Bearer " + sessionToken);
          else headers.delete("Authorization");
        } catch {
          // HttpOnly cookie authentication remains available when sessionStorage is blocked.
        }
        return globalThis.fetch(input, {
          ...(init ?? {}),
          headers,
          credentials: "include",
        });
      },
    }),
  ],
});
createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
