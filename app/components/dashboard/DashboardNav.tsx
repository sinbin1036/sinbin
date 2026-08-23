'use client';

import LogoutButton from '@/app/components/LogoutButton';

const NAV_LINKS = [
  { id: 'quicklaunch', label: '바로가기' },
  { id: 'workspace', label: '워크스페이스' },
];

export default function DashboardNav() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="fixed inset-x-0 top-6 z-[70] flex justify-center px-4">
      <nav className="flex items-center gap-6 rounded-full border border-white/25 bg-white/15 px-6 py-3 text-white backdrop-blur-2xl">
        <div className="flex items-center gap-6 text-[11px] uppercase tracking-[0.22em]">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => scrollToSection(link.id)}
              className="transition hover:text-[#f3d9a4]"
            >
              {link.label}
            </button>
          ))}
        </div>
        <span className="h-4 w-px bg-white/25" />
        <LogoutButton />
      </nav>
    </div>
  );
}
