'use client';

import { getSupabaseClient } from '@/lib/supabase/client';

export async function getHeroMessage(): Promise<string> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return '';

  const { data, error } = await supabase
    .from('dashboard_settings')
    .select('hero_message')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.hero_message ?? '';
}

export async function updateHeroMessage(message: string): Promise<void> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase
    .from('dashboard_settings')
    .upsert({ user_id: user.id, hero_message: message, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);
}
