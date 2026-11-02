'use client';

import { useCallback, useEffect, useState } from 'react';
import QuickLinkFormModal from '@/app/components/QuickLinkFormModal';
import {
  deleteQuickLink,
  getQuickLinks,
  onQuickLinksChanged,
  QUICK_LINK_CATEGORIES,
  QuickLink,
  QuickLinkCategory,
  recordQuickLinkClick,
  toFaviconUrl,
} from '@/lib/quickLinks';

type ActiveTab = QuickLinkCategory;

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
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => onQuickLinksChanged(load), [load]);

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    try {
      await deleteQuickLink(id);
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
    setEditingLink(null);
    setFormOpen(true);
  };

  const openEdit = (link: QuickLink) => {
    setEditingLink(link);
    setFormOpen(true);
  };

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingLink(null);
  }, []);

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

      <QuickLinkFormModal open={formOpen} link={editingLink} defaultCategory={activeTab} onClose={closeForm} />
    </section>
  );
}
