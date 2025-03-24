"use client";

import {
  createContext,
  useContext,
  useState,
} from "react";
import { ThemeProvider as NextThemesProvider , useTheme as useNextTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";
import { type ThemeConfig, themeConfig, } from "@/lib/theme-config";

interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to access next-themes
function useColorScheme() {
  const { resolvedTheme } = useNextTheme();
  return {
    isDarkMode: resolvedTheme === "dark",
  };
}

// Wrapper component that provides theme context
function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(themeConfig);
  const { isDarkMode } = useColorScheme();

  // useLayoutEffect(() => {
  //   // Apply theme configuration when it changes or when dark mode changes
  //   applyThemeConfig(theme, isDarkMode);
  // }, [theme, isDarkMode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeContextProvider>{children}</ThemeContextProvider>
    </NextThemesProvider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
