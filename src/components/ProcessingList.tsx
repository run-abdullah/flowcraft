import { For, Show } from "solid-js";
import type { PDFItem } from "../types/pdf";
import { formatSize } from "../utils/format";

interface Props {
  items: PDFItem[];
}

export default function ProcessingList(props: Props) {
  return (
    <Show when={props.items.length > 0}>
      <div class="rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-4">
        <div class="flex items-center gap-2.5 mb-3.5">
          <div class="relative flex w-2 h-2">
            <span class="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75" />
            <span class="relative w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
          </div>
          <h3 class="text-[11px] font-bold text-amber-200/80 uppercase tracking-widest">
            Processing · {props.items.length}
          </h3>
        </div>
        <div class="space-y-2">
          <For each={props.items}>
            {(item) => (
              <div class="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/[0.05] to-emerald-500/[0.05] border border-white/[0.06]">
                <div class="relative w-5 h-5 shrink-0">
                  <div class="absolute inset-0 rounded-full border-2 border-amber-400/20" />
                  <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400 border-r-emerald-400 animate-spin" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] truncate font-semibold text-white/90">
                    {item.name}
                  </p>
                  <p class="text-[11px] text-amber-200/50 mt-0.5 font-medium">
                    {formatSize(item.size)}
                  </p>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
}
