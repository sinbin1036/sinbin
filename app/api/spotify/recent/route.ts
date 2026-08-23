import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getValidSpotifyAccessToken } from '@/lib/server/spotifyTokens';

type SpotifyImage = { url: string };
type SpotifyArtist = { name: string };
type SpotifyTrack = {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album?: { images?: SpotifyImage[] };
  external_urls?: { spotify?: string };
};
type SpotifyRecentlyPlayedItem = { track: SpotifyTrack; played_at: string };
type SpotifyRecentlyPlayedResponse = { items?: SpotifyRecentlyPlayedItem[] };
type SpotifyTopTracksResponse = { items?: SpotifyTrack[] };

function pickImage(track: SpotifyTrack) {
  const images = track.album?.images ?? [];
  return images[2]?.url ?? images[0]?.url ?? '';
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ connected: false });

  const accessToken = await getValidSpotifyAccessToken(supabase, user.id);
  if (!accessToken) return NextResponse.json({ connected: false });

  const [recentRes, topRes] = await Promise.all([
    fetch('https://api.spotify.com/v1/me/player/recently-played?limit=8', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }),
    fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }),
  ]);

  if (!recentRes.ok || !topRes.ok) {
    return NextResponse.json({ connected: true, recentlyPlayed: [], topTracks: [] });
  }

  const recentJson: SpotifyRecentlyPlayedResponse = await recentRes.json();
  const topJson: SpotifyTopTracksResponse = await topRes.json();

  const recentlyPlayed = (recentJson.items ?? []).map((item) => ({
    id: `${item.track.id}-${item.played_at}`,
    name: item.track.name,
    artist: item.track.artists.map((a) => a.name).join(', '),
    image: pickImage(item.track),
    url: item.track.external_urls?.spotify ?? '',
    playedAt: item.played_at,
  }));

  const topTracks = (topJson.items ?? []).map((track) => ({
    id: track.id,
    name: track.name,
    artist: track.artists.map((a) => a.name).join(', '),
    image: pickImage(track),
    url: track.external_urls?.spotify ?? '',
  }));

  return NextResponse.json({ connected: true, recentlyPlayed, topTracks });
}
