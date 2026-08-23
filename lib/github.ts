'use client';

export type GithubStats = {
  commits: { week: number; month: number; year: number };
  pullRequestsThisYear: number;
  recentCommits: { repo: string; message: string; url: string; date: string }[];
  recentPullRequests: { repo: string; title: string; url: string; date: string; state: string }[];
};

export async function getGithubStats(): Promise<GithubStats> {
  const res = await fetch('/api/github/stats');
  if (!res.ok) throw new Error('GitHub 통계를 불러오지 못했습니다.');
  return res.json();
}
