const quickLinks = [
  {
    label: "인박스 분류",
    href: "#",
    description: "Slack 큐",
    symbol: "📬",
  },
  {
    label: "RMA 플레이북",
    href: "#",
    description: "Notion 문서",
    symbol: "📘",
  },
  {
    label: "에스컬레이션 매트릭스",
    href: "#",
    description: "Confluence",
    symbol: "🧭",
  },
  {
    label: "매출 운영 리포트",
    href: "#",
    description: "Looker 보드",
    symbol: "📊",
  },
  {
    label: "정책 업데이트",
    href: "#",
    description: "Sinbin 허브",
    symbol: "⚙️",
  },
  {
    label: "실시간 인시던트",
    href: "#",
    description: "PagerDuty",
    symbol: "🚨",
  },
  {
    label: "팀 핸드북",
    href: "#",
    description: "GitBook",
    symbol: "📖",
  },
  {
    label: "모든 바로가기",
    href: "#",
    description: "전체 보기",
    symbol: "➕",
  },
];

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
    detail: "검증된 플레이북 12개 • 검토 대기 3개",
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

type IconProps = React.SVGProps<SVGSVGElement>;

function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="m21 21-3.8-3.8m1.3-5.2a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function MicIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 3a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 1 1-5 0v-5A2.5 2.5 0 0 1 12 3Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M19 10.5A7 7 0 0 1 12 17a7 7 0 0 1-7-6.5M12 17v4m0 0h4m-4 0H8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function SparkleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="m12 3 1.1 3.7a1.5 1.5 0 0 0 1 1l3.7 1.1-3.7 1.1a1.5 1.5 0 0 0-1 1L12 15l-1.1-3.7a1.5 1.5 0 0 0-1-1L6.2 8.7l3.7-1.1a1.5 1.5 0 0 0 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="m19 16 0.8 2.6a1 1 0 0 0 0.7 0.7L23 20l-2.5 1a1 1 0 0 0-0.7 0.7L19 24l-0.8-2.6a1 1 0 0 0-0.7-0.7L15 20l2.5-0.7a1 1 0 0 0 0.7-0.7Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function GridIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M4 4h5v5H4Zm11 0h5v5h-5ZM4 15h5v5H4Zm11 0h5v5h-5Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

export default function DashboardScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-200 to-stone-100 text-stone-900 transition-colors dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 dark:text-stone-100">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-16 px-6 pb-14 pt-16 sm:px-10">
        <section className="flex flex-1 flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-xs font-medium uppercase tracking-[0.35em] text-stone-500 dark:text-stone-400">
              3월 6일 · 목요일
            </span>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              안녕하세요, Sinbin 팀 여러분.
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 sm:text-base">
              하던 일을 이어가거나 워크스페이스 전체에서 새롭게 검색을 시작하세요.
            </p>
          </div>

          <form
            aria-label="통합 검색"
            action="https://www.google.com/search"
            method="GET"
            className="flex w-full max-w-2xl items-center gap-4 rounded-full border border-stone-300/80 bg-stone-50/80 px-5 py-3.5 shadow-[0_25px_45px_-35px_rgba(41,37,36,0.65)] backdrop-blur-sm transition hover:border-stone-400/80 focus-within:border-stone-500/80 dark:border-stone-700/80 dark:bg-stone-900/60 dark:shadow-[0_25px_55px_-40px_rgba(250,250,249,0.35)]"
          >
            <SearchIcon className="h-5 w-5 text-stone-500 dark:text-stone-400" />
            <input
              type="search"
              name="q"
              placeholder="Sinbin에서 검색하거나 URL을 입력하세요"
              autoComplete="off"
              className="flex-1 bg-transparent text-base text-stone-800 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-200/60 text-stone-600 transition hover:bg-stone-300/80 dark:bg-stone-800/70 dark:text-stone-300 dark:hover:bg-stone-700"
                aria-label="음성 검색"
              >
                <MicIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300/70 text-stone-500 transition hover:border-stone-400 hover:text-stone-600 dark:border-stone-700 dark:text-stone-400 dark:hover:border-stone-600 dark:hover:text-stone-200"
                aria-label="작업 탐색"
              >
                <SparkleIcon className="h-4 w-4" />
              </button>
            </div>
          </form>

          <section aria-labelledby="quick-links-heading" className="w-full max-w-3xl">
            <div className="mb-4 flex items-center justify-between px-1">
              <div>
                <h2
                  id="quick-links-heading"
                  className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500 dark:text-stone-400"
                >
                  바로가기
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-500">
                  자주 방문하는 링크를 드래그해 순서를 바꿔보세요.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300/70 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-stone-400 hover:text-stone-800 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:text-stone-100"
              >
                <GridIcon className="h-3.5 w-3.5" />
                사용자 지정
              </button>
            </div>
            <ul className="grid gap-3 sm:grid-cols-4">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="group flex flex-col gap-2 rounded-3xl border border-stone-200/80 bg-stone-50/80 p-4 transition hover:-translate-y-1 hover:border-stone-400/80 hover:bg-stone-100/80 dark:border-stone-800/70 dark:bg-stone-900/60 dark:hover:border-stone-600 dark:hover:bg-stone-800/70"
                  >
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-200/80 text-lg transition group-hover:scale-105 group-hover:bg-stone-300/80 dark:bg-stone-800/70 dark:group-hover:bg-stone-700">
                      {item.symbol}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-100">{item.label}</span>
                      <span className="text-xs text-stone-500 dark:text-stone-400">{item.description}</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </section>

        <section className="grid gap-6 pb-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4 rounded-3xl border border-stone-200/80 bg-stone-50/80 p-6 shadow-[0_30px_55px_-45px_rgba(41,37,36,0.6)] dark:border-stone-800/70 dark:bg-stone-900/60 dark:shadow-[0_30px_55px_-50px_rgba(250,250,249,0.35)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500 dark:text-stone-400">
                  워크스페이스 컬렉션
                </h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  필수 자료를 모아두면 새 팀원도 빠르게 맥락을 파악할 수 있어요.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-stone-300/60 px-3 py-1 text-xs font-medium text-stone-600 transition hover:border-stone-400 hover:text-stone-800 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:text-stone-100"
              >
                관리
              </button>
            </div>
            <ul className="grid gap-3">
              {workspaceCollections.map((collection) => (
                <li
                  key={collection.name}
                  className="rounded-2xl border border-stone-200/70 bg-white/70 px-4 py-3 transition hover:border-stone-400/70 hover:bg-white dark:border-stone-800/60 dark:bg-stone-900/70 dark:hover:border-stone-600 dark:hover:bg-stone-800/70"
                >
                  <p className="text-sm font-semibold text-stone-700 dark:text-stone-100">{collection.name}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{collection.blurb}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <article className="rounded-3xl border border-stone-200/80 bg-stone-50/80 p-6 transition hover:border-stone-400/80 hover:bg-stone-100/80 dark:border-stone-800/70 dark:bg-stone-900/60 dark:hover:border-stone-600 dark:hover:bg-stone-800/70">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500 dark:text-stone-400">
                워크스페이스 시그널
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {workspaceSignals.map((signal) => (
                  <li key={signal.name} className="rounded-2xl border border-stone-200/70 px-4 py-3 dark:border-stone-800/60">
                    <p className="text-sm font-semibold text-stone-700 dark:text-stone-100">{signal.name}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{signal.detail}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="flex flex-col gap-4 rounded-3xl border border-stone-200/80 bg-gradient-to-br from-stone-200/80 via-stone-100 to-stone-200/80 p-6 text-stone-800 dark:border-stone-700/70 dark:from-stone-800/70 dark:via-stone-900 dark:to-stone-800/70 dark:text-stone-100">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500 dark:text-stone-300">
                  꿀팁
                </h2>
                <p className="mt-2 text-sm text-stone-700 dark:text-stone-200">
                  Sinbin AI에게 어제의 에스컬레이션을 요약하거나 승인 프로세스가 포함된 새 가드레일을 작성해 달라고 요청해 보세요.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
              >
                커맨드 센터 열기
              </button>
            </article>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-200/80 pt-6 text-xs text-stone-500 dark:border-stone-800/70 dark:text-stone-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-stone-200/80 text-sm font-semibold text-stone-700 dark:bg-stone-800/70 dark:text-stone-100">
              SB
            </span>
            <div className="flex flex-col">
              <span className="font-medium text-stone-600 dark:text-stone-200">Sinbin 워크스페이스</span>
              <span>상태: 모든 시스템 정상 · 2분 전 업데이트</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="transition hover:text-stone-700 dark:hover:text-stone-200">
              개인정보 처리방침
            </a>
            <a href="#" className="transition hover:text-stone-700 dark:hover:text-stone-200">
              이용 약관
            </a>
            <a href="#" className="transition hover:text-stone-700 dark:hover:text-stone-200">
              페이지 사용자 지정
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

