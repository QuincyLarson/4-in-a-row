import {
  BOTTOM_MASKS,
  COLUMN_HEIGHT,
  COLUMN_MASKS,
  COLS,
  MATE_SCORE,
  PLAYABLE_CELLS,
  ROWS,
  TOP_MASKS,
} from './constants';
import { WIN_LINES } from './lines';
import type { BoardState, CellCoord, Side, WinningLine } from './types';

export class IllegalMoveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IllegalMoveError';
  }
}

export function opponent(side: Side): Side {
  return side === 'human' ? 'cpu' : 'human';
}

export function createBoard(turn: Side = 'human'): BoardState {
  return {
    human: 0n,
    cpu: 0n,
    turn,
    moves: [],
    winner: null,
    isDraw: false,
  };
}

export function cloneBoard(board: BoardState): BoardState {
  return {
    human: board.human,
    cpu: board.cpu,
    turn: board.turn,
    moves: board.moves.slice(),
    winner: board.winner,
    isDraw: board.isDraw,
  };
}

export function occupancy(board: BoardState): bigint {
  return board.human | board.cpu;
}

export function bitForCell(col: number, row: number): bigint {
  return 1n << BigInt(col * COLUMN_HEIGHT + row);
}

export function cellForBit(bit: bigint): CellCoord | null {
  if (bit === 0n) {
    return null;
  }

  let index = 0;
  let current = bit;
  while ((current & 1n) === 0n) {
    current >>= 1n;
    index += 1;
  }

  const col = Math.floor(index / COLUMN_HEIGHT);
  const row = index % COLUMN_HEIGHT;
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
    return null;
  }
  return { col, row };
}

export function cellOwner(board: BoardState, col: number, row: number): Side | null {
  const bit = bitForCell(col, row);
  if ((board.human & bit) !== 0n) {
    return 'human';
  }
  if ((board.cpu & bit) !== 0n) {
    return 'cpu';
  }
  return null;
}

export function isTerminal(board: BoardState): boolean {
  return board.winner !== null || board.isDraw;
}

export function currentPlayer(board: BoardState): Side {
  return board.turn;
}

export function columnMoveBit(board: BoardState, col: number): bigint | null {
  if (!isColumnPlayable(board, col)) {
    return null;
  }

  return (occupancy(board) + BOTTOM_MASKS[col]) & COLUMN_MASKS[col];
}

export function isColumnPlayable(board: BoardState, col: number): boolean {
  if (isTerminal(board) || col < 0 || col >= COLS) {
    return false;
  }

  return (occupancy(board) & TOP_MASKS[col]) === 0n;
}

export function legalMoves(board: BoardState): number[] {
  if (isTerminal(board)) {
    return [];
  }

  const moves: number[] = [];
  for (let col = 0; col < COLS; col += 1) {
    if (isColumnPlayable(board, col)) {
      moves.push(col);
    }
  }
  return moves;
}

export function orderedLegalMoves(board: BoardState): number[] {
  const legal = new Set(legalMoves(board));
  return Array.from({ length: COLS }, (_, index) => index)
    .sort((left, right) => CENTER_ORDER_DISTANCE(left) - CENTER_ORDER_DISTANCE(right) || left - right)
    .filter((column) => legal.has(column));
}

function CENTER_ORDER_DISTANCE(column: number): number {
  return Math.abs(column - 3);
}

export function getDropRow(board: BoardState, col: number): number | null {
  if (!isColumnPlayable(board, col)) {
    return null;
  }

  let row = 0;
  while (row < ROWS && cellOwner(board, col, row) !== null) {
    row += 1;
  }
  return row < ROWS ? row : null;
}

export function applyMove(board: BoardState, col: number): BoardState {
  if (isTerminal(board)) {
    throw new IllegalMoveError('Cannot move in a finished game.');
  }

  const bit = columnMoveBit(board, col);
  if (bit === null) {
    throw new IllegalMoveError(`Column ${col + 1} is not playable.`);
  }

  const mover = board.turn;
  const human = mover === 'human' ? board.human | bit : board.human;
  const cpu = mover === 'cpu' ? board.cpu | bit : board.cpu;
  const moves = board.moves.concat(col);
  const winner = isWinBitboard(mover === 'human' ? human : cpu) ? mover : null;
  const isDraw = winner === null && moves.length >= PLAYABLE_CELLS;

  return {
    human,
    cpu,
    turn: opponent(mover),
    moves,
    winner,
    isDraw,
  };
}

export function boardFromMoves(moves: number[], startingTurn: Side = 'human'): BoardState {
  let board = createBoard(startingTurn);
  for (const column of moves) {
    board = applyMove(board, column);
  }
  return board;
}

export function boardFromHumanMoves(moves: number[], startingTurn: Side = 'human'): BoardState {
  return boardFromMoves(moves.map((move) => move - 1), startingTurn);
}

export function isWinBitboard(bitboard: bigint): boolean {
  if (bitboard === 0n) {
    return false;
  }

  const vertical = bitboard & (bitboard >> 1n);
  if ((vertical & (vertical >> 2n)) !== 0n) {
    return true;
  }

  const horizontal = bitboard & (bitboard >> 7n);
  if ((horizontal & (horizontal >> 14n)) !== 0n) {
    return true;
  }

  const diagonalUp = bitboard & (bitboard >> 6n);
  if ((diagonalUp & (diagonalUp >> 12n)) !== 0n) {
    return true;
  }

  const diagonalDown = bitboard & (bitboard >> 8n);
  if ((diagonalDown & (diagonalDown >> 16n)) !== 0n) {
    return true;
  }

  return false;
}

export function winnerFor(board: BoardState): Side | null {
  if (board.winner) {
    return board.winner;
  }
  if (isWinBitboard(board.human)) {
    return 'human';
  }
  if (isWinBitboard(board.cpu)) {
    return 'cpu';
  }
  return null;
}

export function boardOutcome(board: BoardState): 'playing' | 'draw' | Side {
  const win = winnerFor(board);
  if (win) {
    return win;
  }
  if (board.isDraw || legalMoves(board).length === 0) {
    return 'draw';
  }
  return 'playing';
}

export function winningLinesFor(board: BoardState, side: Side): WinningLine[] {
  const occupancyBits = side === 'human' ? board.human : board.cpu;
  const lines: WinningLine[] = [];

  for (const cells of WIN_LINES) {
    let matched = true;
    for (const cell of cells.cells) {
      if ((occupancyBits & bitForCell(cell.col, cell.row)) === 0n) {
        matched = false;
        break;
      }
    }
    if (matched) {
      lines.push(cells);
    }
  }

  return lines;
}

export function firstWinningLine(board: BoardState, side: Side): WinningLine | null {
  return winningLinesFor(board, side)[0] ?? null;
}

export function boardToRows(board: BoardState): Array<Array<Side | null>> {
  const rows: Array<Array<Side | null>> = [];
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    const cells: Array<Side | null> = [];
    for (let col = 0; col < COLS; col += 1) {
      cells.push(cellOwner(board, col, row));
    }
    rows.push(cells);
  }
  return rows;
}

export function boardToColumns(board: BoardState): Array<Array<Side | null>> {
  const columns: Array<Array<Side | null>> = [];
  for (let col = 0; col < COLS; col += 1) {
    const column: Array<Side | null> = [];
    for (let row = 0; row < ROWS; row += 1) {
      column.push(cellOwner(board, col, row));
    }
    columns.push(column);
  }
  return columns;
}

export function boardKey(board: BoardState): string {
  return `${board.turn}:${board.human.toString(16)}:${board.cpu.toString(16)}`;
}

export function moveHistoryKey(moves: number[], turn: Side = 'human'): string {
  return `${turn}:${moves.map((move) => move + 1).join(',')}`;
}

export function bitCount(value: bigint): number {
  let count = 0;
  let current = value;
  while (current !== 0n) {
    current &= current - 1n;
    count += 1;
  }
  return count;
}

export function mirrorColumn(column: number): number {
  return COLS - 1 - column;
}

export function mirrorMoveList(moves: number[]): number[] {
  return moves.map(mirrorColumn);
}

export function boardFromKey(key: string): BoardState {
  const [turnLabel, humanLabel, cpuLabel] = key.split(':');
  if (turnLabel !== 'human' && turnLabel !== 'cpu') {
    throw new Error(`Invalid board key: ${key}`);
  }
  const human = BigInt(`0x${humanLabel || '0'}`);
  const cpu = BigInt(`0x${cpuLabel || '0'}`);
  return {
    human,
    cpu,
    turn: turnLabel,
    moves: [],
    winner: null,
    isDraw: false,
  };
}

export function formatBoardSummary(board: BoardState): string {
  const outcome = boardOutcome(board);
  return `${outcome} turn=${board.turn} moves=${board.moves.length}`;
}

export function scoreTerminal(board: BoardState, plyFromRoot = 0): number {
  if (board.winner) {
    return -MATE_SCORE + plyFromRoot;
  }
  if (board.isDraw) {
    return 0;
  }
  return 0;
}
