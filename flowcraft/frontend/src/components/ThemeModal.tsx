import { For, Show, createMemo, createSignal } from "solid-js";
import {
  THEMES,
  currentTheme,
  applyTheme,
  themesByCategory,
  type ThemeConfig,
  type ThemeKey,
} from "../store/themeStore";

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryKey = "all" | ThemeConfig["category"];

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  all: "All",
  neon: "Neon",
  classic: "Classic",
  pastel: "Pastel",
  dark: "Dark",
};

export default function ThemeModal(props: ThemeModalProps) {
  const [activeCategory, setActiveCategory] = createSignal<CategoryKey>("all");

  const grouped = createMemo(() => themesByCategory());

  const visibleThemes = createMemo<ThemeConfig[]>(() => {
    const cat = activeCategory();
    if (cat === "all") return THEMES;
    return grouped()[cat] ?? [];
  });

  const categories = createMemo<CategoryKey[]>(() => {
    const keys = Object.keys(grouped()) as ThemeConfig["category"][];
    return ["all", ...keys];
  });

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) props.onClose();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") props.onClose();
  };

  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div class="relative w-full max-w-md bg-card-bg border border-card-border rounded-3xl p-6 shadow-2xl backdrop-blur-2xl flex flex-col max-h-[85vh]">
          {/* Modal Header */}
          <div class="flex items-center justify-between pb-4 border-b border-card-border mb-4 shrink-0">
            <h3 class="text-sm font-bold uppercase tracking-wider text-text-main flex items-center gap-2">
              🎨 Choose Appearance
            </h3>
            <button
              type="button"
              onClick={props.onClose}
              aria-label="Close theme modal"
              class="w-8 h-8 rounded-xl bg-app-bg/80 border border-card-border hover:border-accent-border text-text-muted hover:text-text-main flex items-center justify-center transition-all"
            >
              ✕
            </button>
          </div>

          {/* Category Tabs */}
          <div class="flex gap-1.5 mb-4 shrink-0 flex-wrap">
            <For each={categories()}>
              {(cat) => (
                <button
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  class={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    activeCategory() === cat
                      ? "bg-accent-subtle border-accent-border text-accent-primary"
                      : "bg-app-bg/60 border-card-border/80 text-text-muted hover:text-text-main hover:border-card-border"
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              )}
            </For>
          </div>

          {/* Theme List (Scrollable) */}
          <div class="space-y-2.5 overflow-y-auto pr-1 -mr-1 flex-1">
            <For each={visibleThemes()}>
              {(t) => {
                const isActive = () => currentTheme() === t.key;
                return (
                  <button
                    type="button"
                    onClick={() => applyTheme(t.key as ThemeKey)}
                    class={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                      isActive()
                        ? "bg-accent-subtle border-accent-border shadow-md"
                        : "bg-app-bg/60 border-card-border/80 hover:border-card-border hover:bg-app-bg/80"
                    }`}
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <span
                        class="w-4 h-4 rounded-full shadow-sm shrink-0 border border-white/20"
                        style={{ "background-color": t.color }}
                      />
                      <span class="text-xs font-semibold text-text-main truncate">
                        {t.name}
                      </span>
                    </div>

                    <Show when={isActive()}>
                      <span class="text-xs font-bold text-accent-primary shrink-0 ml-2">
                        ✓ Active
                      </span>
                    </Show>
                  </button>
                );
              }}
            </For>

            <Show when={visibleThemes().length === 0}>
              <p class="text-center text-xs text-text-subtle py-6">
                No themes in this category.
              </p>
            </Show>
          </div>

          {/* Footer hint */}
          <div class="pt-3 mt-3 border-t border-card-border shrink-0">
            <p class="text-[10px] text-text-subtle text-center">
              Press{" "}
              <kbd class="px-1.5 py-0.5 rounded bg-app-bg border border-card-border text-text-muted font-mono">
                Esc
              </kbd>{" "}
              to close · {THEMES.length} themes available
            </p>
          </div>
        </div>
      </div>
    </Show>
  );
}
