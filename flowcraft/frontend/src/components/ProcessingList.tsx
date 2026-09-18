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
          <div class="flex items-center justify-between p-4 rounded-2xl bg-card-bg border border-card-border shadow-md backdrop-blur-md animate-fade-in">
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="w-9 h-9 rounded-xl bg-accent-subtle border border-accent-border flex items-center justify-center text-accent-primary shrink-0">
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
                <p class="text-xs font-semibold text-text-main truncate">
                  {item.name}
                </p>
                <p class="text-[10px] text-accent-primary font-medium animate-pulse mt-0.5">
                  Converting ticket format...
                </p>
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
