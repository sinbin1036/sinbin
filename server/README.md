# 📁 1. `server/db.py`

**Supabase Postgres DB와 연결하는 부분**

* SQLAlchemy `engine`, `SessionLocal`, `Base` 생성
* `get_db()` generator 함수로 요청마다 DB 세션 제공
* FastAPI 라우트에서 DB 접근할 때 이걸 사용

---

# 📁 2. `server/models.py`

**User 테이블 모델**

* GitHub OAuth 로그인용 최소 필드 포함
  * github_id
  * github_login (username)
  * created_at
  * updated_at
* 로그인할 때마다 업데이트되도록 자동 timestamp 있음

> → 즉, GitHub로 로그인하면 이 User 테이블에 자동 저장됨.

---

# 📁 3. `server/auth_utils.py`

**JWT 토큰 생성/검증 기능**

* HS256 방식 JWT 사용
* `session` 쿠키에 들어갈 JWT 만들고 검증하는 용도
* JWT 안에는 `sub=user.id` 저장 → 나중에 유저 조회할 때 사용

---

# 📁 4. `server/dependencies.py`

**get_current_user() 인증 의존성**

* FastAPI `Depends`로 인증이 필요한 라우트에서 사용
* session 쿠키를 읽고 → JWT decode → DB에서 유저 조회
* 실패 시 401 Unauthorized 발생

> → 나중에 `/dashboard/summary` 같은 보호된 API에서 사용하면 됨.

---

# 📁 5. `server/routers/auth.py`

**GitHub OAuth 전체 흐름이 들어있는 핵심 파일**

내용:

### `/auth/github/login`

* GitHub authorize URL 생성해서 리다이렉트
* OAuth state + remember 옵션을 인메모리 저장소(dict)에 저장
* remember=1이면 → 30일짜리 쿠키
* remember 없으면 → 약 2시간짜리 쿠키

### `/auth/github/callback`

* GitHub가 보내준 `code`를 `token`으로 교환
* `/user` API로 GitHub 사용자를 조회
* DB에 user 데이터를 upsert(있으면 갱신, 없으면 생성)
* JWT session 쿠키 설정 (HttpOnly+Secure+SameSite=Lax)
* 마지막에 프론트엔드 `/`로 리다이렉트

### 오류 처리

* GitHub API 문제 → 400 or 502 에러 반환

---

# 📁 6. `server/main.py`

**FastAPI 앱 시작점**

* CORS 설정
* DB 테이블 자동 생성 (개발 단계에서만 적당함)
* auth 라우터 연결
* `/health` 엔드포인트 있음

---

# 📁 7. `server/config.py`

**환경변수 로딩**

* GITHUB_CLIENT_ID
* GITHUB_CLIENT_SECRET
* GITHUB_REDIRECT_URI
* DATABASE_URL (Supabase Postgres)
* JWT_SECRET
* FRONTEND_ORIGIN(optional)

없으면 즉시 오류 발생 → 잘못된 환경 설정 빨리 찾음.
