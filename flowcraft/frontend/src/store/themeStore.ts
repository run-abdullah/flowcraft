import { createSignal } from "solid-js";

export type ThemeKey =
  | "emerald" | "cyber" | "violet" | "synthwave" | "indigo"
  | "rose" | "gold" | "ice" | "matrix" | "sunset"
  | "ocean" | "cherry" | "mono" | "lavender" | "crimson";

export interface ThemeConfig {
  name: string;
  key: ThemeKey;
  color: string;
  category: "neon" | "classic" | "pastel" | "dark";
}

export const THEMES: ThemeConfig[] = [
  // Neon
  { name: "Emerald Neon",   key: "emerald",   color: "#10b981", category: "neon" },
  { name: "Neon Cyber",     key: "cyber",     color: "#06b6d4", category: "neon" },
  { name: "Deep Violet",    key: "violet",    color: "#a855f7", category: "neon" },
  { name: "Synthwave",      key: "synthwave", color: "#f97316", category: "neon" },
  { name: "Indigo Corp",    key: "indigo",    color: "#6366f1", category: "neon" },
  { name: "Matrix",         key: "matrix",    color: "#22c55e", category: "neon" },

  // Classic
  { name: "Rose Quartz",    key: "rose",      color: "#f43f5e", category: "classic" },
  { name: "Royal Gold",     key: "gold",      color: "#eab308", category: "classic" },
  { name: "Cherry Red",     key: "cherry",    color: "#dc2626", category: "classic" },
  { name: "Crimson Night",  key: "crimson",   color: "#be123c", category: "classic" },

  // Pastel
  { name: "Ice Blue",       key: "ice",       color: "#38bdf8", category: "pastel" },
  { name: "Lavender Dream", key: "lavender",  color: "#c4b5fd", category: "pastel" },
  { name: "Sunset Peach",   key: "sunset",    color: "#fb7185", category: "pastel" },

  // Dark / Mono
  { name: "Ocean Deep",     key: "ocean",     color: "#0ea5e9", category: "dark" },
  { name: "Mono Slate",     key: "mono",      color: "#94a3b8", category: "dark" },
];

export const getInitialTheme = (): ThemeKey => {
  const saved = localStorage.getItem("flowcraft_theme") as ThemeKey;
  return saved && THEMES.some((t) => t.key === saved) ? saved : "emerald";
};

export const [currentTheme, setCurrentTheme] = createSignal<ThemeKey>(getInitialTheme());

export const applyTheme = (theme: ThemeKey) => {
  setCurrentTheme(theme);
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("flowcraft_theme", theme);
};

// ✨ Bonus: Cycle through themes
export const cycleTheme = (direction: 1 | -1 = 1) => {
  const idx = THEMES.findIndex((t) => t.key === currentTheme());
  const next = (idx + direction + THEMES.length) % THEMES.length;
  applyTheme(THEMES[next].key);
};

// ✨ Bonus: Group by category for UI pickers
export const themesByCategory = () =>
  THEMES.reduce((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {} as Record<ThemeConfig["category"], ThemeConfig[]>);
