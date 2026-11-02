'use client';

import { getSupabaseClient } from '@/lib/supabase/client';

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
};

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function getTodos(): Promise<Todo[]> {
  const { data, error } = await getSupabaseClient()
    .from('todos')
    .select('id,text,done,created_at')
    .order('created_at', { ascending: true });
  throwIfError(error);
  return (data ?? []) as Todo[];
}

export async function createTodo(text: string): Promise<Todo> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('todos')
    .insert({ text, user_id: user.id })
    .select('id,text,done,created_at')
    .single();
  throwIfError(error);
  return data as Todo;
}

export async function updateTodoDone(id: string, done: boolean) {
  const { error } = await getSupabaseClient().from('todos').update({ done }).eq('id', id);
  throwIfError(error);
}

export async function deleteTodo(id: string) {
  const { error } = await getSupabaseClient().from('todos').delete().eq('id', id);
  throwIfError(error);
}

export async function deleteTodos(ids: string[]) {
  if (!ids.length) return;
  const { error } = await getSupabaseClient().from('todos').delete().in('id', ids);
  throwIfError(error);
}
