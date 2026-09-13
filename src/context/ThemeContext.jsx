import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ocean_theme") || "light";
    }
    return "light";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ocean_theme", theme);
      const root = document.documentElement;
      const body = document.body;
      const isDark = theme === "dark";
      // `dark` drives Tailwind dark: variants (new system).
      // `dark-cyber` drives the legacy cyberpunk.css overrides until
      // Phase 2 removes that layer.
      root.classList.toggle("dark", isDark);
      root.style.colorScheme = isDark ? "dark" : "light";
      if (isDark) {
        root.classList.add("dark-cyber");
        body.classList.add("dark-cyber");
      } else {
        root.classList.remove("dark-cyber");
        body.classList.remove("dark-cyber");
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
