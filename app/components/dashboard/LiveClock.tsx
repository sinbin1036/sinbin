'use client';

import { useEffect, useState } from 'react';

const formatter = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export default function LiveClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    setTime(formatter.format(new Date()));
    const id = setInterval(() => setTime(formatter.format(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <h1 className="serif text-[clamp(4.5rem,13vw,11rem)] leading-[0.82] tracking-[-.03em] text-white drop-shadow-[0_18px_36px_rgba(0,0,0,.24)]">
      {time ?? '--:--:--'}
    </h1>
  );
}
