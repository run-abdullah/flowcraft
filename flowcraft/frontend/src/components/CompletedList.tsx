import { For, Show, createSignal } from "solid-js";
import type { PDFItem } from "../types/pdf";
import { CopyAllPDFsToClipboard } from "../../wailsjs/go/main/App";

interface CompletedListProps {
  items: PDFItem[];
  onDownload: (item: PDFItem) => void;
  onCopy: (item: PDFItem) => void;
  onClear: () => void;
}

export default function CompletedList(props: CompletedListProps) {
  const [copiedId, setCopiedId] = createSignal<string | null>(null);
  const [copiedAll, setCopiedAll] = createSignal(false);

  // Filter only successfully processed items
  const successItems = () => props.items.filter((item) => item.status === "done");

  const handleCopy = (item: PDFItem) => {
    props.onCopy(item);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Bulk Action: Copy All
  const handleCopyAll = async () => {
    const items = successItems();
    const batchList = items.map((i) => ({ id: i.id, fileName: i.name }));

    try {
      const ok = await CopyAllPDFsToClipboard(batchList);
      if (ok) {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
      }
    } catch (err) {
      console.error("Bulk copy error:", err);
    }
  };

  // Bulk Action: Save All
  const handleDownloadAll = async () => {
    const items = successItems();
    for (const item of items) {
      await props.onDownload(item);
    }
  };

  return (
    <div class="flex flex-col h-full rounded-3xl bg-card-bg border border-card-border p-6 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Header Bar */}
      <div class="flex items-center justify-between pb-4 border-b border-card-border/60 mb-4 gap-2 flex-wrap shrink-0">
        <div class="flex items-center gap-2.5">
          <h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
            Processed Tickets
          </h2>
          <span class="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-accent-subtle border border-accent-border text-accent-primary">
            {props.items.length}
          </span>
        </div>

        {/* Bulk Action Buttons */}
        <Show when={successItems().length > 0}>
          <div class="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              class="px-3 py-1.5 rounded-xl bg-app-bg hover:bg-card-border/50 text-text-main text-xs font-semibold border border-card-border transition-all active:scale-95 shadow-sm"
            >
              {copiedAll() ? "✓ All Copied" : "📋 Copy All"}
            </button>
            <button
              onClick={handleDownloadAll}
              class="px-3 py-1.5 rounded-xl bg-accent-subtle hover:bg-accent-border/40 text-accent-primary text-xs font-semibold border border-accent-border transition-all active:scale-95 shadow-sm"
            >
              💾 Save All
            </button>
            <button
              onClick={props.onClear}
              class="text-xs font-semibold text-text-subtle hover:text-danger-text transition-colors ml-1"
            >
              Clear
            </button>
          </div>
        </Show>
      </div>

      {/* Item List Container - Scrolls Independently */}
      <div class="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
        <Show
          when={props.items.length > 0}
          fallback={
            <div class="h-full min-h-45 flex flex-col items-center justify-center text-text-subtle text-xs border-2 border-dashed border-card-border/50 rounded-2xl p-6 text-center">
              No tickets processed yet
            </div>
          }
        >
          <For each={props.items}>
            {(item) => (
              <div class="flex items-center justify-between p-3.5 rounded-2xl bg-app-bg/60 border border-card-border/80 hover:border-card-border transition-all">
                <div class="flex items-center gap-3 overflow-hidden">
                  <Show
                    when={item.status === "done"}
                    fallback={
                      <div class="w-8 h-8 rounded-xl bg-danger-bg text-danger-text flex items-center justify-center text-xs shrink-0">
                        ⚠️
                      </div>
                    }
                  >
                    <div class="w-8 h-8 rounded-xl bg-accent-subtle border border-accent-border text-accent-primary flex items-center justify-center text-xs shrink-0">
                      ✓
                    </div>
                  </Show>
                  <div class="truncate">
                    <p class="text-xs font-semibold text-text-main truncate">
                      {item.name}
                    </p>
                    <p class="text-[10px] text-text-subtle mt-0.5">
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
                      class="px-2.5 py-1.5 rounded-xl bg-card-border/40 hover:bg-card-border text-text-main text-xs font-medium transition-all active:scale-95"
                    >
                      {copiedId() === item.id ? "✓ Copied" : "📋 Copy"}
                    </button>
                    <button
                      onClick={() => props.onDownload(item)}
                      class="px-3 py-1.5 rounded-xl bg-accent-subtle hover:bg-accent-border/40 text-accent-primary text-xs font-medium border border-accent-border transition-all active:scale-95"
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
