import DashboardNav from "@/app/components/dashboard/DashboardNav";
import HeroVideo from "@/app/components/dashboard/HeroVideo";
import LiveClock from "@/app/components/dashboard/LiveClock";
import HeroMessage from "@/app/components/dashboard/HeroMessage";
import FavoriteLinks from "@/app/components/dashboard/FavoriteLinks";
import Reveal from "@/app/components/dashboard/Reveal";
import ScrollCue from "@/app/components/dashboard/ScrollCue";
import QuickLaunch from "@/app/components/QuickLaunch";
import GithubSection from "@/app/components/dashboard/GithubSection";
import SpotifySection from "@/app/components/dashboard/SpotifySection";

const dateBadge = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "long",
}).format(new Date());

export default function DashboardScreen() {
  return (
    <div className="relative min-h-screen">
      <DashboardNav />

      <section className="relative min-h-screen overflow-hidden">
        <HeroVideo />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_12%,rgba(0,0,0,.18)_72%,rgba(0,0,0,.3)_100%),linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.28))]" />

        <div className="relative z-[3] flex min-h-screen flex-col items-center justify-center px-6 pb-24 pt-24 text-center">
          <span className="rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-white backdrop-blur-xl">
            {dateBadge}
          </span>

          <LiveClock />

          <HeroMessage />

          <FavoriteLinks />

          <ScrollCue target="quicklaunch" />
        </div>
      </section>

      <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 pb-16 pt-20 sm:px-10">
        <section id="quicklaunch" className="scroll-mt-28">
          <Reveal>
            <QuickLaunch />
          </Reveal>
        </section>

        <section id="github" className="scroll-mt-28">
          <Reveal>
            <GithubSection />
          </Reveal>
        </section>

        <section id="spotify" className="scroll-mt-28">
          <Reveal>
            <SpotifySection />
          </Reveal>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(131,108,74,.15)] pt-6 text-xs text-[#8a7c69]">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#2a241c] text-sm font-semibold text-white">
              SB
            </span>
            <div className="flex flex-col">
              <span className="font-medium text-[#5e5245]">Sinbin 워크스페이스</span>
              <span>상태: 모든 시스템 정상 · 2분 전 업데이트</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="transition hover:text-[#2a241c]">
              개인정보 처리방침
            </a>
            <a href="#" className="transition hover:text-[#2a241c]">
              이용 약관
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
