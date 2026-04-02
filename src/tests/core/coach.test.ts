import { describe, expect, it } from 'vitest';
import { analyzeMove, boardFromMoves, ORACLE_ANALYSIS } from '../../core';

describe('coach analysis', () => {
  it('classifies the best move as best and a missed immediate win as a serious error', () => {
    const board = boardFromMoves([0, 1, 0, 1, 0, 2]);
    const best = analyzeMove(board, 0, ORACLE_ANALYSIS);
    expect(best.quality).toBe('best');
    expect(best.bestMove).toBe(0);
    expect(best.reason).toContain('wins immediately');

    const miss = analyzeMove(board, 6, ORACLE_ANALYSIS);
    expect(miss.bestMove).toBe(0);
    expect(miss.playedMove).toBe(6);
    expect(miss.delta).toBeGreaterThan(0);
    expect(miss.quality).toBe('blunder');
    expect(miss.reason).toContain('immediate win');
  }, 45_000);

  it('treats a missed forced block as a blunder', () => {
    const board = boardFromMoves([1, 0, 2, 0, 6, 0]);

    const best = analyzeMove(board, 0, ORACLE_ANALYSIS);
    expect(['best', 'good']).toContain(best.quality);

    const miss = analyzeMove(board, 3, ORACLE_ANALYSIS);
    expect(miss.bestMove).toBe(0);
    expect(miss.quality).toBe('blunder');
    expect(miss.reason).toContain('still wins immediately');
  }, 45_000);
});
