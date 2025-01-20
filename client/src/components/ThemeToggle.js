import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
    >
      {theme === 'dark' ? (
        <Moon size={20} strokeWidth={2} />
      ) : (
        <Sun size={20} strokeWidth={2} />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
} 