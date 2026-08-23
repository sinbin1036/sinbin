'use client';

import { useEffect, useState } from 'react';
import { getQuickLinks, recordQuickLinkClick, QuickLink } from '@/lib/quickLinks';

function toFaviconUrl(href: string) {
  try {
    const url = new URL(href);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  } catch {
    return '';
  }
}

export default function FavoriteLinks() {
  const [links, setLinks] = useState<QuickLink[]>([]);

  useEffect(() => {
    getQuickLinks()
      .then(setLinks)
      .catch(() => {});
  }, []);

  const top5 = [...links].sort((a, b) => b.click_count - a.click_count).slice(0, 5);

  const handleClick = (link: QuickLink) => {
    recordQuickLinkClick(link.id, link.click_count + 1).catch(() => {});
  };

  if (!top5.length) return null;

  return (
    <div className="mt-9 flex flex-wrap justify-center gap-7">
      {top5.map((link) => {
        const favicon = link.symbol?.startsWith('http') ? link.symbol : toFaviconUrl(link.href);
        return (
          <a
            key={link.id}
            href={link.href}
            onClick={() => handleClick(link)}
            className="flex w-16 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/80 transition hover:text-white"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden drop-shadow-[0_4px_10px_rgba(0,0,0,.35)]">
              {favicon ? (
                <img src={favicon} alt="" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <span className="flex h-full w-full items-center justify-center rounded-full bg-white/20">{link.label[0]}</span>
              )}
            </span>
            <span className="line-clamp-1 text-center normal-case tracking-normal">{link.label}</span>
          </a>
        );
      })}
    </div>
  );
}
