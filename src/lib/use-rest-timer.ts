import { useCallback, useEffect, useState } from "react";
import * as Haptics from "expo-haptics";

export type RestTimer = {
  remaining: number;
  duration: number;
  running: boolean;
  progress: number;
  start: (seconds?: number) => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  adjust: (delta: number) => void;
};

const DEFAULT_SECONDS = 90;
const MAX_SECONDS = 600;

export function useRestTimer(initial = DEFAULT_SECONDS): RestTimer {
  const [duration, setDuration] = useState(initial);
  const [remaining, setRemaining] = useState(initial);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining > 0 || !running) return;
    setRunning(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, [remaining, running]);

  const start = useCallback((seconds?: number) => {
    const next = seconds ?? (remaining > 0 ? remaining : duration);
    const bounded = Math.max(1, Math.min(MAX_SECONDS, Math.round(next)));
    setDuration(bounded);
    setRemaining(bounded);
    setRunning(true);
  }, [duration, remaining]);

  const pause = useCallback(() => setRunning(false), []);

  const toggle = useCallback(() => {
    if (running) {
      setRunning(false);
    } else {
      start();
    }
  }, [running, start]);

  const reset = useCallback(() => {
    setRunning(false);
    setRemaining(duration);
  }, [duration]);

  const adjust = useCallback((delta: number) => {
    setRemaining((value) => {
      const next = Math.max(0, Math.min(MAX_SECONDS, value + delta));
      setDuration((current) => Math.max(current, next));
      return next;
    });
  }, []);

  return {
    remaining,
    duration,
    running,
    progress: duration > 0 ? remaining / duration : 0,
    start,
    pause,
    toggle,
    reset,
    adjust,
  };
}
