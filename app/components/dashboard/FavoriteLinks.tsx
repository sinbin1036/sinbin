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
    <div className="mt-9 flex flex-wrap justify-center gap-4">
      {top5.map((link) => {
        const favicon = link.symbol?.startsWith('http') ? link.symbol : toFaviconUrl(link.href);
        return (
          <a
            key={link.id}
            href={link.href}
            onClick={() => handleClick(link)}
            className="silk flex h-[58px] items-center gap-2.5 rounded-full px-6 text-[10px] uppercase tracking-[0.25em] text-[#33291b]"
          >
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/70">
              {favicon ? (
                <img src={favicon} alt="" className="h-3.5 w-3.5" referrerPolicy="no-referrer" />
              ) : (
                link.label[0]
              )}
            </span>
            {link.label}
          </a>
        );
      })}
    </div>
  );
}
