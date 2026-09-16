import { For, Show, createSignal } from "solid-js";
import type { PDFItem } from "../types/pdf";

interface CompletedListProps {
  items: PDFItem[];
  onDownload: (item: PDFItem) => void;
  onCopy: (item: PDFItem) => void;
  onClear: () => void;
}

export default function CompletedList(props: CompletedListProps) {
  const [copiedId, setCopiedId] = createSignal<string | null>(null);

  const handleCopy = (item: PDFItem) => {
    props.onCopy(item);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div class="flex flex-col h-full rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5">
      <div class="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-semibold text-slate-200">
            Processed Tickets
          </h2>
          <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-800 text-slate-300">
            {props.items.length}
          </span>
        </div>
        <Show when={props.items.length > 0}>
          <button
            onClick={props.onClear}
            class="text-xs font-medium text-slate-400 hover:text-red-400 transition-colors"
          >
            Clear List
          </button>
        </Show>
      </div>

      <div class="flex-1 overflow-y-auto space-y-3 max-h-[450px] pr-1">
        <Show
          when={props.items.length > 0}
          fallback={
            <div class="h-48 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
              No tickets processed yet
            </div>
          }
        >
          <For each={props.items}>
            {(item) => (
              <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
                <div class="flex items-center gap-3 overflow-hidden">
                  <Show
                    when={item.status === "done"}
                    fallback={
                      <div class="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center text-xs">
                        ⚠️
                      </div>
                    }
                  >
                    <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs">
                      ✓
                    </div>
                  </Show>
                  <div class="truncate">
                    <p class="text-xs font-medium text-slate-200 truncate">
                      {item.name}
                    </p>
                    <p class="text-[10px] text-slate-400">
                      {item.status === "done"
                        ? "Conversion Successful"
                        : "Failed to convert"}
                    </p>
                  </div>
                </div>

                <Show when={item.status === "done"}>
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopy(item)}
                      class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all active:scale-95"
                    >
                      {copiedId() === item.id ? "✓ Copied" : "📋 Copy"}
                    </button>
                    <button
                      onClick={() => props.onDownload(item)}
                      class="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/20 transition-all active:scale-95"
                    >
                      Save
                    </button>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
}
