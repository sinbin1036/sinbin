'use client';

import { getSupabaseClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const handleLogout = async () => {
    await getSupabaseClient().auth.signOut();
    window.location.assign('/');
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white transition hover:bg-white/25"
    >
      로그아웃
    </button>
  );
}
