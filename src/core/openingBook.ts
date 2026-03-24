import type { BoardState, Side } from './types';
import { boardOutcome, legalMoves, mirrorColumn } from './board';
import { historyPositionKey, mirroredHistoryKey } from './notation';

const BOOK_ENTRIES = new Map<string, number>([
  ['human:', 3],
  ['cpu:4', 3],
  ['human:4,4', 2],
  ['cpu:4,4', 3],
  ['human:4,4,3', 4],
  ['cpu:4,4,3', 2],
  ['human:4,4,3,5', 3],
  ['cpu:4,4,3,5', 3],
  ['human:4,4,3,5,4', 2],
  ['cpu:4,4,3,5,4', 4],
  ['human:4,3', 3],
  ['cpu:4,3', 4],
  ['human:4,3,4', 2],
  ['cpu:4,3,4', 4],
]);

export interface OpeningBookHit {
  column: number;
  mirrored: boolean;
  key: string;
}

export function openingBookKey(moves: number[], turn: Side): string {
  return historyPositionKey(moves, turn);
}

export function lookupOpeningBook(board: BoardState): OpeningBookHit | null {
  if (boardOutcome(board) !== 'playing') {
    return null;
  }

  const exactKey = openingBookKey(board.moves, board.turn);
  const exact = BOOK_ENTRIES.get(exactKey);
  if (typeof exact === 'number' && legalMoves(board).includes(exact)) {
    return { column: exact, mirrored: false, key: exactKey };
  }

  const mirroredKey = mirroredHistoryKey(board.moves, board.turn);
  const mirrored = BOOK_ENTRIES.get(mirroredKey);
  if (typeof mirrored === 'number') {
    const mirroredColumn = mirrorColumn(mirrored);
    if (legalMoves(board).includes(mirroredColumn)) {
      return { column: mirroredColumn, mirrored: true, key: mirroredKey };
    }
  }

  return null;
}

export function debugOpeningBookPosition(board: BoardState): string {
  const hit = lookupOpeningBook(board);
  return hit ? `${hit.key} -> ${hit.column + 1}` : 'no-book-hit';
}
