'use client';

import { useEffect, useRef, useState } from 'react';
import { getHeroMessage, updateHeroMessage } from '@/lib/dashboardSettings';

const PLACEHOLDER = '클릭해서 이 자리에 원하는 문구를 남겨보세요.';

export default function HeroMessage() {
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getHeroMessage()
      .then(setMessage)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = () => {
    setDraft(message);
    setEditing(true);
  };

  const save = async () => {
    const next = draft.trim();
    setEditing(false);
    if (next === message) return;
    setMessage(next);
    setSaving(true);
    try {
      await updateHeroMessage(next);
    } catch {
      // 저장 실패 시 다음 방문에서 이전 값으로 되돌아간다.
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <textarea
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            save();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            setEditing(false);
          }
        }}
        rows={2}
        placeholder={PLACEHOLDER}
        className="mx-auto mt-7 block w-full max-w-[760px] resize-none bg-transparent px-6 py-2 text-center text-[18px] leading-[1.95] text-white/90 outline-none placeholder:text-white/50"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="mx-auto mt-7 block max-w-[760px] px-6 py-2 text-center text-[18px] leading-[1.95] text-white/90 transition hover:text-white"
    >
      {message || PLACEHOLDER}
      {saving && <span className="ml-2 text-xs text-white/60">저장 중…</span>}
    </button>
  );
}
