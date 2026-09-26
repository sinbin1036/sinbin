# Personalized Dashboard Web

GitHub 계정으로 로그인하고 나만의 Quick Links, GitHub 활동, Spotify 재생 기록을 한눈에 모아보는 개인 런처 대시보드입니다.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Supabase](<https://img.shields.io/badge/Supabase-Auth%20%7C%20Postgres-3ECF8E>)](https://supabase.com/)
[![Deployed on Vercel](https://img.shields.io/badge/deployed-vercel-black)](https://sb-dash.vercel.app)

**🔗 Live Demo**: [sb-dash.vercel.app](https://sb-dash.vercel.app)

---

## 📌 소개

매일 여러 사이트를 오가며 확인하는 링크, GitHub 활동, 최근 들은 음악을 하나의 대시보드에서 확인하고 싶어서 만든 개인용 런처입니다.

- GitHub 계정으로 로그인하면 나만의 Quick Links를 등록·관리할 수 있습니다.
- 자주 쓰는 링크 5개는 사용 빈도 기반으로 자동으로 히어로 영역에 노출됩니다.
- GitHub 커밋/PR 통계와 최근 활동, Spotify 최근/최다 재생 트랙을 위젯으로 보여줍니다.

## ✨ 주요 기능

- [X] Supabase Auth 기반 GitHub OAuth 로그인·로그아웃
- [X] Next.js SSR 쿠키 세션
- [X] Quick Links CRUD (Supabase Postgres)
- [X] Row Level Security를 통한 사용자별 데이터 격리
- [X] 사용 빈도 기반 즐겨찾기 5개 노출 히어로 대시보드
- [X] GitHub 커밋/PR 통계 및 최근 활동 위젯 (GraphQL + REST)
- [X] Spotify OAuth 연동 및 최근/최다 재생 트랙 위젯
- [ ] (다음에 추가하고 싶은 기능을 여기에)

## 🛠 기술 스택

| 영역      | 스택                                          |
| --------- | --------------------------------------------- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling   | Tailwind CSS 4 (Stone 팔레트)                 |
| Backend   | Supabase Auth, Postgres, Data API, RLS        |
| 외부 연동 | GitHub GraphQL/REST API, Spotify API          |
| 배포      | Vercel                                        |

## 🚀 시작하기

### 요구 사항

- Node.js 18+
- Supabase 프로젝트
- GitHub OAuth App / Personal Access Token
- (선택) Spotify Developer App

### 설치 및 실행

```bash
git clone https://github.com/sinbin1036/sinbin.git
cd sinbin
npm install
npm run dev
```

### 환경 변수

프로젝트 루트에 `.env.local`을 만들고 아래 값을 채워주세요.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
REQUIRE_ALLOWLIST=false

# GitHub 통계 위젯
GITHUB_TOKEN=github_pat_xxx           # classic PAT, read:user + repo 스코프
GITHUB_USERNAME=your-github-username

# Spotify 위젯
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/spotify/callback
```

> ⚠️ `SPOTIFY_REDIRECT_URI`는 Spotify Developer Dashboard에 등록한 Redirect URI와 문자 그대로 일치해야 합니다. 로컬에서 `127.0.0.1`로 등록했다면 `localhost:3000`이 아닌 `http://127.0.0.1:3000`으로 접속해야 콜백이 정상 동작합니다.

## Supabase 설정

1. Supabase Dashboard의 **Authentication → Providers**에서 GitHub를 활성화합니다.
2. GitHub OAuth App의 callback URL을 Supabase Dashboard에 표시된 callback URL로 설정합니다.
3. Supabase Redirect URLs에 로컬 `http://localhost:3000/auth/callback`과 운영 `/auth/callback` URL을 등록합니다.
4. `quick_links.user_id`가 `auth.users.id`를 참조하고, 사용자별 RLS 정책이 활성화됐는지 확인합니다.

허용 사용자 제한이 필요하면 배포 환경에서 `REQUIRE_ALLOWLIST=true`로 설정하고 이메일을 등록합니다.

```sql
insert into public.allowed_users (email)
values ('your-github-email@example.com');
```

> GitHub 계정이 이메일을 공개하지 않으면 allowlist 검증이 실패할 수 있으니 GitHub 이메일 설정을 확인하세요.

**추가 마이그레이션 / 테이블**

- 히어로 즐겨찾기(사용 빈도 계산)와 대시보드 커스텀 문구 기능: `supabase/migrations/20260824_add_click_count_and_dashboard_settings.sql`을 SQL Editor에서 실행
- Spotify 위젯: `spotify_tokens` 테이블을 직접 생성 (`user_id` PK/FK → `auth.users.id`, `access_token`, `refresh_token`, `expires_at`, `updated_at`; RLS로 `auth.uid() = user_id` 행만 조회/수정 가능하도록 설정)

## 📁 구조

```
Next.js
├─ Supabase Auth ── GitHub OAuth
├─ Server Component ── 쿠키 기반 사용자 검증
└─ Supabase Data API ── Postgres
                         └─ RLS: auth.uid() = user_id
```

Quick Links는 별도 FastAPI 프록시 없이 Supabase Data API를 직접 사용합니다. 브라우저에는 publishable/anon key만 노출되며, service role/secret key는 사용하지 않습니다.

```
.
├── app/            # Next.js App Router (페이지 + API 라우트)
├── lib/            # 공통 유틸/클라이언트
├── public/         # 정적 파일
├── supabase/
│   └── migrations/ # SQL 마이그레이션
└── proxy.ts
```

## 🔌 외부 API 연동

- **GitHub**: `app/api/github/stats`가 서버에서 `GITHUB_TOKEN`으로 GraphQL(`contributionsCollection`, 기간별 커밋 수)과 검색 API(`/search/commits`, `/search/issues?type:pr`)를 호출해 최근 커밋·PR을 가져옵니다. 토큰은 브라우저에 노출되지 않습니다.
- **Spotify**: `app/api/spotify/authorize` → Spotify OAuth 동의 → `app/api/spotify/callback`에서 code를 교환해 `spotify_tokens`에 저장합니다. `app/api/spotify/recent`가 만료된 access token을 서버에서 갱신한 뒤 `/me/player/recently-played`, `/me/top/tracks`를 호출합니다.

## 주요 명령어

```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드
npm run start   # 프로덕션 서버 실행
```

## TODO

- [ ] (계획 중인 기능이나 리팩토링 항목)

## 알려진 이슈

- (현재 열려 있는 이슈나 제약사항)

## 라이선스

라이선스를 명시하려면 이 섹션을 채우세요. (예: MIT)

## TELL

- GitHub: [@sinbin1036](https://github.com/sinbin1036)
