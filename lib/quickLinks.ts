"use client";

import { getSupabaseClient } from '@/lib/supabase/client';

export const QUICK_LINK_CATEGORIES = ['AI', 'Dev', 'Web', '기타'] as const;
export type QuickLinkCategory = (typeof QUICK_LINK_CATEGORIES)[number];

export type QuickLink = {
  id: string;
  label: string;
  href: string;
  description: string;
  symbol: string;
  category: QuickLinkCategory;
};

export type QuickLinkPayload = Omit<QuickLink, "id">;

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function getQuickLinks(): Promise<QuickLink[]> {
  const { data, error } = await getSupabaseClient()
    .from('quick_links')
    .select('id,label,href,description,symbol,category')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  throwIfError(error);
  return (data ?? []) as QuickLink[];
}

export async function createQuickLink(payload: QuickLinkPayload) {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');
  const { error } = await supabase.from('quick_links').insert({ ...payload, user_id: user.id });
  throwIfError(error);
}

export async function updateQuickLink(id: string, payload: QuickLinkPayload) {
  const { error } = await getSupabaseClient().from('quick_links').update(payload).eq('id', id);
  throwIfError(error);
}

export async function deleteQuickLink(id: string) {
  const { error } = await getSupabaseClient().from('quick_links').delete().eq('id', id);
  throwIfError(error);
}
