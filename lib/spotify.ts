'use client';

export type SpotifyTrack = {
  id: string;
  name: string;
  artist: string;
  image: string;
  url: string;
};

export type SpotifyRecentTrack = SpotifyTrack & { playedAt: string };

export type SpotifyData =
  | { connected: false }
  | { connected: true; recentlyPlayed: SpotifyRecentTrack[]; topTracks: SpotifyTrack[] };

export async function getSpotifyData(): Promise<SpotifyData> {
  const res = await fetch('/api/spotify/recent');
  if (!res.ok) throw new Error('Spotify 데이터를 불러오지 못했습니다.');
  return res.json();
}
