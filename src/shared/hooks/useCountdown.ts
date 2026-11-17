import { useCallback, useEffect, useState } from 'react';

export function useCountdown(initialSeconds: number): {
  readonly seconds: number;
  readonly restart: (nextSeconds?: number) => void;
} {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const restart = useCallback(
    (nextSeconds = initialSeconds) => {
      setSeconds(Math.max(0, nextSeconds));
    },
    [initialSeconds],
  );

  return { seconds, restart };
}
