"use client";

import { createContext, useContext, useEffect, useState, useTransition, type ReactNode } from "react";
import { updateTheme } from "@/lib/actions/theme";
import type { Theme } from "@/lib/types";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
  pending: boolean;
} | null>(null);

export function ThemeProvider({
  theme,
  children,
}: {
  theme: Theme;
  children: ReactNode;
}) {
  const [current, setCurrent] = useState(theme);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setCurrent(theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function setTheme(next: Theme) {
    const previous = current;
    setCurrent(next);
    document.documentElement.dataset.theme = next;
    startTransition(async () => {
      const result = await updateTheme(next);
      if (result.error) {
        setCurrent(previous);
        document.documentElement.dataset.theme = previous;
      }
    });
  }

  return <ThemeContext.Provider value={{ theme: current, setTheme, pending }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    return {
      theme: "dark" as const,
      setTheme: () => {},
      pending: false,
    };
  }
  return value;
}
