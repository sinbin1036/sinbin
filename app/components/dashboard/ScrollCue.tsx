'use client';

export default function ScrollCue({ target }: { target: string }) {
  return (
    <button
      type="button"
      onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white/80 backdrop-blur-xl transition hover:bg-white/20"
    >
      Scroll ↓
    </button>
  );
}
