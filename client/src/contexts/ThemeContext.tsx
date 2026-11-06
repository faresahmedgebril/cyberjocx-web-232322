import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

interface ThemeContextType {
  theme: Theme;
  preference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

function getInitialPreference(defaultTheme: Theme): ThemePreference {
  if (typeof window === "undefined") return defaultTheme;
  const storedPreference = window.localStorage.getItem("theme-preference");
  if (storedPreference === "light" || storedPreference === "dark" || storedPreference === "system") {
    return storedPreference;
  }
  const legacyTheme = window.localStorage.getItem("theme");
  return legacyTheme === "light" || legacyTheme === "dark" ? legacyTheme : defaultTheme;
}

function resolveTheme(preference: ThemePreference, prefersDark: boolean): Theme {
  return preference === "system" ? (prefersDark ? "dark" : "light") : preference;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [preference, setPreference] = useState<ThemePreference>(() => getInitialPreference(defaultTheme));
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = getInitialPreference(defaultTheme);
    const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return resolveTheme(initial, Boolean(prefersDark));
  });

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const applyPreference = () => setTheme(resolveTheme(preference, Boolean(media?.matches)));
    applyPreference();

    if (preference === "system") media?.addEventListener?.("change", applyPreference);
    if (switchable) {
      window.localStorage.setItem("theme-preference", preference);
      window.localStorage.setItem("theme", resolveTheme(preference, Boolean(media?.matches)));
    }

    return () => {
      if (preference === "system") media?.removeEventListener?.("change", applyPreference);
    };
  }, [preference, switchable]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    if (switchable) window.localStorage.setItem("theme", theme);
  }, [theme, switchable]);

  const setThemePreference = switchable
    ? (nextPreference: ThemePreference) => setPreference(nextPreference)
    : () => undefined;

  const toggleTheme = switchable
    ? () => setPreference(current => resolveTheme(current, theme === "dark") === "dark" ? "light" : "dark")
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, preference, setThemePreference, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
