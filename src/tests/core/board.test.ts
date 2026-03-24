import { describe, expect, it } from 'vitest';
import {
  applyMove,
  boardFromHumanMoves,
  bitForCell,
  boardToColumns,
  boardToRows,
  createBoard,
  firstWinningLine,
  isWinBitboard,
  legalMoves,
  moveHistoryKey,
  orderedLegalMoves,
  type BoardState,
  winningLinesFor,
  bitCount,
  boardOutcome,
} from '../../core';
import { parseMoveSequence, formatMoveSequence, mirroredHistoryKey } from '../../core/notation';
import { WIN_LINES } from '../../core/lines';

function boardWithHumanBits(bits: bigint): BoardState {
  return {
    human: bits,
    cpu: 0n,
    turn: 'human',
    moves: [],
    winner: null,
    isDraw: false,
  };
}

describe('board notation and legal moves', () => {
  it('parses and formats 1-based move lists', () => {
    const moves = parseMoveSequence('4, 4, 3');
    expect(moves).toEqual([3, 3, 2]);
    expect(formatMoveSequence(moves)).toBe('4-4-3');
    expect(moveHistoryKey(moves, 'human')).toBe('human:4,4,3');
    expect(mirroredHistoryKey(moves, 'human')).toBe('human:4,4,5');
  });

  it('applies moves with gravity and exposes rows and columns', () => {
    let board = createBoard();
    board = applyMove(board, 3);
    board = applyMove(board, 2);
    board = applyMove(board, 3);

    expect(board.moves).toEqual([3, 2, 3]);
    expect(board.turn).toBe('cpu');
    expect(legalMoves(board)).toHaveLength(7);
    expect(orderedLegalMoves(board)[0]).toBe(3);
    expect(boardToColumns(board)[3].slice(0, 2)).toEqual(['human', 'human']);
    expect(boardToRows(board)[5][3]).toBe('human');
  });

  it('fills a column until it becomes illegal', () => {
    let board = createBoard();
    for (let index = 0; index < 6; index += 1) {
      board = applyMove(board, 0);
    }
    expect(legalMoves(board)).not.toContain(0);
    expect(bitCount(board.human | board.cpu)).toBe(6);
  });
});

describe('exhaustive win detection', () => {
  it('detects every four-in-a-row line', () => {
    expect(WIN_LINES).toHaveLength(69);

    for (const line of WIN_LINES) {
      const bits = line.cells.reduce((accumulator, cell) => accumulator | bitForCell(cell.col, cell.row), 0n);
      const board = boardWithHumanBits(bits);
      expect(isWinBitboard(board.human)).toBe(true);
      expect(winningLinesFor(board, 'human')).not.toHaveLength(0);
      expect(firstWinningLine(board, 'human')).not.toBeNull();
    }
  });
});

describe('board helpers', () => {
  it('builds boards from authored 1-based move lists', () => {
    const board = boardFromHumanMoves([4, 4, 3]);
    expect(board.moves).toEqual([3, 3, 2]);
    expect(board.turn).toBe('cpu');
    expect(boardOutcome(board)).toBe('playing');
  });
});
