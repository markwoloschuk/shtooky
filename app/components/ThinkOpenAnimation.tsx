'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

const CONFIG = {
  ANIMATION_PATH: '/animations/thinking-open.json',
  LOOP: true,
  MAX_WIDTH: 1440,
};

export default function ThinkOpenAnimation() {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(CONFIG.ANIMATION_PATH)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch((err) => {
        console.error('Failed to load thinking-open animation:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!animationData) return null;

  return (
    <div style={{ width: '100%', maxWidth: CONFIG.MAX_WIDTH, margin: '0 auto' }}>
      <Lottie animationData={animationData} loop={CONFIG.LOOP} autoplay />
    </div>
  );
}