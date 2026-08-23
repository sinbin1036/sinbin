import type { SupabaseClient } from '@supabase/supabase-js';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';

type SpotifyTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

function basicAuthHeader() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET 환경 변수가 설정되지 않았습니다.');
  }
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

export async function exchangeSpotifyCode(code: string, redirectUri: string): Promise<SpotifyTokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error('Spotify 토큰 교환에 실패했습니다.');
  return res.json();
}

async function refreshSpotifyToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error('Spotify 토큰 갱신에 실패했습니다.');
  return res.json();
}

export async function getValidSpotifyAccessToken(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: row, error } = await supabase
    .from('spotify_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !row) return null;

  const expiresAt = new Date(row.expires_at as string).getTime();
  if (expiresAt - Date.now() > 30_000) {
    return row.access_token as string;
  }

  const refreshed = await refreshSpotifyToken(row.refresh_token as string);
  const nextExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  await supabase
    .from('spotify_tokens')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? row.refresh_token,
      expires_at: nextExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return refreshed.access_token;
}
