"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts smoothly to a new value when it changes (not on first render), so a
 * new job visibly lands in the totals. Jumps straight there when the person
 * prefers reduced motion.
 */
export function useAnimatedNumber(target: number, duration = 520) {
  const [shown, setShown] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    const from = current.current;
    if (from === target) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const began = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const progress = reduce ? 1 : Math.min(1, (now - began) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const value = progress === 1 ? target : from + (target - from) * eased;
      current.current = value;
      setShown(value);
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return shown;
}
