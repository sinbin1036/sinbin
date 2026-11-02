'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  createQuickLink,
  QUICK_LINK_CATEGORIES,
  QuickLink,
  QuickLinkCategory,
  QuickLinkPayload,
  toFaviconUrl,
  updateQuickLink,
} from '@/lib/quickLinks';

type Props = {
  open: boolean;
  /** 수정할 링크. null이면 새 링크를 만든다. */
  link: QuickLink | null;
  defaultCategory?: QuickLinkCategory;
  onClose: () => void;
};

function toForm(link: QuickLink | null, defaultCategory: QuickLinkCategory): QuickLinkPayload {
  if (!link) return { label: '', href: '', description: '', symbol: '', category: defaultCategory };
  return {
    label: link.label,
    href: link.href,
    description: link.description,
    symbol: link.symbol?.startsWith('http') ? link.symbol : toFaviconUrl(link.href),
    category: link.category ?? 'Dev',
  };
}

export default function QuickLinkFormModal({ open, link, defaultCategory = 'Dev', onClose }: Props) {
  const [form, setForm] = useState<QuickLinkPayload>(() => toForm(link, defaultCategory));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setForm(toForm(link, defaultCategory));
    setError(null);
  }, [open, link, defaultCategory]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: QuickLinkPayload = { ...form, symbol: form.symbol || toFaviconUrl(form.href) };
      if (link) {
        await updateQuickLink(link.id, payload);
      } else {
        await createQuickLink(payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="quick-link-form-title"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
    >
      <div className="paper-panel w-full max-w-lg rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 id="quick-link-form-title" className="text-base font-semibold text-[#2a241c]">
              {link ? '바로가기 수정' : '새 바로가기'}
            </h3>
            <p className="text-xs text-[#8a7c69]">라벨, URL, 카테고리를 입력하세요. URL로 파비콘을 자동 가져옵니다.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[rgba(131,108,74,.2)] px-3 py-1 text-xs font-medium text-[#5e5245] transition hover:border-[rgba(131,108,74,.4)] hover:text-[#2a241c]"
          >
            닫기
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3">
            <label className="flex flex-col gap-2 text-sm text-[#3f3628]">
              라벨
              <input
                required
                autoFocus
                type="text"
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                className="w-full rounded-xl border border-[rgba(131,108,74,.2)] bg-white/70 px-3 py-2 text-sm text-[#2a241c] outline-none transition focus:border-[#bc8750] focus:ring-2 focus:ring-[#d7aa61]/30"
                placeholder="예: 실시간 인시던트"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-[#3f3628]">
            URL
            <input
              required
              type="url"
              value={form.href}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  href: e.target.value,
                  symbol: toFaviconUrl(e.target.value),
                }))
              }
              className="w-full rounded-xl border border-[rgba(131,108,74,.2)] bg-white/70 px-3 py-2 text-sm text-[#2a241c] outline-none transition focus:border-[#bc8750] focus:ring-2 focus:ring-[#d7aa61]/30"
              placeholder="https://"
            />
          </label>

          <div className="flex flex-col gap-2 text-sm text-[#3f3628]">
            카테고리
            <div className="flex gap-2" role="group" aria-label="카테고리 선택">
              {QUICK_LINK_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={form.category === cat}
                  onClick={() => setForm((prev) => ({ ...prev, category: cat }))}
                  className={`flex-1 rounded-xl border py-2 text-xs font-medium transition ${
                    form.category === cat
                      ? 'border-[#2a241c] bg-[#2a241c] text-white'
                      : 'border-[rgba(131,108,74,.2)] bg-white/70 text-[#5e5245] hover:border-[#bc8750]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-2 text-sm text-[#3f3628]">
            설명
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-xl border border-[rgba(131,108,74,.2)] bg-white/70 px-3 py-2 text-sm text-[#2a241c] outline-none transition focus:border-[#bc8750] focus:ring-2 focus:ring-[#d7aa61]/30"
              placeholder="이 링크의 목적을 적어주세요."
            />
          </label>
          <div className="flex items-center justify-between rounded-xl border border-dashed border-[rgba(131,108,74,.25)] px-3 py-2 text-xs text-[#8a7c69]">
            <span>파비콘 미리보기</span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/60">
              {form.symbol ? (
                <img src={form.symbol} alt="favicon preview" className="h-6 w-6" referrerPolicy="no-referrer" />
              ) : (
                '✨'
              )}
            </span>
          </div>
          {error && <p className="text-xs text-red-700">{error}</p>}
          <div className="flex items-center justify-between text-xs text-[#8a7c69]">
            <span>{link ? '수정 후 저장을 눌러주세요.' : '추가하면 바로 목록에 반영됩니다.'}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-[rgba(131,108,74,.2)] px-4 py-2 font-medium text-[#5e5245] transition hover:border-[#bc8750] hover:text-[#2a241c]"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-xl bg-[#2a241c] px-4 py-2 font-medium text-white transition hover:bg-[#3f3628] disabled:opacity-60"
              >
                {submitting ? '저장 중...' : link ? '수정하기' : '추가하기'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
