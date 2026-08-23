import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type ContributionsCollection = { totalCommitContributions: number; totalPullRequestContributions?: number };
type GithubGraphqlResponse = {
  data?: {
    user?: {
      week: ContributionsCollection;
      month: ContributionsCollection;
      year: ContributionsCollection;
    };
  };
  errors?: { message: string }[];
};

type GithubCommitSearchItem = {
  sha: string;
  html_url: string;
  commit: { message: string; committer: { date: string } };
  repository: { full_name: string };
};
type GithubCommitSearchResponse = { items?: GithubCommitSearchItem[] };

type GithubIssueSearchItem = {
  title: string;
  html_url: string;
  state: string;
  updated_at: string;
  repository_url: string;
};
type GithubIssueSearchResponse = { items?: GithubIssueSearchItem[] };

function startOfWeekUTC(now: Date) {
  const day = now.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday));
}

function repoNameFromUrl(repositoryUrl: string) {
  return repositoryUrl.replace('https://api.github.com/repos/', '');
}

const QUERY = `
  query($login: String!, $weekFrom: DateTime!, $monthFrom: DateTime!, $yearFrom: DateTime!, $now: DateTime!) {
    user(login: $login) {
      week: contributionsCollection(from: $weekFrom, to: $now) { totalCommitContributions }
      month: contributionsCollection(from: $monthFrom, to: $now) { totalCommitContributions }
      year: contributionsCollection(from: $yearFrom, to: $now) { totalCommitContributions totalPullRequestContributions }
    }
  }
`;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;

  if (!token || !username) {
    return NextResponse.json({ error: 'github_not_configured' }, { status: 500 });
  }

  const authHeaders = {
    Authorization: `bearer ${token}`,
    Accept: 'application/vnd.github+json',
  };

  const now = new Date();
  const variables = {
    login: username,
    weekFrom: startOfWeekUTC(now).toISOString(),
    monthFrom: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
    yearFrom: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString(),
    now: now.toISOString(),
  };

  // 이벤트 피드(payload.commits / payload.pull_request)는 GitHub가 더 이상 상세 필드를
  // 채워주지 않아, 커밋/PR 검색 API로 직접 조회한다 — 중복 없이 완전한 데이터를 준다.
  const [graphqlRes, commitsRes, pullRequestsRes] = await Promise.all([
    fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables }),
      next: { revalidate: 120 },
    }),
    fetch(`https://api.github.com/search/commits?q=author:${username}&sort=committer-date&order=desc&per_page=5`, {
      headers: authHeaders,
      next: { revalidate: 120 },
    }),
    fetch(`https://api.github.com/search/issues?q=author:${username}+type:pr&sort=updated&order=desc&per_page=5`, {
      headers: authHeaders,
      next: { revalidate: 120 },
    }),
  ]);

  if (!graphqlRes.ok) {
    return NextResponse.json({ error: 'github_graphql_failed' }, { status: 502 });
  }

  const graphqlJson: GithubGraphqlResponse = await graphqlRes.json();
  const collections = graphqlJson.data?.user;
  if (!collections) {
    return NextResponse.json({ error: 'github_user_not_found' }, { status: 404 });
  }

  const commitsJson: GithubCommitSearchResponse = commitsRes.ok ? await commitsRes.json() : {};
  const recentCommits = (commitsJson.items ?? []).map((item) => ({
    repo: item.repository.full_name,
    message: item.commit.message.split('\n')[0],
    url: item.html_url,
    date: item.commit.committer.date,
  }));

  const issuesJson: GithubIssueSearchResponse = pullRequestsRes.ok ? await pullRequestsRes.json() : {};
  const recentPullRequests = (issuesJson.items ?? []).map((item) => ({
    repo: repoNameFromUrl(item.repository_url),
    title: item.title,
    url: item.html_url,
    date: item.updated_at,
    state: item.state,
  }));

  return NextResponse.json({
    commits: {
      week: collections.week.totalCommitContributions,
      month: collections.month.totalCommitContributions,
      year: collections.year.totalCommitContributions,
    },
    pullRequestsThisYear: collections.year.totalPullRequestContributions ?? 0,
    recentCommits,
    recentPullRequests,
  });
}
