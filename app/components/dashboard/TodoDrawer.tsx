'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createTodo, deleteTodo, deleteTodos, getTodos, Todo, updateTodoDone } from '@/lib/todos';

type Status = 'loading' | 'ready' | 'error';

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export default function TodoDrawer({ scrolled = false }: { scrolled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const panelRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(() => {
    setStatus('loading');
    getTodos()
      .then((rows) => {
        setTodos(rows);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(load, [load]);
  useEffect(() => setMounted(true), []);

  // 바깥 클릭, Esc, T 단축키
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (open && !panelRef.current?.contains(target) && !toggleRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === 't' || e.key === 'T' || e.key === 'ㅅ') setOpen((prev) => !prev);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // 낙관적 업데이트 후 실패하면 이전 목록으로 되돌린다.
  const mutate = async (next: Todo[], request: () => Promise<unknown>, message: string) => {
    const prev = todos;
    setTodos(next);
    setError(null);
    try {
      await request();
    } catch {
      setTodos(prev);
      setError(message);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    setError(null);
    try {
      const created = await createTodo(text);
      setTodos((prev) => [...prev, created]);
    } catch {
      setDraft(text);
      setError('할 일을 추가하지 못했습니다. 다시 시도해 주세요.');
    }
  };

  const toggleDone = (todo: Todo) =>
    mutate(
      todos.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)),
      () => updateTodoDone(todo.id, !todo.done),
      '완료 상태를 저장하지 못했습니다.',
    );

  const remove = (todo: Todo) =>
    mutate(
      todos.filter((t) => t.id !== todo.id),
      () => deleteTodo(todo.id),
      '삭제하지 못했습니다.',
    );

  const clearDone = () => {
    const doneIds = todos.filter((t) => t.done).map((t) => t.id);
    return mutate(
      todos.filter((t) => !t.done),
      () => deleteTodos(doneIds),
      '완료 항목을 지우지 못했습니다.',
    );
  };

  const remaining = todos.filter((t) => !t.done).length;
  const doneCount = todos.length - remaining;

  // 네비의 backdrop-filter가 fixed 기준을 바꾸므로 패널은 body로 포털한다.
  const panel = (
    <aside
      ref={panelRef}
      id="todo-drawer"
      aria-label="오늘 할 일"
      aria-hidden={!open}
      inert={!open}
      className={`fixed bottom-6 right-6 top-24 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col rounded-[22px] border border-white/20 bg-[rgba(34,28,21,.5)] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_24px_60px_rgba(0,0,0,.28)] backdrop-blur-[28px] backdrop-saturate-[1.15] transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
        open ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-6 opacity-0'
      }`}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="serif text-2xl font-semibold">오늘 할 일</h2>
        <span className="text-[10px] uppercase tracking-[0.22em] text-white/60">{remaining}개 남음</span>
      </div>

      <form onSubmit={handleAdd} className="mb-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          autoComplete="off"
          placeholder="할 일 추가 후 Enter"
          aria-label="할 일 추가"
          className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#f3d9a8]/70"
        />
      </form>

      {error && <p className="mb-2 text-xs text-[#f3d9a8]">{error}</p>}

      <div className="scrollbar-hide -mx-1 flex-1 overflow-y-auto">
        {status === 'loading' && (
          <ul className="space-y-2 px-1 py-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-8 animate-pulse rounded-lg bg-white/10" />
            ))}
          </ul>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-start gap-2 px-1 py-3 text-xs text-white/70">
            <p>할 일 목록을 불러오지 못했습니다.</p>
            <button
              type="button"
              onClick={load}
              className="rounded-full border border-white/30 px-3 py-1 text-white transition hover:bg-white/15"
            >
              다시 불러오기
            </button>
          </div>
        )}

        {status === 'ready' && !todos.length && (
          <p className="px-1 py-3 text-xs text-white/60">할 일이 없습니다. 위 칸에 적고 Enter를 누르세요.</p>
        )}

        {status === 'ready' && todos.length > 0 && (
          <ul className="flex flex-col gap-0.5">
            {todos.map((todo) => (
              <li key={todo.id} className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm hover:bg-white/[0.07]">
                <button
                  type="button"
                  onClick={() => toggleDone(todo)}
                  aria-label={`${todo.done ? '완료 취소' : '완료'}: ${todo.text}`}
                  aria-pressed={todo.done}
                  className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-[1.5px] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f3d9a8] ${
                    todo.done ? 'border-[#d7aa61] bg-[#d7aa61]' : 'border-white/60'
                  }`}
                >
                  {todo.done && (
                    <span className="h-1 w-2 -translate-y-px -rotate-45 border-b-2 border-l-2 border-[#2a241c]" />
                  )}
                </button>
                <span className={`min-w-0 flex-1 break-words ${todo.done ? 'text-white/45 line-through' : ''}`}>
                  {todo.text}
                </span>
                <button
                  type="button"
                  onClick={() => remove(todo)}
                  aria-label={`삭제: ${todo.text}`}
                  className="px-1 text-base text-white/50 opacity-0 transition hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-2 flex justify-between border-t border-white/10 pt-3 text-[11px] text-white/60">
        <span>
          {doneCount}/{todos.length} 완료
        </span>
        <button type="button" onClick={clearDone} disabled={!doneCount} className="transition hover:text-white disabled:opacity-40">
          완료 항목 지우기
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="todo-drawer"
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] transition ${
          open
            ? scrolled
              ? 'border-[#2a241c] bg-[#2a241c] text-white'
              : 'border-white bg-white text-[#2a241c]'
            : scrolled
              ? 'border-[rgba(131,108,74,.25)] bg-white/50 text-[#2a241c] hover:bg-white/80'
              : 'border-white/25 bg-white/10 text-white hover:bg-white/25'
        }`}
      >
        할 일
        {remaining > 0 && (
          <span
            className={`inline-grid h-[17px] min-w-[17px] place-items-center rounded-full px-1.5 text-[10px] font-semibold tracking-normal tabular-nums ${
              open
                ? scrolled
                  ? 'bg-white text-[#2a241c]'
                  : 'bg-[#2a241c] text-white'
                : 'bg-[#d7aa61] text-[#2a241c]'
            }`}
          >
            {remaining}
          </span>
        )}
      </button>
      {mounted && createPortal(panel, document.body)}
    </>
  );
}
