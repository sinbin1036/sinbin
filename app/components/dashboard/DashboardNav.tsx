'use client';

import { useEffect, useRef, useState } from 'react';
import LogoutButton from '@/app/components/LogoutButton';

const NAV_LINKS = [
  { id: 'quicklaunch', label: '바로가기' },
  { id: 'github', label: 'GitHub' },
  { id: 'spotify', label: 'Spotify' },
];

export default function DashboardNav() {
  const [activeSection, setActiveSection] = useState(NAV_LINKS[0].id);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const sections = NAV_LINKS.map((link) => document.getElementById(link.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-40% 0px -40% 0px' },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px' },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateHole = () => {
      const activeEl = document.querySelector(`.nav-link[data-id="${activeSection}"]`) as HTMLElement | null;
      if (!navRef.current || !activeEl || !maskRef.current) return;

      const containerRect = navRef.current.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();

      maskRef.current.style.setProperty('-webkit-mask-size', `100% 100%, ${elRect.width}px ${elRect.height}px`);
      maskRef.current.style.setProperty(
        '-webkit-mask-position',
        `0 0, ${elRect.left - containerRect.left}px ${elRect.top - containerRect.top}px`,
      );
      maskRef.current.style.setProperty('mask-size', `100% 100%, ${elRect.width}px ${elRect.height}px`);
      maskRef.current.style.setProperty(
        'mask-position',
        `0 0, ${elRect.left - containerRect.left}px ${elRect.top - containerRect.top}px`,
      );
    };

    updateHole();
    const timeout = setTimeout(updateHole, 150);
    window.addEventListener('resize', updateHole);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateHole);
    };
  }, [activeSection]);

  return (
    <div className="fixed inset-x-0 top-6 z-[70] flex justify-center px-4">
      <nav
        className={`flex items-center gap-6 rounded-full border px-6 py-3 backdrop-blur-2xl transition-colors duration-300 ${
          scrolled
            ? 'border-[rgba(131,108,74,.18)] bg-white/70 text-[#2a241c] shadow-[0_12px_30px_rgba(98,78,45,.12)]'
            : 'border-white/25 bg-white/15 text-white'
        }`}
      >
        <div ref={navRef} className="relative flex items-center gap-1 text-[11px] uppercase tracking-[0.22em]">
          <div
            ref={maskRef}
            className={`nav-mask pointer-events-none absolute inset-0 -z-10 rounded-full transition-colors duration-300 ${
              scrolled ? 'bg-[#2a241c]/[0.06]' : 'bg-white/10'
            }`}
          />
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              data-id={link.id}
              onClick={() => scrollToSection(link.id)}
              className={`nav-link rounded-full border px-3 py-1.5 transition ${
                scrolled
                  ? activeSection === link.id
                    ? 'border-[rgba(131,108,74,.35)] text-[#2a241c]'
                    : 'border-transparent text-[#8a7c69] hover:text-[#2a241c]'
                  : activeSection === link.id
                    ? 'border-white/20 text-white'
                    : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
        <span className={`h-4 w-px transition-colors duration-300 ${scrolled ? 'bg-[rgba(131,108,74,.25)]' : 'bg-white/25'}`} />
        <LogoutButton scrolled={scrolled} />
      </nav>
    </div>
  );
}
