interface DropZoneProps {
  onSelectClick: () => void;
}

export default function DropZone(props: DropZoneProps) {
  return (
    <div
      onClick={props.onSelectClick}
      style={{ "--wails-drop-target": "drop" } as any}
      class="group relative border-2 border-dashed border-card-border hover:border-accent-primary rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 select-none bg-card-bg hover:bg-accent-subtle/40 backdrop-blur-md shadow-lg hover:shadow-accent-primary/10 hover:scale-[1.01]"
    >
      {/* Ambient Inner Glow on Hover */}
      <div class="absolute inset-0 rounded-3xl bg-accent-subtle/0 group-hover:bg-accent-subtle/10 transition-colors duration-300 pointer-events-none"></div>

      <div class="relative z-10 flex flex-col items-center justify-center gap-3 pointer-events-none">
        {/* Animated Icon Box */}
        <div class="w-14 h-14 rounded-2xl bg-app-bg/80 border border-card-border group-hover:border-accent-border flex items-center justify-center text-accent-primary shadow-inner transition-all duration-300 group-hover:scale-110">
          <svg
            class="w-7 h-7 transform group-hover:-translate-y-1 transition-transform duration-300"
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
          <p class="text-sm font-bold text-text-main group-hover:text-accent-primary transition-colors duration-200">
            Drag & Drop Ticket PDFs Here
          </p>
          <p class="text-[11px] text-text-muted mt-1 font-medium">
            Or click anywhere to browse files
          </p>
        </div>
      </div>
    </div>
  );
}
