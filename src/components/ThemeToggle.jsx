import React from "react";
import { useTheme } from "../context/ThemeContext";
import Icon from "./icons";

export default function ThemeToggle() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle color theme"
      aria-pressed={isDark}
      className="oe-focus-visible inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border border-ink/15 bg-paper px-3 text-[13px] font-semibold text-ink transition-colors hover:bg-ink/[0.05] cursor-pointer
        dark:border-paper/20 dark:bg-ink dark:text-paper dark:hover:bg-paper/10"
    >
      <Icon name={isDark ? "sun" : "moon"} size={14} />
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
