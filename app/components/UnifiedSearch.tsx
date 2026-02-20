import type React from "react";

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

export default function UnifiedSearch() {
  return (
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
  );
}
