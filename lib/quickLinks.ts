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
  click_count: number;
};

export type QuickLinkPayload = Omit<QuickLink, "id" | "click_count">;

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function toFaviconUrl(href: string) {
  try {
    const url = new URL(href);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  } catch {
    return '';
  }
}

// 섹션, 히어로 즐겨찾기, 부채 다이얼이 같은 데이터를 쓰므로 변경 후 서로 다시 불러오게 알린다.
const QUICK_LINKS_CHANGED = 'quicklinks:changed';

function notifyQuickLinksChanged() {
  window.dispatchEvent(new Event(QUICK_LINKS_CHANGED));
}

export function onQuickLinksChanged(listener: () => void) {
  window.addEventListener(QUICK_LINKS_CHANGED, listener);
  return () => window.removeEventListener(QUICK_LINKS_CHANGED, listener);
}

export async function getQuickLinks(): Promise<QuickLink[]> {
  const { data, error } = await getSupabaseClient()
    .from('quick_links')
    .select('id,label,href,description,symbol,category,click_count')
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
  notifyQuickLinksChanged();
}

export async function updateQuickLink(id: string, payload: QuickLinkPayload) {
  const { error } = await getSupabaseClient().from('quick_links').update(payload).eq('id', id);
  throwIfError(error);
  notifyQuickLinksChanged();
}

export async function deleteQuickLink(id: string) {
  const { error } = await getSupabaseClient().from('quick_links').delete().eq('id', id);
  throwIfError(error);
  notifyQuickLinksChanged();
}

export async function recordQuickLinkClick(id: string, nextCount: number) {
  const { error } = await getSupabaseClient()
    .from('quick_links')
    .update({ click_count: nextCount })
    .eq('id', id);
  throwIfError(error);
}
