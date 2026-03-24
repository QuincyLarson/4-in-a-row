import { describe, expect, it } from 'vitest';
import { analyzeMove, boardFromMoves, ORACLE_ANALYSIS } from '../../core';

describe('coach analysis', () => {
  it('classifies the best move as best and a missed immediate win as a serious error', () => {
    const board = boardFromMoves([0, 1, 0, 1, 0]);
    const best = analyzeMove(board, 0, ORACLE_ANALYSIS);
    expect(best.quality).toBe('best');
    expect(best.bestMove).toBe(0);

    const miss = analyzeMove(board, 6, ORACLE_ANALYSIS);
    expect(miss.bestMove).toBe(0);
    expect(miss.playedMove).toBe(6);
    expect(miss.delta).toBeGreaterThan(0);
    expect(['inaccuracy', 'mistake', 'blunder']).toContain(miss.quality);
  });
});

