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
   * 기간 탭 변경 시 `GET /me/spotify/top-tracks?range=...` 등 **클라이언트 fetch**
   * Repo 선택 시 `GET /me/github/repo-commits?owner=...&repo=...` 호출
   * 로딩: **Skeleton** 표시, 실패:  **ErrorState** (재시도)

### 8.3 UI 레이아웃(와이어)

* TopBar(좌: 인사/시간, 우: 기간 셀렉터·설정 버튼)
* Grid(3열 가정):
  * Col1: **Spotify Top Tracks** (탭: short/medium/long)
  * Col2: **Spotify Top Artists**
  * Col3: **GitHub Activity**
  * 아래행 섞기:  **Repo Commits** , **Quick Launch**

### 8.4 상태/오류 처리

* 서버 요약 실패: “요약 불러오기 실패” 안내 + 각 카드 개별 재시도 가능
* 특정 카드 실패: 해당 카드만 ErrorState(UI 일관성)
* Empty: “Spotify 권한 필요”/“GitHub 토큰 필요” CTA 버튼

### 8.5 로딩 전략

* 첫 렌더: SSR 요약 데이터로 **FCP 빠르게**
* 인터랙션: 클라 fetch + Skeleton → Data 교체
* 캐싱: `next.revalidate = 60`(요약), 위젯별 SWR-like 재검증

### 8.6 `page.tsx` 의사코드

```
// app/page.tsx (Server Component)
import { SpotifyWidget, GithubWidget, QuickLaunch, TopBar } from "@/components";
import { fetchSummary } from "@/lib/fetcher";

export default async function Page() {
  let summary = null;
  try {
    summary = await fetchSummary(); // calls FastAPI /dashboard/summary
  } catch {}

  return (
    <main className="container mx-auto py-8 space-y-6">
      <TopBar />
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        <SpotifyWidget initial={summary?.spotify} />
        <GithubWidget initial={summary?.github} />
        <QuickLaunch />
        {/* 필요시 RepoCommitsWidget 추가 */}
      </div>
    </main>
  );
}

```

---

## 9) 위젯 스펙 (요약)

### 9.1 `SpotifyWidget`

* **Tabs** : `short_term | medium_term | long_term`
* **GET /me/spotify/top-tracks`** 호출해 카드 리스트(앨범커버, 제목, 아티스트, 인기점수)
* **옵션** : Top Artists 탭 토글(artists endpoint)

### 9.2 `GithubWidget`

* **GET /me/github/activity`** : totalContributions, 주간 heatline
* **Select** : owner/repo 고르면 `repo-commits` 호출 → 숫자 + Badge

### 9.3 `QuickLaunch`

* 자주 쓰는 링크들(아이콘, 외부 링크 새창)
* 사용자가 커스텀 추가 가능(로컬 저장 or 서버 저장 선택)

---

## 10) API 스키마 (요약)

### 10.1 `/me/spotify/top-tracks`

* **Req** : `?range=short_term&limit=10`
* **Res** :

```
{
  "ok": true,
  "data": [
    {
      "id": "xxx", "name": "Song",
      "artists": [{"id":"a1","name":"Artist"}],
      "album": {"id":"b1","name":"Album","image":"https://..."},
      "popularity": 87, "previewUrl": "https://..."
    }
  ]
}

```

### 10.2 `/me/github/activity`

```
{
  "ok": true,
  "data": {
    "totalContributions": 527,
    "weeks": [{"date":"2025-10-27","count":7}, ...]
  }
}

```

### 10.3 `/dashboard/summary`

```
{
  "ok": true,
  "data": {
    "spotify": { "topTracks": [ ... ], "topArtists": [ ... ] },
    "github":  { "activity": { ... }, "hotRepos": [ {"owner":"me","repo":"X","commitCount":42} ] }
  }
}

```

---

## 11) Auth & 보안

* **Spotify** : OAuth Code Flow, **`user-top-read`** 스코프
* **GitHub** : PAT(읽기 권한) 또는 OAuth App
* 토큰은 **서버 DB** 저장(암호화/만료/리프레시), 클라 저장 금지
* 서버에서 **외부 API 호출 한정 레이트 리밋** + 캐시(예: 60s)

---

## 12) ENV & 설정

* `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`
* `GITHUB_TOKEN` or OAuth creds
* 서버 `BASE_URL`, `CORS_ORIGIN`, `SESSION_SECRET`

---

## 13) 품질/테스트

* **유닛** : fetcher, 파서(Spotify/GitHub 응답→내 모델)
* **통합** : 엔드포인트 모킹 후 위젯 렌더/상호작용
* **E2E** : `/` 접속 → 요약 카드 로딩 → 탭/셀렉터 동작

---

## 14) Done 정의 (MVP)

* [ ] `/page.tsx`에서 **요약 SSR** + 위젯 렌더
* [ ] Spotify/GitHub  **실 API 연동** (토큰/권한 OK)
* [ ] **Stone 테마** shadcn 적용, Skeleton/에러/Empty 상태 구현
* [ ] 최소 6개 엔드포인트 배치 & 문서화
* [ ] README: .env, OAuth 설정, 실행 방법

---

## 15) Codex 지시 (강화)

* **page.tsx**는 **SSR 요약 fetch** 후, 위젯은 클라에서 인터랙션 fetch.
* shadcn/ui **Stone** 팔레트 사용, 카드형 그리드, `rounded-2xl` + subtle shadow.
* 위젯은  **독립 가능** (프롭 `initial` + 클라 fetch).
* 실패/빈상태/로딩 UI **반드시** 제공.
* API 응답 스키마 고정(`{ ok, data, error }`).
* 코드 생성 시  **타입 우선, 모듈화, 폴더 구조 유지** .



## 16) Version Control (Git & GitHub)

* **커밋 메시지 언어** : *항상 **한국어*** 사용
* **컨벤션** : Conventional Commits 엄수 — `feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`
* **이슈 링크** : 요청되었거나 문맥상 이슈 번호가 있을 때만 `#<번호>`로 연결. **번호 임의 생성 금지**
* **원자적 커밋** : 하나의 논리적 변경 단위로 쪼개서 커밋
* **안전 규칙** : `git push --force`  **금지** (명확한 사유·지시 없이는 사용하지 않음). 충돌은 아래 절차로 해결

### 16.1 커밋 메시지 템플릿

<pre class="overflow-visible!" data-start="456" data-end="576"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span><type>: <짧은 요약(한글, 현재형)></span><span>

</span><span>본문(선택): 무엇을, 왜(배경/의도). 변경 범위가 넓으면 글머리표로.</span><span>

</span><span>해결/연계(선택):</span><span>
- Resolves </span><span>#123</span><span>
- Relates to </span><span>#456</span><span>
</span></span></code></div></div></pre>

**예시**

<pre class="overflow-visible!" data-start="584" data-end="727"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>feat: 대시보드 요약 SSR 추가 및 위젯 초기 데이터 연결

- /dashboard/summary 응답 스키마에 ok/data/error 래핑
- Spotify/GitHub 위젯 초기 렌더 성능 개선(FCP 단축)
Resolves </span><span>#42</span><span>
</span></span></code></div></div></pre>

### 16.2 브랜치 & 머지

* 기본: `main` 보호, 작업은 `feature/<키워드>`
* 머지 전략:  **Squash & merge** (히스토리 간결 유지) 권장

### 16.3 충돌 처리 가이드

1. 원격 최신화: `git fetch origin`
2. 리베이스: `git pull --rebase --autostash`
3. 파일별 충돌 해결 → 빌드/테스트 통과 확인
4. 푸시: `git push` (필요 시 `--force-with-lease`만, 사전 합의 필수)

### 16.4 커밋 예시 카탈로그

* `feat:` 새 위젯/엔드포인트 추가
* `fix:` API 스키마 불일치, 널 처리 버그 수정
* `refactor:` 컴포넌트 분리, 타입 개선(동작 동일)
* `docs:` README/AGENTS.md 보강
* `chore:` 설정, lint, 빌드 스크립트 변경
* `perf:` 렌더/쿼리 최적화
* `test:` 유닛/통합/E2E 테스트 추가
