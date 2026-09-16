import { createSignal } from "solid-js";

interface DropZoneProps {
  onSelectClick: () => void;
}

export default function DropZone(props: DropZoneProps) {
  const [isDragging, setIsDragging] = createSignal(false);

  // WebKit browser default PDF opening block karne ke liye
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      e.currentTarget &&
      !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)
    ) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={props.onSelectClick}
      style={{ "--wails-drop-target": "drop" } as any}
      class={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 select-none ${
        isDragging()
          ? "border-emerald-400 bg-emerald-500/20 scale-[1.02]"
          : "border-slate-700 hover:border-emerald-500 bg-slate-900/50 hover:bg-emerald-500/10"
      }`}
    >
      <div class="flex flex-col items-center justify-center gap-3 pointer-events-none">
        <div class="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-emerald-400 shadow-inner">
          <svg
            class="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <div>
          <p class="text-base font-semibold text-slate-200">
            {isDragging()
              ? "Drop PDF File Now"
              : "Drag & Drop Ticket PDFs Here"}
          </p>
          <p class="text-xs text-slate-400 mt-1">
            Or click anywhere to open file picker
          </p>
        </div>
      </div>
    </div>
  );
}
