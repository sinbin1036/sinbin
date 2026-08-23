# Personalized Dashboard Web

GitHub 계정으로 로그인하고 사용자별 Quick Links를 관리하는 Next.js + Supabase 기반 개인 런처 대시보드입니다.

현재 구현 범위는 다음과 같습니다.

- Supabase Auth 기반 GitHub OAuth 로그인·로그아웃
- Next.js SSR 쿠키 세션
- Supabase Postgres 기반 Quick Links CRUD
- Row Level Security를 통한 사용자별 데이터 격리
- 사용 빈도 기반 즐겨찾기 5개를 노출하는 히어로 대시보드
- GitHub 커밋/PR 통계 및 최근 활동 위젯 (GraphQL + REST, 서버 라우트에서만 토큰 사용)
- Spotify OAuth 연동 및 최근 재생·최다 재생 트랙 위젯

## 기술 스택

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, Stone 팔레트
- Supabase Auth, Postgres, Data API, RLS

## 로컬 실행

```bash
npm install
npm run dev
```

프로젝트 루트에 `.env.local`을 만들고 다음 값을 설정합니다.

```dotenv
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

`SPOTIFY_REDIRECT_URI`는 Spotify Developer Dashboard 앱의 Redirect URI와 문자 그대로 일치해야 합니다. 로컬에서 `127.0.0.1`로 등록했다면 `localhost:3000`이 아닌 `http://127.0.0.1:3000`으로 접속해야 콜백이 정상 동작합니다.

## Supabase 설정

1. Supabase Dashboard의 Authentication → Providers에서 GitHub를 활성화합니다.
2. GitHub OAuth App의 callback URL을 Supabase Dashboard에 표시된 callback URL로 설정합니다.
3. Supabase Redirect URLs에 로컬 `http://localhost:3000/auth/callback`과 운영 `/auth/callback` URL을 등록합니다.
4. `quick_links.user_id`가 `auth.users.id`를 참조하고 사용자별 RLS 정책이 활성화됐는지 확인합니다.

허용 사용자 제한이 필요하면 배포 환경에서 `REQUIRE_ALLOWLIST=true`로 설정하고 이메일을 등록합니다.

```sql
insert into public.allowed_users (email)
values ('your-github-email@example.com');
```

GitHub 계정이 이메일을 제공하지 않으면 allowlist 검증이 실패할 수 있으므로 GitHub 이메일 설정을 확인해야 합니다.

히어로 즐겨찾기 5개(사용 빈도 계산)와 대시보드 커스텀 문구 기능을 쓰려면 `supabase/migrations/20260824_add_click_count_and_dashboard_settings.sql`을 Supabase SQL Editor에서 한 번 실행해야 합니다.

Spotify 위젯을 쓰려면 OAuth 토큰을 사용자별로 저장하는 `spotify_tokens` 테이블을 Supabase SQL Editor에서 직접 만들어야 합니다 (컬럼: `user_id` PK/FK → `auth.users.id`, `access_token`, `refresh_token`, `expires_at`, `updated_at`; RLS로 `auth.uid() = user_id` 행만 조회/수정 가능하도록 정책 설정).

## 구조

```text
Next.js
├─ Supabase Auth ── GitHub OAuth
├─ Server Component ── 쿠키 기반 사용자 검증
└─ Supabase Data API ── Postgres
                         └─ RLS: auth.uid() = user_id
```

Quick Links는 별도 FastAPI 프록시 없이 Supabase Data API를 직접 사용합니다. 브라우저에는 publishable/anon key만 노출하며 service role 또는 secret key는 사용하지 않습니다.

## 주요 명령어

```bash
npm run dev
npm run build
npm run start
```

## 외부 API 연동

- GitHub: `app/api/github/stats`가 서버에서 `GITHUB_TOKEN`으로 GraphQL(`contributionsCollection`, 기간별 커밋 수)과 검색 API(`/search/commits`, `/search/issues?type:pr`, 최근 커밋·PR)를 호출합니다. 토큰은 브라우저에 노출되지 않습니다.
- Spotify: `app/api/spotify/authorize` → Spotify OAuth 동의 → `app/api/spotify/callback`에서 code를 교환해 `spotify_tokens` 테이블에 저장합니다. `app/api/spotify/recent`가 만료된 access token을 서버에서 갱신한 뒤 `/me/player/recently-played`, `/me/top/tracks`를 호출합니다.
