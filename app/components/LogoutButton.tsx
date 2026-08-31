'use client';

import { getSupabaseClient } from '@/lib/supabase/client';

export default function LogoutButton({ scrolled = false }: { scrolled?: boolean }) {
  const handleLogout = async () => {
    await getSupabaseClient().auth.signOut();
    window.location.assign('/');
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] transition ${
        scrolled
          ? 'border-[rgba(131,108,74,.25)] bg-white/50 text-[#2a241c] hover:bg-white/80'
          : 'border-white/25 bg-white/10 text-white hover:bg-white/25'
      }`}
    >
      로그아웃
    </button>
  );
}
