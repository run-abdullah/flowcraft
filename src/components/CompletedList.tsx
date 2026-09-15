import { For, Show } from "solid-js";
import type { PDFItem } from "../types/pdf";
import { formatSize } from "../utils/format";

interface Props {
  items: PDFItem[];
  onDownload: (item: PDFItem) => void;
  onClear: () => void;
}

export default function CompletedList(props: Props) {
  return (
    <div class="rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-4 min-h-[360px] flex flex-col">
      <div class="flex items-center justify-between mb-3.5">
        <div class="flex items-center gap-2.5">
          <div class="relative flex w-2 h-2">
            <span class="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            <span class="relative w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
          </div>
          <h3 class="text-[11px] font-bold text-emerald-200/80 uppercase tracking-widest">
            Completed · {props.items.length}
          </h3>
        </div>
        <Show when={props.items.length > 0}>
          <button
            class="text-[11px] text-gray-400 hover:text-white transition-colors font-medium"
            onClick={props.onClear}
          >
            Clear all
          </button>
        </Show>
      </div>

      <Show
        when={props.items.length > 0}
        fallback={
          <div class="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div class="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-amber-500/10 border border-white/[0.06] flex items-center justify-center mb-5">
              <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 blur-xl opacity-50" />
              <svg
                class="relative w-7 h-7 text-emerald-300/70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p class="text-[14px] text-emerald-100/80 font-semibold tracking-tight">
              No files yet
            </p>
            <p class="text-[11px] text-emerald-200/40 mt-1.5 font-medium">
              Processed PDFs will appear here ✨
            </p>
          </div>
        }
      >
        <div class="space-y-2 flex-1">
          <For each={props.items}>
            {(item) => (
              <div class="group relative flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-400/30 transition-all duration-300 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-amber-500/[0.07] to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div class="relative w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                  <svg
                    class="w-4 h-4 text-emerald-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    stroke-width="3"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div class="relative flex-1 min-w-0">
                  <p class="text-[13px] truncate font-semibold text-white/90">
                    {item.name}
                  </p>
                  <p class="text-[11px] text-emerald-200/40 mt-0.5 font-medium">
                    {formatSize(item.size)}
                  </p>
                </div>
                <button
                  onClick={() => props.onDownload(item)}
                  class="relative opacity-0 group-hover:opacity-100 transition-all duration-300 p-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-amber-500 text-white hover:from-emerald-400 hover:to-amber-400 shadow-lg shadow-emerald-500/30"
                  title="Download"
                >
                  <svg
                    class="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4"
                    />
                  </svg>
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
