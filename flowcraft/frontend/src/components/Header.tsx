export default function Header() {
  return (
    <header class="mb-8 text-center select-none">
      <div class="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        Automated Ticket Processing
      </div>
      <h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Flight PDF Time Converter
      </h1>
      <p class="mt-2 text-sm text-slate-400 max-w-md mx-auto">
        Standardize flight ticket departure & arrival times from 12-hour format
        into 24-hour presentation.
      </p>
    </header>
  );
}
