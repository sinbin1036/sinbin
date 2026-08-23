import DashboardNav from "@/app/components/dashboard/DashboardNav";
import HeroVideo from "@/app/components/dashboard/HeroVideo";
import LiveClock from "@/app/components/dashboard/LiveClock";
import HeroMessage from "@/app/components/dashboard/HeroMessage";
import FavoriteLinks from "@/app/components/dashboard/FavoriteLinks";
import Reveal from "@/app/components/dashboard/Reveal";
import ScrollCue from "@/app/components/dashboard/ScrollCue";
import QuickLaunch from "@/app/components/QuickLaunch";

const dateBadge = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "long",
}).format(new Date());

const workspaceCollections = [
  {
    name: "온콜 필수 자료",
    blurb: "에스컬레이션 흐름, 커뮤니케이션 템플릿, 감사 기록.",
  },
  {
    name: "VIP 계정",
    blurb: "최신 약속, 갱신 리스크, 해결되지 않은 이슈.",
  },
  {
    name: "출시 준비",
    blurb: "교육 플레이리스트, FAQ 초안, 가드레일.",
  },
];

const workspaceSignals = [
  {
    name: "어제",
    detail: "검증된 플레이북 12개 · 검토 대기 3개",
  },
  {
    name: "트렌드",
    detail: "프론트라인 요원 68%가 AI 응답 사용 중",
  },
  {
    name: "집중",
    detail: "금요일 전 정책 변경 2건에 배포 노트 필요",
  },
];

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

        <section id="workspace" className="scroll-mt-28">
          <Reveal className="grid gap-6 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="paper-panel flex flex-col gap-4 rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8a7c69]">
                    워크스페이스 컬렉션
                  </h2>
                  <p className="mt-1 text-sm text-[#5e5245]">
                    필수 자료를 모아두면 새 팀원도 빠르게 맥락을 파악할 수 있어요.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-[rgba(131,108,74,.2)] px-3 py-1 text-xs font-medium text-[#5e5245] transition hover:border-[#bc8750] hover:text-[#2a241c]"
                >
                  관리
                </button>
              </div>
              <ul className="grid gap-3">
                {workspaceCollections.map((collection) => (
                  <li
                    key={collection.name}
                    className="rounded-2xl border border-[rgba(131,108,74,.1)] bg-white/50 px-4 py-3 transition hover:border-[#bc8750]/60 hover:bg-white/70"
                  >
                    <p className="text-sm font-semibold text-[#2a241c]">{collection.name}</p>
                    <p className="text-xs text-[#8a7c69]">{collection.blurb}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <article className="paper-panel rounded-3xl p-6 transition hover:-translate-y-1">
                <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8a7c69]">
                  워크스페이스 시그널
                </h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {workspaceSignals.map((signal) => (
                    <li key={signal.name} className="rounded-2xl border border-[rgba(131,108,74,.1)] px-4 py-3">
                      <p className="text-sm font-semibold text-[#2a241c]">{signal.name}</p>
                      <p className="text-xs text-[#8a7c69]">{signal.detail}</p>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="silk flex flex-col gap-4 rounded-3xl p-6 text-[#2f261a]">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8a7c69]">꿀팁</h2>
                  <p className="mt-2 text-sm text-[#3f3628]">
                    Sinbin AI에게 어제의 에스컬레이션을 요약하거나 승인 프로세스가 포함된 새 가드레일을 작성해 달라고 요청해 보세요.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-[#2a241c] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#3f3628]"
                >
                  커맨드 센터 열기
                </button>
              </article>
            </div>
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
