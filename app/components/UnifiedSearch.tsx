"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export default function UnifiedSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/search-suggest?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.ok && json.data.length > 0) {
        setSuggestions(json.data);
        setOpen(true);
      } else {
        setSuggestions([]);
        setOpen(false);
      }
    } catch {
      setSuggestions([]);
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIdx]);
    }
  }

  function selectSuggestion(text: string) {
    setQuery(text);
    setSuggestions([]);
    setOpen(false);
    setActiveIdx(-1);
    const url = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
    window.open(url, "_self");
  }

  function handleSubmit(e: React.FormEvent) {
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIdx]);
    } else {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form
        aria-label="통합 검색"
        action="https://www.google.com/search"
        method="GET"
        onSubmit={handleSubmit}
        className={`flex w-full items-center gap-4 px-5 py-3.5 shadow-[0_25px_45px_-35px_rgba(41,37,36,0.65)] backdrop-blur-sm transition border bg-stone-50/80 dark:bg-stone-900/60 dark:shadow-[0_25px_55px_-40px_rgba(250,250,249,0.35)] ${
          open && suggestions.length > 0
            ? "rounded-t-3xl border-b-0 border-stone-400/80 dark:border-stone-600/80"
            : "rounded-full border-stone-300/80 hover:border-stone-400/80 focus-within:border-stone-500/80 dark:border-stone-700/80"
        }`}
      >
        <SearchIcon className="h-5 w-5 shrink-0 text-stone-500 dark:text-stone-400" />
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(-1);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Sinbin에서 검색하거나 URL을 입력하세요"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="search-suggestions"
          className="flex-1 bg-transparent text-base text-stone-800 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500"
        />
      </form>

      {open && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 z-50 overflow-hidden rounded-b-3xl border border-t-0 border-stone-400/80 bg-stone-50/95 pb-2 shadow-[0_20px_40px_-15px_rgba(41,37,36,0.5)] backdrop-blur-sm dark:border-stone-600/80 dark:bg-stone-900/95 dark:shadow-[0_20px_50px_-20px_rgba(250,250,249,0.25)]"
        >
          <li className="mx-5 mb-1 border-b border-stone-200/60 dark:border-stone-700/60" />
          {suggestions.map((s, i) => (
            <li key={s} role="option" aria-selected={i === activeIdx}>
              <button
                type="button"
                onMouseEnter={() => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(-1)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(s);
                }}
                className={`flex w-full items-center gap-3.5 px-5 py-2.5 text-left text-sm transition-colors ${
                  i === activeIdx
                    ? "bg-stone-100/80 dark:bg-stone-800/60"
                    : "hover:bg-stone-100/60 dark:hover:bg-stone-800/40"
                }`}
              >
                <SearchIcon className="h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500" />
                <span className="text-stone-700 dark:text-stone-200">{s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
