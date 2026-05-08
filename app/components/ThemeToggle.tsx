"use client";

import { Moon, Sun } from "lucide-react";
import type { ThemeMode } from "../lib/types";

type ThemeToggleProps = {
  theme: ThemeMode;
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? Sun : Moon;
  const label = nextTheme === "dark" ? "Dark mode" : "Light mode";

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${label}`}
      title={`Switch to ${label}`}
    >
      <Icon size={17} />
      <span>{label}</span>
    </button>
  );
}
