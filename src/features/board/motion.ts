import { ROWS } from '../../core';

export function getDropDurationMs(rowFromBottom: number, reducedMotion = false) {
  const duration = 380 + (ROWS - rowFromBottom) * 48;
  return reducedMotion ? Math.max(160, Math.round(duration * 0.5)) : duration;
}

export function getDropOffsetPx(rowFromBottom: number) {
  return Math.max(180, 620 - rowFromBottom * 68);
}

export function getImpactDelayMs(rowFromBottom: number, reducedMotion = false) {
  return Math.max(40, getDropDurationMs(rowFromBottom, reducedMotion) - 80);
}
