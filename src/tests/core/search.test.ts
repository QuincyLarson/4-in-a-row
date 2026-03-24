import { describe, expect, it } from 'vitest';
import {
  AI_PROFILES,
  applyMove,
  boardFromMoves,
  bitCount,
  createBoard,
  isWinBitboard,
  legalMoves,
  chooseBattleMove,
  tacticalPrecheck,
  lookupOpeningBook,
  clearTranspositionTable,
} from '../../core';

function makeRng(seed = 1): () => number {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

describe('tactical prechecks and opening book', () => {
  it('takes an immediate win before searching', () => {
    const board = boardFromMoves([0, 1, 0, 1, 0]);
    const precheck = tacticalPrecheck(board, AI_PROFILES[1]);
    expect(precheck.column).toBe(0);
    expect(precheck.source).toBe('tactical');
  });

  it('blocks an immediate threat before searching', () => {
    const board = boardFromMoves([1, 0, 2, 0, 6, 0]);
    const precheck = tacticalPrecheck(board, AI_PROFILES[1]);
    expect(precheck.column).toBe(0);
    expect(precheck.source).toBe('tactical');
  });

  it('hits the compact opening book on the empty board', () => {
    const hit = lookupOpeningBook(createBoard());
    expect(hit?.column).toBe(3);
    expect(hit?.mirrored).toBe(false);
  });
});

describe('battle AI', () => {
  it('always returns a legal move on a non-terminal board', () => {
    const board = boardFromMoves([3, 3, 2, 4, 2, 4]);

    for (const profile of AI_PROFILES) {
      const result = chooseBattleMove(board, profile, {
        resetTranspositionTable: true,
        // This test only checks legality, so force the fast fallback/budget path
        // instead of waiting for deep tiers to complete a full search on CI runners.
        deadlineMs: Date.now(),
      });
      if (result.column !== null) {
        expect(legalMoves(board)).toContain(result.column);
      }
    }
  });

  it('survives deterministic random-game simulation without illegal moves or desync', () => {
    const rng = makeRng(42);

    for (let game = 0; game < 10; game += 1) {
      let board = createBoard();
      clearTranspositionTable();

      for (let ply = 0; ply < 42 && !board.winner && !board.isDraw; ply += 1) {
        const legal = legalMoves(board);
        expect(legal.length).toBeGreaterThan(0);

        const move =
          board.turn === 'cpu'
            ? chooseBattleMove(board, AI_PROFILES[2], { resetTranspositionTable: false }).column
            : legal[Math.floor(rng() * legal.length)];

        expect(move).not.toBeNull();
        expect(legal).toContain(move as number);

        board = applyMove(board, move as number);
        expect(bitCount(board.human & board.cpu)).toBe(0);
        expect(bitCount(board.human | board.cpu)).toBe(board.moves.length);

        if (board.winner) {
          expect(isWinBitboard(board.winner === 'human' ? board.human : board.cpu)).toBe(true);
        }
      }

      expect(Boolean(board.winner || board.isDraw || legalMoves(board).length === 0)).toBe(true);
    }
  });
});
