"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useIsClient } from "@/hooks/useIsClient";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsClient();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      suppressHydrationWarning
      aria-label={
        mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"
      }
      onClick={() => {
        if (!mounted) return;
        setTheme(isDark ? "light" : "dark");
      }}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
    >
      {!mounted ? (
        <Moon size={17} aria-hidden className="opacity-50" />
      ) : isDark ? (
        <Sun size={17} />
      ) : (
        <Moon size={17} />
      )}
    </button>
  );
}
