'use client';

import { useEffect, useRef, useState } from 'react';

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let raf = 0;
    const update = () => {
      const max = window.innerHeight * 1.15;
      const progress = Math.min(Math.max(window.scrollY / max, 0), 1);
      const scale = 1.08 + progress * 0.15;
      const translateY = progress * 14;
      video.style.transform = `scale(${scale}) translateY(${translateY}px)`;
    };

    update();
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        update();
        raf = 0;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
    };
  }, []);

  if (errored) {
    return (
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          background:
            'radial-gradient(circle at 30% 20%, rgba(215,170,97,.35), transparent 45%), radial-gradient(circle at 70% 60%, rgba(86,120,168,.3), transparent 45%), linear-gradient(180deg, #3f587e 0%, #293754 100%)',
        }}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      onError={() => setErrored(true)}
      className="absolute inset-0 h-full w-full object-cover brightness-90 contrast-105 saturate-105"
      style={{ transform: 'scale(1.08)' }}
    >
      <source src="/bf.mp4" type="video/mp4" />
    </video>
  );
}
