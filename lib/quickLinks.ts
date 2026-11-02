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
  // 순서를 바꾼 뒤에도 새 링크가 맨 뒤에 붙도록 지금 가장 큰 position 다음 값을 준다.
  const { data: last } = await supabase
    .from('quick_links')
    .select('position')
    .order('position', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;
  const { error } = await supabase.from('quick_links').insert({ ...payload, user_id: user.id, position });
  throwIfError(error);
  notifyQuickLinksChanged();
}

export async function updateQuickLink(id: string, payload: QuickLinkPayload) {
  const { error } = await getSupabaseClient().from('quick_links').update(payload).eq('id', id);
  throwIfError(error);
  notifyQuickLinksChanged();
}

/** ids 순서대로 position을 0, 1, 2…로 다시 매긴다. 한 카테고리 안의 순서를 바꿀 때 쓴다. */
export async function updateQuickLinkOrder(ids: string[]) {
  const supabase = getSupabaseClient();
  const results = await Promise.all(
    ids.map((id, position) => supabase.from('quick_links').update({ position }).eq('id', id)),
  );
  results.forEach(({ error }) => throwIfError(error));
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
