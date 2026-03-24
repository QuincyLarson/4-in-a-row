import type { BoardState, Side } from './types';
import { boardKey, mirrorMoveList, moveHistoryKey } from './board';

export function parseMoveSequence(value: string): number[] {
  const trimmed = value.trim();
  if (trimmed === '') {
    return [];
  }

  return trimmed
    .split(/[\s,>-]+/)
    .filter(Boolean)
    .map((chunk) => {
      const parsed = Number(chunk);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 7) {
        throw new Error(`Invalid move token: ${chunk}`);
      }
      return parsed - 1;
    });
}

export function formatMoveSequence(moves: number[]): string {
  return moves.map((move) => move + 1).join('-');
}

export function parseHumanMoveSequence(value: string): number[] {
  return parseMoveSequence(value);
}

export function formatHumanMoveSequence(moves: number[]): string {
  return formatMoveSequence(moves);
}

export function boardPositionKey(board: BoardState): string {
  return boardKey(board);
}

export function historyPositionKey(moves: number[], turn: Side = 'human'): string {
  return moveHistoryKey(moves, turn);
}

export function mirroredHistoryKey(moves: number[], turn: Side = 'human'): string {
  return moveHistoryKey(mirrorMoveList(moves), turn);
}

export function humanColumnToIndex(column: number): number {
  if (!Number.isInteger(column) || column < 1 || column > 7) {
    throw new Error(`Invalid human column: ${column}`);
  }
  return column - 1;
}

export function indexToHumanColumn(column: number): number {
  return column + 1;
}

