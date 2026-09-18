import { createSignal, onMount } from "solid-js";
import { currentTheme, applyTheme } from "../store/themeStore";
import ThemeModal from "./ThemeModal";

export default function Header() {
  const [isModalOpen, setIsModalOpen] = createSignal(false);

  onMount(() => {
    applyTheme(currentTheme());
  });

  return (
    <>
      <header class="mb-4 select-none shrink-0">
        <div class="relative overflow-hidden rounded-2xl bg-card-bg border border-card-border px-5 py-3.5 shadow-lg backdrop-blur-xl">
          <div class="relative z-10 flex items-center justify-between gap-4">
            {/* Title */}
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-accent-subtle border border-accent-border flex items-center justify-center text-accent-primary shrink-0 shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-base font-bold text-text-main tracking-tight">
                    Flight PDF Time Converter
                  </h1>
                  <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-subtle border border-accent-border text-accent-primary text-[10px] font-semibold">
                    v2.0
                  </div>
                </div>
                <p class="text-[11px] text-text-muted hidden sm:block">
                  Convert 12-hour ticket times into 24-hour format
                </p>
              </div>
            </div>

            {/* Theme Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-app-bg/80 hover:bg-card-border/50 border border-card-border hover:border-accent-border text-text-main text-xs font-semibold transition-all active:scale-95 shadow-sm"
            >
              <span>🎨</span>
              <span>Theme</span>
            </button>
          </div>
        </div>
      </header>

      <ThemeModal
        isOpen={isModalOpen()}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
