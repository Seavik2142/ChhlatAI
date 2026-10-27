import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import clsx from "clsx";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "chhlat_theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
  } catch (err) {
    console.error("Failed to read theme from localStorage", err);
  }
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  // Apply .dark class and data-theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (err) {
      console.error("Failed to save theme to localStorage", err);
    }
  };

  const toggleTheme = () => {
    // Quick toggle switches between light and dark
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

/**
 * Compact Icon Button for Layout Headers
 */
export function ThemeToggle({ className, id = "theme-toggle-btn" }: { className?: string; id?: string }) {
  const { resolvedTheme, toggleTheme, theme } = useTheme();

  return (
    <button
      id={id}
      type="button"
      aria-label="Toggle dark and light mode"
      onClick={toggleTheme}
      className={clsx(
        "relative flex size-9 items-center justify-center rounded-lg border transition-all cursor-pointer active:scale-95 shadow-sm",
        "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-amber-600 hover:border-amber-300",
        "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 dark:hover:text-amber-400 dark:hover:border-amber-500/50",
        className
      )}
      title={
        resolvedTheme === "dark"
          ? `Current: Dark mode (${theme === "system" ? "System" : "Manual"}). Click for Light mode.`
          : `Current: Light mode (${theme === "system" ? "System" : "Manual"}). Click for Dark mode.`
      }
    >
      {resolvedTheme === "dark" ? (
        <Sun size={17} className="text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon size={17} className="text-slate-600 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}

/**
 * Segmented Selector for Settings pages (Light / System / Dark)
 */
export function ThemeSegmentedControl({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-xl border p-1 gap-1 transition-colors",
        "border-slate-200 bg-slate-100/70",
        "dark:border-slate-700 dark:bg-slate-800/80",
        className
      )}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              isActive
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            )}
          >
            <Icon size={14} className={clsx(isActive && (opt.value === "dark" ? "text-indigo-400" : opt.value === "light" ? "text-amber-500" : "text-blue-500"))} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
