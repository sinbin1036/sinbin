# 🧭 Personalized Dashboard Web

> **Chrome New Tab 스타일 개인 런처**  
> Spotify와 GitHub 데이터를 통합하여 한눈에 보는 **개인화 대시보드 웹앱**

---

## 🧩 Project Overview

이 프로젝트는 사용자의 **Spotify 청취 데이터**와 **GitHub 개발 활동**을 하나의 화면에서 보여주는  
**Next.js + FastAPI 기반 풀스택 개인 런처 대시보드**입니다.  
Spotify OAuth와 GitHub API를 통해 데이터를 가져오고, shadcn/ui를 이용해 미니멀하고 차분한 UI를 제공합니다.

### 주요 기능
- Spotify에서 내가 **자주 듣는 음악/아티스트** 가져오기  
- GitHub의 **최근 커밋/기여도** 조회  
- 한 화면에서 확인할 수 있는 **대시보드 위젯 구조**  
- **크롬 새 탭(Quick Launch)**처럼 바로가기 버튼 제공  

---

## ⚙️ Tech Stack

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 15 (App Router), React 19 |
| **UI Framework** | shadcn/ui — Base Color: `stone` |
| **Animation** | Framer Motion |
| **Backend** | FastAPI (Python) |
| **Database** | SQLite / Supabase (for token & cache) |
| **API** | Spotify Web API, GitHub REST / GraphQL |

---

## 🔄 System Architecture

```
graph TD
A[Client (Next.js)] -->|REST API| B[Server (FastAPI)]
B -->|OAuth & Fetch| C[Spotify API]
B -->|GraphQL & REST| D[GitHub API]
```

---

## 🧠 Core REST Endpoints (6개 이상)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/spotify` | Spotify OAuth 인증 및 토큰 교환 |
| GET | `/me/spotify/top-tracks` | 자주 듣는 곡 목록 조회 |
| GET | `/me/spotify/top-artists` | 자주 듣는 아티스트 목록 조회 |
| GET | `/me/github/activity` | 최근 1년 GitHub 기여도 조회 |
| GET | `/me/github/repo-commits?repo={name}` | 특정 레포 커밋 수 반환 |
| GET | `/dashboard/summary` | Spotify + GitHub 통합 요약 데이터 |

---

## 🎨 UI / UX Guideline

- UI Framework: **shadcn/ui**  
- Theme Color: **stone**  
- Layout  
  - 상단바: 인사말 + 날짜/시간  
  - 메인 Grid: Spotify / GitHub / Quick Launch 카드  
- Typography: Inter / Pretendard  
- Design: minimal, calm, modern  
- Motion: Framer Motion  
- Border-radius: `rounded-2xl`  

---

## 📁 Folder Structure

```
/app
  ├─ layout.tsx
  ├─ page.tsx
  └─ (components)
       ├─ TopBar.tsx
       ├─ DashboardCard.tsx
       ├─ SpotifyWidget.tsx
       ├─ GithubWidget.tsx
       ├─ QuickLaunch.tsx
       ├─ ErrorState.tsx
       └─ LoadingSkeleton.tsx

/(lib)
  ├─ fetcher.ts
  ├─ types.ts
  └─ fmt.ts

/(server)
  ├─ main.py
  ├─ routers/
  │   ├─ spotify.py
  │   └─ github.py
  └─ models/
       └─ user.py

/(store)
  └─ user-prefs.ts
```

---

## 🖥️ page.tsx Example

```tsx
import { SpotifyWidget, GithubWidget, QuickLaunch, TopBar } from "@/components";
import { fetchSummary } from "@/lib/fetcher";

export default async function Page() {
  let summary = null;
  try {
    summary = await fetchSummary();
  } catch {}

  return (
    <main className="container mx-auto py-8 space-y-6">
      <TopBar />
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        <SpotifyWidget initial={summary?.spotify} />
        <GithubWidget initial={summary?.github} />
        <QuickLaunch />
      </div>
    </main>
  );
}
```

---

## 💿 API Response Example

### /me/spotify/top-tracks
```json
{
  "ok": true,
  "data": [
    {
      "id": "123",
      "name": "Song Name",
      "artists": [{"id": "1", "name": "Artist"}],
      "album": {"id": "2", "name": "Album", "image": "https://..."},
      "popularity": 87,
      "previewUrl": "https://..."
    }
  ]
}
```

### /me/github/activity
```json
{
  "ok": true,
  "data": {
    "totalContributions": 527,
    "weeks": [
      {"date": "2025-11-03", "count": 5},
      {"date": "2025-11-10", "count": 7}
    ]
  }
}
```

### /dashboard/summary
```json
{
  "ok": true,
  "data": {
    "spotify": { "topTracks": [ ... ], "topArtists": [ ... ] },
    "github":  { "activity": { ... }, "hotRepos": [ { "repo": "Project", "commitCount": 42 } ] }
  }
}
```

---

## 🔐 Auth & Security

- Spotify OAuth (`user-top-read`)  
- GitHub PAT or OAuth  
- 서버에서 토큰 암호화 저장  
- 클라이언트는 서버로만 요청  
- 서버 캐싱(60초) + rate limit 적용  

---

## 🧱 Component Summary

| 컴포넌트 | 역할 |
|----------|------|
| DashboardCard | 공통 카드 |
| SpotifyWidget | Top Tracks/Artists |
| GithubWidget | 1년 기여도/Repo Commits |
| QuickLaunch | 바로가기 |
| TopBar | 인사 + 시간 |
| ErrorState | 오류 표시 |
| LoadingSkeleton | 로딩 스켈레톤 |

---

## 🚀 Goal

- 개인화된 “나만의 홈 탭”  
- Spotify + GitHub 데이터를 한눈에  
- Weather, Notion 등 추가 위젯 확장 가능  
