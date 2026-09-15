import { createSignal } from "solid-js";

interface Props {
  onFiles: (files: FileList | null) => void;
}

export default function DropZone(props: Props) {
  const [dragging, setDragging] = createSignal(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (e.dataTransfer && e.dataTransfer.files) {
      props.onFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById("fileInput")?.click()}
      class={`group relative rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all duration-500 cursor-pointer min-h-[360px] overflow-hidden backdrop-blur-xl ${
        dragging()
          ? "bg-emerald-500/[0.08] scale-[1.015]"
          : "bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
      style={{
        "box-shadow": dragging()
          ? "0 0 0 1px rgba(16,185,129,0.5), 0 20px 60px -20px rgba(16,185,129,0.4), inset 0 0 40px rgba(16,185,129,0.08)"
          : "0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Animated gradient border */}
      <div
        class="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          padding: "1px",
          background:
            "linear-gradient(135deg, #10b981, #f59e0b, #f43f5e, #10b981)",
          "background-size": "300% 300%",
          animation: "gradient-shift 4s ease infinite",
          "-webkit-mask":
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          "-webkit-mask-composite": "xor",
          "mask-composite": "exclude",
        }}
      />

      {/* Rotating conic glow */}
      <div
        class="absolute -inset-40 opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"
        style={{
          background:
            "conic-gradient(from 0deg, transparent, rgba(16,185,129,0.4), transparent 30%, rgba(245,158,11,0.4), transparent 60%, rgba(244,63,94,0.4), transparent)",
          animation: "spin 8s linear infinite",
        }}
      />

      <input
        id="fileInput"
        type="file"
        accept="application/pdf"
        multiple
        class="hidden"
        onChange={(e) => props.onFiles(e.currentTarget.files)}
      />

      <div class="relative z-10 flex flex-col items-center">
        <div
          class={`relative w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
            dragging()
              ? "bg-gradient-to-br from-emerald-400 to-amber-400 text-white scale-110 shadow-[0_0_40px_rgba(16,185,129,0.7)]"
              : "bg-gradient-to-br from-emerald-500/20 to-amber-500/20 text-emerald-300 group-hover:text-white group-hover:scale-105 border border-white/10"
          }`}
        >
          <svg
            class="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="1.8"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            />
          </svg>
        </div>

        <h3 class="text-[17px] font-bold mb-2 tracking-tight bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
          {dragging() ? "Drop it right here ✨" : "Drop your PDF files"}
        </h3>
        <p class="text-[12px] text-emerald-200/50 mb-6 font-medium">
          or click to browse from your device
        </p>

        <div class="flex items-center gap-2 text-[11px]">
          <span class="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-400/20 text-emerald-200 font-medium">
            .pdf
          </span>
          <span class="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-400/20 text-amber-200 font-medium">
            multiple
          </span>
          <span class="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-400/20 text-rose-200 font-medium">
            bulk
          </span>
        </div>
      </div>
    </div>
  );
}
