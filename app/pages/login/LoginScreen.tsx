'use client';

import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export default function LoginScreen() {
  const [rememberMe, setRememberMe] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");
  const showUnauthorized = error === "unauthorized";

  const handleLogin = useCallback(() => {
    const loginTarget = new URL("/auth/github/login", window.location.origin);

    if (rememberMe) {
      loginTarget.searchParams.set("remember", "1");
    }

    window.location.href = loginTarget.toString();
  }, [rememberMe]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-200 to-stone-100 text-stone-900 transition-colors dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 dark:text-stone-100">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-12 sm:px-10">
        <section className="w-full max-w-md rounded-[2rem] border border-stone-200/80 bg-white/80 p-8 shadow-[0_35px_65px_-45px_rgba(41,37,36,0.65)] backdrop-blur-sm dark:border-stone-800/70 dark:bg-stone-900/60 dark:shadow-[0_40px_65px_-45px_rgba(250,250,249,0.35)]">
          <div className="mb-8 space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500 dark:text-stone-400">
              SINBIN WORKSPACE
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">대시보드에 로그인</h1>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              GitHub 계정으로 인증하면 개인화된 Sinbin 홈이 열립니다.
            </p>
          </div>
          {showUnauthorized ? (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-rose-200/80 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
            >
              사용가능한 유저가 아닙니다.
            </div>
          ) : null}

          <div className="mb-6 space-y-3">
            <label className="inline-flex items-center gap-3 text-sm text-stone-600 dark:text-stone-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              />
              로그인 유지
            </label>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              공유 디바이스에서는 체크 해제 상태로 두는 것을 권장해요.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogin}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-stone-50 transition hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
              className="h-4 w-4 fill-current text-stone-50 dark:text-stone-900"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.11 0 0 .67-.21 2.2.82a7.48 7.48 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            GitHub로 로그인
          </button>
        </section>
      </main>
    </div>
  );
}

