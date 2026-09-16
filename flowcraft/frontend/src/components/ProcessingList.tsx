import { For } from "solid-js";
import type { PDFItem } from "../types/pdf";

interface ProcessingListProps {
  items: PDFItem[];
}

export default function ProcessingList(props: ProcessingListProps) {
  return (
    <div class="space-y-3">
      <For each={props.items}>
        {(item) => (
          <div class="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800 shadow-sm animate-fade-in">
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <svg
                  class="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
              </div>
              <div class="truncate">
                <p class="text-sm font-medium text-slate-200 truncate">
                  {item.name}
                </p>
                <p class="text-xs text-slate-400">
                  Processing ticket conversion...
                </p>
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
