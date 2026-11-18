import { useEffect, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

import { LAUNCH_DATE, LAUNCH_ZONES } from '@/data/launch-zones';

/** How often the player counters move. The player curve steps on the same beat. */
export const TICK_MS = 80;

/**
 * Shift applied to the app clock. On web, `?preview=6` runs the page as if it were
 * six hours after the first region's midnight, to watch the counters before launch.
 */
const offsetMs = previewOffset();

function previewOffset() {
  if (typeof window === 'undefined' || !window.location?.search) return 0;
  const hours = Number(new URLSearchParams(window.location.search).get('preview'));
  if (!Number.isFinite(hours) || hours === 0) return 0;
  const { year, month, day } = LAUNCH_DATE;
  const first = Math.min(...LAUNCH_ZONES.map((z) => Date.UTC(year, month - 1, day) - z.offsetMinutes * 60_000));
  return first + hours * 3_600_000 - Date.now();
}

/** The app's notion of "now": the device clock, plus any preview shift. */
export function appNow() {
  return Date.now() + offsetMs;
}

const listeners = new Set<() => void>();
let snapshot = appNow();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    timer = setInterval(() => {
      snapshot = appNow();
      listeners.forEach((l) => l());
    }, TICK_MS);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const read = () => snapshot;

/**
 * A shared fast clock for the counters. One interval for the whole app; only the
 * components that call this re-render on each tick.
 */
export function useFastNow() {
  return useSyncExternalStore(subscribe, read, read);
}

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduce)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}
