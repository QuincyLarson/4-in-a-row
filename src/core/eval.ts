import { ADJACENT_COLUMNS, CENTER_COLUMN, COLS, MATE_SCORE, ROWS } from './constants';
import { WIN_LINES } from './lines';
import {
  applyMove,
  bitCount,
  boardOutcome,
  cellOwner,
  legalMoves,
  opponent,
  winnerFor,
} from './board';
import type { AIProfile } from './types';
import type { BoardState, Side } from './types';

export function countImmediateWins(board: BoardState, side: Side): number {
  let count = 0;
  for (const column of legalMoves(board)) {
    const moved = applyMove({ ...board, turn: side }, column);
    if (moved.winner === side) {
      count += 1;
    }
  }
  return count;
}

export function findWinningMoves(board: BoardState, side: Side): number[] {
  const moves: number[] = [];
  for (const column of legalMoves(board)) {
    const next = applyMove({ ...board, turn: side }, column);
    if (next.winner === side) {
      moves.push(column);
    }
  }
  return moves;
}

export function countDoubleThreats(board: BoardState, side: Side): number {
  let count = 0;
  for (const column of legalMoves(board)) {
    const next = applyMove({ ...board, turn: side }, column);
    if (next.winner === side) {
      continue;
    }
    const replyWins = findWinningMoves(next, opponent(side));
    if (replyWins.length >= 2) {
      count += 1;
    }
  }
  return count;
}

export function evaluateBoard(board: BoardState, profile: AIProfile, perspective: Side = board.turn): number {
  const outcome = boardOutcome(board);
  if (outcome === 'draw') {
    return 0;
  }
  if (outcome === 'human' || outcome === 'cpu') {
    return outcome === perspective ? MATE_SCORE : -MATE_SCORE;
  }

  const us = perspective === 'human' ? board.human : board.cpu;
  const them = perspective === 'human' ? board.cpu : board.human;

  let score = 0;
  score += evaluateCenterControl(board, perspective, profile.centerWeight);
  score += evaluateSegments(board, perspective, profile);
  score += evaluateThreats(board, perspective, profile);
  score += evaluateParity(board, perspective, profile);
  score += evaluateImmediatePressure(board, perspective, profile);

  const mobility = legalMoves(board).length;
  score += mobility * 2;
  score += bitCount(us) - bitCount(them);

  return score;
}

function evaluateCenterControl(board: BoardState, perspective: Side, weight: number): number {
  const us = perspective === 'human' ? board.human : board.cpu;
  const them = perspective === 'human' ? board.cpu : board.human;

  let score = 0;
  for (let row = 0; row < ROWS; row += 1) {
    const bit = 1n << BigInt(CENTER_COLUMN * 7 + row);
    if ((us & bit) !== 0n) {
      score += weight;
    }
    if ((them & bit) !== 0n) {
      score -= weight;
    }
  }

  for (const column of ADJACENT_COLUMNS) {
    for (let row = 0; row < ROWS; row += 1) {
      const bit = 1n << BigInt(column * 7 + row);
      if ((us & bit) !== 0n) {
        score += Math.max(2, Math.floor(weight / 2));
      }
      if ((them & bit) !== 0n) {
        score -= Math.max(2, Math.floor(weight / 2));
      }
    }
  }

  return score;
}

function evaluateSegments(board: BoardState, perspective: Side, profile: AIProfile): number {
  let score = 0;
  for (const line of WIN_LINES) {
    let usCount = 0;
    let themCount = 0;
    let emptyCount = 0;
    let supportedEmpty = false;

    for (const cell of line.cells) {
      const occupant = cellOwner(board, cell.col, cell.row);
      if (occupant === perspective) {
        usCount += 1;
      } else if (occupant === opponent(perspective)) {
        themCount += 1;
      } else {
        emptyCount += 1;
        if (cell.row === 0 || cellOwner(board, cell.col, cell.row - 1) !== null) {
          supportedEmpty = true;
        }
      }
    }

    if (themCount === 0 && usCount > 0) {
      if (usCount === 3 && emptyCount === 1) {
        score += profile.threatWeight;
        if (supportedEmpty) {
          score += Math.floor(profile.doubleThreatWeight / 4);
        }
      } else if (usCount === 2 && emptyCount === 2) {
        score += 4;
      } else if (usCount === 1 && emptyCount === 3) {
        score += 1;
      }
    }

    if (usCount === 0 && themCount > 0) {
      if (themCount === 3 && emptyCount === 1) {
        score -= profile.threatWeight;
        if (supportedEmpty) {
          score -= Math.floor(profile.doubleThreatWeight / 4);
        }
      } else if (themCount === 2 && emptyCount === 2) {
        score -= 4;
      } else if (themCount === 1 && emptyCount === 3) {
        score -= 1;
      }
    }
  }
  return score;
}

function evaluateThreats(board: BoardState, perspective: Side, profile: AIProfile): number {
  const usWins = findWinningMoves(board, perspective).length;
  const themWins = findWinningMoves(board, opponent(perspective)).length;
  const usForks = countDoubleThreats(board, perspective);
  const themForks = countDoubleThreats(board, opponent(perspective));

  return usWins * profile.threatWeight * 2 + usForks * profile.doubleThreatWeight -
    themWins * profile.threatWeight * 2 - themForks * profile.doubleThreatWeight;
}

function evaluateImmediatePressure(board: BoardState, perspective: Side, profile: AIProfile): number {
  const us = perspective === 'human' ? board.human : board.cpu;
  const them = perspective === 'human' ? board.cpu : board.human;
  const opp = opponent(perspective);
  const ourImmediate = findWinningMoves(board, perspective).length;
  const theirImmediate = findWinningMoves(board, opp).length;

  let score = ourImmediate * (profile.threatWeight + 8);
  score -= theirImmediate * (profile.threatWeight + 12);

  const centerOccupancy = bitCount(us & (1n << BigInt(CENTER_COLUMN * 7))) - bitCount(them & (1n << BigInt(CENTER_COLUMN * 7)));
  score += centerOccupancy * 2;
  return score;
}

function evaluateParity(board: BoardState, perspective: Side, profile: AIProfile): number {
  if (profile.parityWeight === 0) {
    return 0;
  }

  let score = 0;
  for (let column = 0; column < COLS; column += 1) {
    const stackHeight = stackHeightAt(board, column);
    const parity = stackHeight % 2;
    if (parity === 0 && perspective === board.turn) {
      score += profile.parityWeight;
    }
    if (parity === 1 && perspective !== board.turn) {
      score += Math.floor(profile.parityWeight / 2);
    }
  }
  return score;
}

function stackHeightAt(board: BoardState, column: number): number {
  let height = 0;
  for (let row = 0; row < ROWS; row += 1) {
    if (cellOwner(board, column, row) !== null) {
      height += 1;
    }
  }
  return height;
}

export function scoreMoveHeuristic(board: BoardState, column: number, profile: AIProfile): number {
  const next = applyMove(board, column);
  if (next.winner === board.turn) {
    return MATE_SCORE - 1;
  }
  if (next.isDraw) {
    return 0;
  }
  return evaluateBoard(next, profile, board.turn);
}

export function classifyScoreDelta(delta: number): 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' {
  if (delta <= 0) {
    return 'best';
  }
  if (delta <= 12) {
    return 'good';
  }
  if (delta <= 40) {
    return 'inaccuracy';
  }
  if (delta <= 90) {
    return 'mistake';
  }
  return 'blunder';
}

export function isForcedLoss(board: BoardState): boolean {
  const win = winnerFor(board);
  return win !== null || board.isDraw;
}
