'use client';

import { getSupabaseClient } from '@/lib/supabase/client';

export type QuickLink = {
  id: string;
  label: string;
  href: string;
  description: string;
  symbol: string;
};

export type QuickLinkPayload = Omit<QuickLink, 'id'>;

export async function getQuickLinks(): Promise<QuickLink[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('quick_links')
    .select('id, label, href, description, symbol')
    .order('label', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createQuickLink(payload: QuickLinkPayload) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('quick_links').insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function updateQuickLink(id: string, payload: QuickLinkPayload) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('quick_links').update(payload).eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteQuickLink(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('quick_links').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}
