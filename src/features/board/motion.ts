import { ROWS } from '../../core';

export function getDropDurationMs(rowFromBottom: number, reducedMotion = false) {
  const duration = 420 + (ROWS - rowFromBottom) * 54;
  return reducedMotion ? Math.max(160, Math.round(duration * 0.5)) : duration;
}

export function getDropOffsetPx(rowFromBottom: number) {
  return Math.max(180, 620 - rowFromBottom * 68);
}

export function getDropOvershootPx(rowFromBottom: number, reducedMotion = false) {
  if (reducedMotion) {
    return 0;
  }
  return Math.max(4, 10 - rowFromBottom);
}

export function getDropReboundPx(rowFromBottom: number, reducedMotion = false) {
  if (reducedMotion) {
    return 0;
  }
  return Math.max(2, Math.round(getDropOvershootPx(rowFromBottom) * 0.5));
}

export function getImpactDelayMs(rowFromBottom: number, reducedMotion = false) {
  const duration = getDropDurationMs(rowFromBottom, reducedMotion);
  return reducedMotion ? Math.max(40, duration - 24) : Math.max(90, Math.round(duration * 0.9));
}
