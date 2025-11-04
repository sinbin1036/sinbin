# AGENTS.md — Project PRD : Personalized Dashboard Web (Rebuild, Detailed)

## 0) TL;DR

* **목표** : Chrome 새 탭 같은 **개인 런처 대시보드**
* **위젯** : Spotify Top Tracks/Artists, GitHub Activity/Repo Commits, Quick Launch
* **UI** : **shadcn/ui** 레퍼런스, **Stone** 팔레트, 미니멀 + 차분
* **아키텍처** : Next.js 15(App Router) + FastAPI, 서버–클라이언트 REST 6+
* **핵심페이지** : `/ (page.tsx)` 하나로 대시보드 구성 (SSR+CSR 혼합)

---

## 1) Project Overview

 **개인화 대시보드 웹 앱** . 로그인 후 사용자의  **Spotify** (자주 듣는 곡/아티스트)와  **GitHub** (최근 1년 기여·레포별 커밋)를 **한 화면**에 카드 위젯으로 보여준다. 상단에는 시계/인사말, 하단엔 바로가기(Quick Launch).

---

## 2) Tech Stack

* **Frontend** : Next.js 15(App Router) + React 19
* **UI** : shadcn/ui (Card, Button, Tabs, Avatar, Progress, Skeleton, Badge, DropdownMenu, Dialog)
* Base palette: **`stone`**
* Style: minimal, calm, elegant / `rounded-2xl`, subtle shadow
* **Animation** : Framer Motion (카드 페이드/슬라이드)
* **Backend** : FastAPI (Python)
* **DB** : SQLite or Supabase(토큰, 캐시)
* **APIs** : Spotify Web API(`/me/top/tracks`, `/me/top/artists`), GitHub GraphQL/REST

---

## 3) System Architecture

<pre class="overflow-visible!" data-start="1185" data-end="1335"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>Client (Next.js, /app)
  └─ </span><span>fetch</span><span> -> /</span><span>server</span><span> REST (FastAPI)
        ├─ Spotify API (OAuth, </span><span>user</span><span>-top-</span><span>read</span><span>)
        └─ GitHub API (GraphQL/REST)
</span></span></code></div></div></pre>

* **서버**가 외부 API 프록시/가공 + 토큰 보관
* **클라이언트**는 **우리 서버만** 호출

---

## 4) Server–Client Endpoints (6+)

1. `POST /auth/spotify` — OAuth 코드 교환 → 토큰 저장(서버 DB)
2. `GET /me/spotify/top-tracks?range=short_term|medium_term|long_term&limit=10`
3. `GET /me/spotify/top-artists?range=...&limit=10`
4. `GET /me/github/activity` — GraphQL: 최근 1년 `totalContributions` 등
5. `GET /me/github/repo-commits?owner=...&repo=...` — author=USER 필터 합산
6. `GET /dashboard/summary` — 2~5 묶음 반환(홈 1회 호출용)

> 응답 공통 래핑: `{ ok: boolean; data?: T; error?: { code: string; message: string } }`

---

## 5) Data Models (프론트 타입)

```
// Spotify
type SpotifyTrack = {
  id: string; name: string;
  artists: { id: string; name: string }[];
  album: { id: string; name: string; image: string };
  popularity: number; previewUrl?: string;
};
type SpotifyArtist = { id: string; name: string; image?: string; genres?: string[]; popularity?: number };

// GitHub
type GithubActivity = { totalContributions: number; weeks: { date: string; count: number }[] };
type RepoCommits = { owner: string; repo: string; commitCount: number };

// Summary
type DashboardSummary = {
  spotify: { topTracks: SpotifyTrack[]; topArtists: SpotifyArtist[] };
  github:  { activity: GithubActivity; hotRepos: RepoCommits[] };
};

```

---

## 6) UI / UX Guideline

* **Layout**
  * **TopBar** : 오늘 날짜/시간, 사용자 인사, 설정(테마/범위)
  * **Grid** : 2~3열 카드. (xl: 3col, lg: 2col, sm: 1col)
  * **Cards** :
  * Spotify Top Tracks (탭으로 기간 전환)
  * Spotify Top Artists
  * GitHub Activity (지난 1년 total + 미니 heatline 그래프)
  * Repo Commits (Select로 레포 선택 → 수치/Badge)
  * Quick Launch(아이콘: GitHub, Mail, Docs, Classroom…)
* **Theme** : shadcn  **Stone** . 여백큼/모서리 큼(`rounded-2xl`)
* **상태** : Skeleton 로딩, Error State(Card 내 재시도 버튼), Empty State(가이드 텍스트)
* **접근성** : 키보드 포커스, ARIA 라벨, 대비 준수

---

## 7) App Router 구조 & 주요 파일

```

```

---

## 8) **page.tsx** 설계 (핵심)

### 8.1 역할

* 홈 대시보드 **메인 페이지**
* 최초 렌더 시 **서버 컴포넌트**에서 `/dashboard/summary` **SSR fetch**로 기본 데이터 프리패치
* 각 위젯은 **클라이언트 컴포넌트**로 분리(탭/인터랙션/애니메이션)

### 8.2 데이터 흐름

1. `page.tsx` (Server Component)
   * try: `await fetchSummary()` (서버에서 FastAPI 호출)
   * success: props로 각 위젯에 분배
   * fail: **ErrorState** 카드들 렌더 + 간단한 가이드(재시도 버튼은 위젯 내부에서 클라이언트 fetch로)
2. 위젯(클라이언트)
   * 기본 데이터로 초기 렌더 → 최신 데이터는 클라이언트 fetch로 갱신
   * 탭/범위 변경 시 파라미터 그대로 서버 엔드포인트 요청

---

## 9) Error Handling (전역)

* 서버 응답 `ok=false` → 클라이언트에서 공통 토스트 + 카드별 에러 메시지
* 네트워크 에러 → 재시도 버튼 노출, 백오프(1.5x)
* 인증이 필요한 경우 401 → 로그인 모달/설정으로 안내

---

## 10) Version Control (중요)

* 커밋 메시지: **Conventional Commits** (예: `feat: Spotify 상단 카드 추가`)
* 브랜치: `feat/*`, `fix/*`, `chore/*`, `docs/*`
* PR 템플릿: 문제/해결/검증/후속작업/스크린샷
* 기능 단위 PR (작게, 자주)

---

## 11) Local Dev

* `npm install`
* `npm run dev` → http://localhost:3000
* `npm run build` (타입체크 포함), `npm start`

---

## 12) Security & Privacy

* 토큰/비밀키는 서버에만 저장(.env)
* CORS/Rate-limit/캐시 TTL
* 로그에 개인 정보 최소화

---

## 13) Milestones

* M1: 기본 위젯(Spotify/GitHub) + Quick Launch
* M2: OAuth 연결, 서버 API 완성
* M3: 애니메이션/다크모드 완성, 배포
