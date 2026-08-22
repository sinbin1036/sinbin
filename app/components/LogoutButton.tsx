'use client';

import { getSupabaseClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const handleLogout = async () => {
    await getSupabaseClient().auth.signOut();
    window.location.assign('/');
  };

  return (
    <button type="button" onClick={handleLogout} className="transition hover:text-stone-700 dark:hover:text-stone-200">
      로그아웃
    </button>
  );
}
