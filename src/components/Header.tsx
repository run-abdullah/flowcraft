export default function Header() {
  return (
    <header class="relative flex items-center justify-between mb-10">
      <div class="flex items-center gap-3.5">
        <div class="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-amber-400 to-rose-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400 via-amber-400 to-rose-500 blur-md opacity-60" />
          <svg viewBox="0 0 100 100" class="relative w-7 h-7">
            <path
              d="M35 20 Q20 20 20 35 L20 80 Q35 80 35 65 L35 45 Q35 30 50 30 L75 30 Q75 20 65 20 Z M35 45 L35 55 L55 55 Q65 55 65 45 Z"
              fill="white"
            />
          </svg>
        </div>
        <div>
          <h1 class="text-[17px] font-bold tracking-tight leading-tight bg-gradient-to-r from-white via-emerald-200 to-amber-200 bg-clip-text text-transparent">
            TimeShift
          </h1>
          <p class="text-[11px] text-emerald-300/60 leading-tight mt-0.5 font-medium tracking-widest">
            PDF TIME MAGICIAN
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
        <span class="relative flex w-2 h-2">
          <span class="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          <span class="relative w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
        </span>
        <span class="text-[11px] text-gray-300 font-medium tracking-wide">Ready</span>
      </div>
    </header>
  );
}
