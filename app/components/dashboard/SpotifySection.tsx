'use client';

import { useEffect, useState } from 'react';
import { getSpotifyData, SpotifyData } from '@/lib/spotify';
import { formatRelativeTime } from '@/lib/relativeTime';

export default function SpotifySection() {
  const [data, setData] = useState<SpotifyData | null>(null);

  useEffect(() => {
    getSpotifyData()
      .then(setData)
      .catch(() => setData({ connected: false }));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8a7c69]">Spotify</h2>
        <p className="mt-1 text-sm text-[#5e5245]">요즘 듣고 있는 음악이에요.</p>
      </div>

      {!data && (
        <p className="paper-panel rounded-3xl px-6 py-5 text-sm text-[#8a7c69]">불러오는 중…</p>
      )}

      {data && !data.connected && (
        <div className="paper-panel flex flex-col items-center gap-4 rounded-3xl px-6 py-10 text-center">
          <p className="text-sm text-[#5e5245]">Spotify 계정을 연결하면 최근 재생 목록이 여기에 표시됩니다.</p>
          <a
            href="/api/spotify/authorize"
            className="inline-flex items-center justify-center rounded-full bg-[#2a241c] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#3f3628]"
          >
            Spotify 연결하기
          </a>
        </div>
      )}

      {data && data.connected && (
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="paper-panel rounded-3xl p-6">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8a7c69]">최근 재생</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {data.recentlyPlayed.length === 0 && (
                <li className="text-sm text-[#8a7c69]">최근 재생 기록이 없습니다.</li>
              )}
              {data.recentlyPlayed.map((track) => (
                <li key={track.id}>
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noreferrer"
                    className="paper-glow flex items-center gap-3 rounded-2xl border border-[rgba(131,108,74,.1)] px-3 py-2.5 transition hover:bg-white/50"
                  >
                    {track.image ? (
                      <img src={track.image} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="h-10 w-10 shrink-0 rounded-xl bg-[#d7aa61]/20" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#2a241c]">{track.name}</span>
                      <span className="block truncate text-xs text-[#8a7c69]">{track.artist}</span>
                    </span>
                    <span className="shrink-0 text-[10px] text-[#8a7c69]">{formatRelativeTime(track.playedAt)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </article>

          <article className="paper-panel rounded-3xl p-6">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8a7c69]">최근 많이 들은 트랙</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {data.topTracks.length === 0 && (
                <li className="text-sm text-[#8a7c69]">아직 집계된 데이터가 없습니다.</li>
              )}
              {data.topTracks.map((track, index) => (
                <li key={track.id}>
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noreferrer"
                    className="paper-glow flex items-center gap-3 rounded-2xl border border-[rgba(131,108,74,.1)] px-3 py-2.5 transition hover:bg-white/50"
                  >
                    <span className="serif w-5 shrink-0 text-center text-lg text-[#bc8750]">{index + 1}</span>
                    {track.image ? (
                      <img src={track.image} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="h-10 w-10 shrink-0 rounded-xl bg-[#d7aa61]/20" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#2a241c]">{track.name}</span>
                      <span className="block truncate text-xs text-[#8a7c69]">{track.artist}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </article>
        </div>
      )}
    </div>
  );
}
