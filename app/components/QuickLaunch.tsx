'use client';

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  createQuickLink,
  deleteQuickLink,
  getQuickLinks,
  QUICK_LINK_CATEGORIES,
  QuickLink,
  QuickLinkCategory,
  QuickLinkPayload,
  recordQuickLinkClick,
  updateQuickLink,
} from '@/lib/quickLinks';

type ActiveTab = QuickLinkCategory;

const EMPTY_FORM: QuickLinkPayload = {
  label: '',
  href: '',
  description: '',
  symbol: '',
  category: 'Dev',
};

function toFaviconUrl(href: string) {
  try {
    const url = new URL(href);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  } catch {
    return '';
  }
}

const CATEGORY_COLORS: Record<QuickLinkCategory, string> = {
  AI: 'bg-[#5678a8]/15 text-[#2f466b]',
  Dev: 'bg-[#d7aa61]/20 text-[#8a5f26]',
  Web: 'bg-emerald-700/10 text-emerald-800',
  기타: 'bg-[#8a7c69]/15 text-[#5e5245]',
};

export default function QuickLaunch() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('AI');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuickLinkPayload>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuickLinks();
      setLinks(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : '바로가기를 불러오지 못했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const derivedSymbol = form.symbol || toFaviconUrl(form.href);
      const payload: QuickLinkPayload = { ...form, symbol: derivedSymbol };

      if (editingId) {
        await updateQuickLink(editingId, payload);
      } else {
        await createQuickLink(payload);
      }
      await load();
      resetForm();
      setFormOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    try {
      await deleteQuickLink(id);
      setLinks((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkClick = (item: QuickLink) => {
    recordQuickLinkClick(item.id, item.click_count + 1).catch(() => {});
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (link: QuickLink) => {
    const computedSymbol = link.symbol?.startsWith('http') ? link.symbol : toFaviconUrl(link.href);
    setEditingId(link.id);
    setForm({
      label: link.label,
      href: link.href,
      description: link.description,
      symbol: computedSymbol,
      category: link.category ?? 'Dev',
    });
    setFormOpen(true);
  };

  const visibleLinks = links.filter((l) => (l.category ?? '기타') === activeTab);

  const tabCounts = (tab: ActiveTab) =>
    links.filter((l) => (l.category ?? '기타') === tab).length;

  const renderGridContent = () => {
    if (loading) {
      return Array.from({ length: 6 }).map((_, idx) => (
        <li key={idx} className="min-h-[128px] animate-pulse rounded-2xl border border-[rgba(131,108,74,.08)] bg-white/40" />
      ));
    }

    if (error) {
      return (
        <li className="col-span-full">
          <div className="flex items-center justify-between rounded-3xl border border-red-200/80 bg-red-50/70 px-4 py-3 text-red-800">
            <div className="flex flex-col">
              <span className="text-sm font-semibold">바로가기를 불러오지 못했습니다.</span>
              <span className="text-xs text-red-700/90">{error}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={load}
                className="rounded-full bg-red-800 px-3 py-1.5 text-xs font-medium text-red-50 transition hover:bg-red-700"
              >
                다시 시도
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="rounded-full border border-red-200/80 px-3 py-1.5 text-xs font-medium text-red-800 transition hover:border-red-300"
              >
                새 링크 추가
              </button>
            </div>
          </div>
        </li>
      );
    }

    if (!visibleLinks.length) {
      return (
        <li className="paper-panel col-span-full rounded-3xl p-6 text-center">
          <p className="text-sm font-medium text-[#2a241c]">{`${activeTab} 카테고리에 링크가 없어요.`}</p>
          <p className="text-xs text-[#8a7c69]">즐겨찾는 도구와 문서를 추가해 빠르게 이동해보세요.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-3 inline-flex items-center justify-center rounded-full bg-[#2a241c] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#3f3628]"
          >
            새 링크 만들기
          </button>
        </li>
      );
    }

    return visibleLinks.map((item) => {
      const favicon = item.symbol?.startsWith('http') ? item.symbol : toFaviconUrl(item.href);
      const fallbackLetter = item.label?.[0] ?? '🔗';
      const category = item.category ?? '기타';

      return (
        <li key={item.id}>
          <div className="paper-panel group flex min-h-[128px] w-full flex-col justify-between gap-2 rounded-2xl p-3 text-center transition hover:-translate-y-1">
            <a
              href={item.href}
              onClick={() => handleLinkClick(item)}
              className="flex flex-1 flex-col items-center justify-center gap-1.5 py-1"
            >
              <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/60 text-lg transition group-hover:scale-105">
                {favicon ? (
                  <img src={favicon} alt={`${item.label} favicon`} className="h-6 w-6" referrerPolicy="no-referrer" />
                ) : (
                  fallbackLetter
                )}
              </span>
              <span className="line-clamp-2 w-full text-xs font-medium text-[#2a241c]">{item.label}</span>
              <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${CATEGORY_COLORS[category]}`}>
                {category}
              </span>
            </a>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8a7c69]">
              <button
                type="button"
                onClick={() => openEdit(item)}
                className="flex-1 rounded-full border border-[rgba(131,108,74,.15)] px-2 py-1 transition hover:border-[rgba(131,108,74,.4)] hover:text-[#2a241c]"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={submitting}
                className="flex-1 rounded-full border border-[rgba(131,108,74,.15)] px-2 py-1 transition hover:border-red-300 hover:text-red-700 disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          </div>
        </li>
      );
    });
  };

  const tabs: ActiveTab[] = [...QUICK_LINK_CATEGORIES];

  return (
    <section aria-labelledby="quick-links-heading" className="w-full">
      <div className="mb-4 flex items-center justify-between px-1">
        <div>
          <h2 id="quick-links-heading" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8a7c69]">
            바로가기
          </h2>
          <p className="text-xs text-[#8a7c69]">자주 방문하는 링크를 추가하고 바로 이동하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(131,108,74,.2)] px-3 py-1.5 text-xs font-medium text-[#5e5245] transition hover:border-[rgba(131,108,74,.4)] hover:text-[#2a241c]"
          >
            새로고침
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-[#2a241c] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#3f3628]"
          >
            새 링크
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1.5 px-1" role="tablist" aria-label="카테고리 필터">
        {tabs.map((tab) => {
          const count = tabCounts(tab);
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                isActive
                  ? 'bg-[#2a241c] text-white'
                  : 'border border-[rgba(131,108,74,.15)] text-[#5e5245] hover:border-[rgba(131,108,74,.4)] hover:text-[#2a241c]'
              }`}
            >
              {tab}
              {count > 0 && (
                <span
                  className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] leading-none ${
                    isActive ? 'bg-white/25 text-white' : 'bg-[rgba(131,108,74,.12)] text-[#5e5245]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">{renderGridContent()}</ul>

      {formOpen && mounted
        ? createPortal(
            <div aria-modal="true" role="dialog" className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
              <div className="paper-panel w-full max-w-lg rounded-3xl p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-[#2a241c]">{editingId ? '바로가기 수정' : '새 바로가기'}</h3>
                    <p className="text-xs text-[#8a7c69]">라벨, URL, 카테고리를 입력하세요. URL로 파비콘을 자동 가져옵니다.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setFormOpen(false);
                    }}
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
                  <div className="flex items-center justify-between text-xs text-[#8a7c69]">
                    <span>{editingId ? '수정 후 저장을 눌러주세요.' : '추가하면 바로 목록에 반영됩니다.'}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setFormOpen(false);
                        }}
                        className="inline-flex items-center justify-center rounded-xl border border-[rgba(131,108,74,.2)] px-4 py-2 font-medium text-[#5e5245] transition hover:border-[#bc8750] hover:text-[#2a241c]"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-xl bg-[#2a241c] px-4 py-2 font-medium text-white transition hover:bg-[#3f3628] disabled:opacity-60"
                      >
                        {submitting ? '저장 중...' : editingId ? '수정하기' : '추가하기'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
