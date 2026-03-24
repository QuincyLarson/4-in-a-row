import { ROWS } from '../../core';

export function getDropDurationMs(rowFromBottom: number, reducedMotion = false) {
  const duration = 260 + (ROWS - rowFromBottom) * 34;
  return reducedMotion ? Math.max(120, Math.round(duration * 0.45)) : duration;
}

export function getDropOffsetPx(rowFromBottom: number) {
  return Math.max(180, 620 - rowFromBottom * 68);
}

export function getImpactDelayMs(rowFromBottom: number, reducedMotion = false) {
  return Math.max(40, getDropDurationMs(rowFromBottom, reducedMotion) - 80);
}
