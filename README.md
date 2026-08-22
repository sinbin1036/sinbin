# Personalized Dashboard Web

GitHub 계정으로 로그인하고 사용자별 Quick Links를 관리하는 Next.js + Supabase 기반 개인 런처 대시보드입니다.

현재 구현 범위는 다음과 같습니다.

- Supabase Auth 기반 GitHub OAuth 로그인·로그아웃
- Next.js SSR 쿠키 세션
- Supabase Postgres 기반 Quick Links CRUD
- Row Level Security를 통한 사용자별 데이터 격리
- Google 연관 검색어 자동완성

Spotify 연동은 아직 포함하지 않습니다.

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
```

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

## 향후 범위

Spotify 및 GitHub 활동 위젯은 현재 범위에 포함되지 않습니다. 추가할 때 외부 API 토큰과 비밀값은 브라우저가 아닌 Supabase Edge Functions에서만 처리해야 합니다.
