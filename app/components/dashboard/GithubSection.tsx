'use client';

import { useEffect, useState } from 'react';
import { getGithubStats, GithubStats } from '@/lib/github';
import { formatRelativeTime } from '@/lib/relativeTime';

const STAT_LABELS: { key: keyof GithubStats['commits']; label: string }[] = [
  { key: 'week', label: '이번 주' },
  { key: 'month', label: '이번 달' },
  { key: 'year', label: '올해' },
];

const PR_STATE_LABEL: Record<string, string> = {
  open: '진행 중',
  closed: '종료',
};

export default function GithubSection() {
  const [stats, setStats] = useState<GithubStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getGithubStats()
      .then(setStats)
      .catch(() => setError(true));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8a7c69]">GitHub 활동</h2>
          <p className="mt-1 text-sm text-[#5e5245]">최근 커밋과 PR 흐름을 한눈에 확인해요.</p>
        </div>
      </div>

      {error && (
        <p className="paper-panel rounded-3xl px-6 py-5 text-sm text-[#8a7c69]">
          GitHub 데이터를 불러오지 못했습니다. 환경 변수를 확인해주세요.
        </p>
      )}

      {!error && !stats && (
        <p className="paper-panel rounded-3xl px-6 py-5 text-sm text-[#8a7c69]">불러오는 중…</p>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {STAT_LABELS.map(({ key, label }) => (
              <div key={key} className="paper-panel paper-glow rounded-3xl px-4 py-5 text-center sm:px-6">
                <p className="serif text-3xl text-[#2a241c] sm:text-4xl">{stats.commits[key]}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-[#8a7c69]">{label} 커밋</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="paper-panel rounded-3xl p-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8a7c69]">최근 커밋</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {stats.recentCommits.length === 0 && (
                  <li className="text-sm text-[#8a7c69]">최근 커밋이 없습니다.</li>
                )}
                {stats.recentCommits.map((commit) => (
                  <li key={commit.url}>
                    <a
                      href={commit.url}
                      target="_blank"
                      rel="noreferrer"
                      className="paper-glow block rounded-2xl border border-[rgba(131,108,74,.1)] px-4 py-3 transition hover:bg-white/50"
                    >
                      <p className="line-clamp-1 text-sm font-semibold text-[#2a241c]">{commit.message}</p>
                      <p className="mt-1 text-xs text-[#8a7c69]">
                        {commit.repo} · {formatRelativeTime(commit.date)}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            </article>

            <article className="paper-panel rounded-3xl p-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8a7c69]">최근 PR</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {stats.recentPullRequests.length === 0 && (
                  <li className="text-sm text-[#8a7c69]">최근 PR이 없습니다.</li>
                )}
                {stats.recentPullRequests.map((pr) => (
                  <li key={pr.url}>
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="paper-glow block rounded-2xl border border-[rgba(131,108,74,.1)] px-4 py-3 transition hover:bg-white/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="line-clamp-1 text-sm font-semibold text-[#2a241c]">{pr.title}</p>
                        <span className="shrink-0 rounded-full bg-[#d7aa61]/20 px-2 py-0.5 text-[10px] font-medium text-[#8a5f26]">
                          {PR_STATE_LABEL[pr.state] ?? pr.state}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#8a7c69]">
                        {pr.repo} · {formatRelativeTime(pr.date)}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </>
      )}
    </div>
  );
}
