import { MATE_SCORE } from './constants';
import {
  applyMove,
  boardKey,
  boardOutcome,
  cellOwner,
  getDropRow,
  legalMoves,
  opponent,
  orderedLegalMoves,
} from './board';
import { AI_PROFILES, ORACLE_ANALYSIS, getAIProfile } from './aiProfiles';
import {
  classifyScoreDelta,
  evaluateBoard,
  findWinningMoves,
  scoreMoveHeuristic,
} from './eval';
import { lookupOpeningBook } from './openingBook';
import type { AIProfile, MoveAnalysis, MoveQuality, SearchResult } from './types';
import type { BoardState, Side } from './types';

type TTFlag = 'exact' | 'lower' | 'upper';

interface TTEntry {
  depth: number;
  score: number;
  flag: TTFlag;
  column: number | null;
}

const TRANSPOSITION_TABLE = new Map<string, TTEntry>();

interface SearchBudget {
  nodes: number;
  limit: number;
}

export interface SearchOptions {
  deadlineMs?: number;
  now?: () => number;
  resetTranspositionTable?: boolean;
}

export interface BattleMoveResult extends SearchResult {
  profile: AIProfile;
  source: 'tactical' | 'book' | 'transposition' | 'search' | 'fallback';
}

function timeExpired(deadlineMs: number | undefined, now: () => number): boolean {
  return typeof deadlineMs === 'number' && now() >= deadlineMs;
}

export function resolveAIProfile(profileOrId: number | AIProfile): AIProfile {
  return typeof profileOrId === 'number' ? getAIProfile(profileOrId) : profileOrId;
}

export function chooseBattleMove(
  board: BoardState,
  profileOrId: number | AIProfile,
  options: SearchOptions = {},
): BattleMoveResult {
  const profile = resolveAIProfile(profileOrId);
  const now = options.now ?? (() => Date.now());
  const deadlineMs = options.deadlineMs;

  if (options.resetTranspositionTable) {
    TRANSPOSITION_TABLE.clear();
  }

  const outcome = boardOutcome(board);
  if (outcome !== 'playing') {
    return {
      profile,
      source: 'fallback',
      column: null,
      score: 0,
      depth: 0,
      nodes: 0,
      completed: true,
      principalVariation: [],
    };
  }

  const tactical = tacticalPrecheck(board, profile);
  if (tactical.column !== null) {
    return tactical;
  }

  const rootKey = transpositionKey(profile, board);
  const rootHit = TRANSPOSITION_TABLE.get(rootKey);
  if (rootHit && rootHit.depth >= profile.depth && rootHit.column !== null) {
    return {
      profile,
      source: 'transposition',
      column: rootHit.column,
      score: rootHit.score,
      depth: rootHit.depth,
      nodes: 0,
      completed: true,
      principalVariation: [rootHit.column],
    };
  }

  if (profile.useOpeningBook) {
    const bookHit = lookupOpeningBook(board);
    if (bookHit) {
      return {
        profile,
        source: 'book',
        column: bookHit.column,
        score: 0,
        depth: 1,
        nodes: 0,
        completed: true,
        principalVariation: [bookHit.column],
      };
    }
  }

  const searchResult = profile.iterativeDeepening
    ? iterativeDeepeningSearch(board, profile, { deadlineMs, now })
    : searchRoot(board, profile, profile.depth, { deadlineMs, now }, { nodes: 0, limit: profile.searchNodeLimit });

  if (searchResult.column !== null) {
    return {
      profile,
      source: searchResult.completed ? 'search' : 'fallback',
      ...searchResult,
    };
  }

  return fallbackMove(board, profile);
}

export function tacticalPrecheck(board: BoardState, profile: AIProfile): BattleMoveResult {
  const legal = orderedLegalMoves(board);
  const winning = findWinningMoves(board, board.turn);
  if (winning.length > 0) {
    const column = chooseBestMoveFromSet(board, winning, profile);
    return {
      profile,
      source: 'tactical',
      column,
      score: MATE_SCORE - 1,
      depth: 0,
      nodes: 0,
      completed: true,
      principalVariation: [column],
    };
  }

  const opponentSide: Side = board.turn === 'human' ? 'cpu' : 'human';
  const blocks = findWinningMoves(board, opponentSide);
  if (blocks.length > 0) {
    const column = chooseBestMoveFromSet(board, blocks, profile);
    return {
      profile,
      source: 'tactical',
      column,
      score: Math.max(1000, profile.threatWeight),
      depth: 0,
      nodes: 0,
      completed: true,
      principalVariation: [column],
    };
  }

  const openingContest = findOpeningContestMove(board, profile, opponentSide);
  if (openingContest !== null) {
    return {
      profile,
      source: 'tactical',
      column: openingContest,
      score: Math.max(24, Math.floor(profile.threatWeight / 2)),
      depth: 0,
      nodes: 0,
      completed: true,
      principalVariation: [openingContest],
    };
  }

  if (legal.length === 0) {
    return {
      profile,
      source: 'fallback',
      column: null,
      score: 0,
      depth: 0,
      nodes: 0,
      completed: true,
      principalVariation: [],
    };
  }

  return {
    profile,
    source: 'fallback',
    column: null,
    score: 0,
    depth: 0,
    nodes: 0,
    completed: false,
    principalVariation: [],
  };
}

function findOpeningContestMove(
  board: BoardState,
  profile: AIProfile,
  opponentSide: Side,
): number | null {
  if (board.moves.length > 6) {
    return null;
  }

  if (board.moves.length === 1 && cellOwner(board, 3, 0) === opponentSide) {
    const adjacentCenter = [2, 4].filter((column) => getDropRow(board, column) === 0);
    if (adjacentCenter.length > 0) {
      return chooseBestMoveFromSet(board, adjacentCenter, profile);
    }
  }

  const candidates = findBottomRunContestColumns(board, opponentSide);
  if (candidates.length === 0) {
    return null;
  }

  return chooseBestMoveFromSet(board, candidates, profile);
}

function findBottomRunContestColumns(board: BoardState, side: Side): number[] {
  let bestRunLength = 0;
  const candidates = new Set<number>();

  for (let start = 0; start < 7; start += 1) {
    if (cellOwner(board, start, 0) !== side) {
      continue;
    }

    let end = start;
    while (end + 1 < 7 && cellOwner(board, end + 1, 0) === side) {
      end += 1;
    }

    const runLength = end - start + 1;
    if (runLength >= 2) {
      const runCandidates = [start - 1, end + 1].filter(
        (column) => column >= 0 && column < 7 && getDropRow(board, column) === 0,
      );
      if (runCandidates.length > 0) {
        if (runLength > bestRunLength) {
          bestRunLength = runLength;
          candidates.clear();
        }
        if (runLength === bestRunLength) {
          for (const column of runCandidates) {
            candidates.add(column);
          }
        }
      }
    }

    start = end;
  }

  return Array.from(candidates);
}

function chooseBestMoveFromSet(board: BoardState, candidates: number[], profile: AIProfile): number {
  let bestColumn = candidates[0];
  let bestScore = -Infinity;
  for (const column of orderedLegalMoves(board)) {
    if (!candidates.includes(column)) {
      continue;
    }
    const score = scoreMoveHeuristic(board, column, profile);
    if (score > bestScore || (score === bestScore && centerPreference(column) < centerPreference(bestColumn))) {
      bestColumn = column;
      bestScore = score;
    }
  }
  return bestColumn;
}

function iterativeDeepeningSearch(
  board: BoardState,
  profile: AIProfile,
  options: SearchOptions,
): SearchResult {
  const budget: SearchBudget = { nodes: 0, limit: profile.searchNodeLimit };
  let best: SearchResult = {
    column: null,
    score: -Infinity,
    depth: 0,
    nodes: 0,
    completed: false,
    principalVariation: [],
  };

  const now = options.now ?? (() => Date.now());
  const deadlineMs = options.deadlineMs;
  for (let depth = 1; depth <= profile.depth; depth += 1) {
    if (timeExpired(deadlineMs, now)) {
      break;
    }
    const result = searchRoot(board, profile, depth, options, budget);
    if (
      result.column !== null &&
      (
        (result.completed && (!best.completed || result.depth >= best.depth)) ||
        (best.column === null && !result.completed) ||
        (!result.completed && !best.completed && result.depth >= best.depth)
      )
    ) {
      best = result;
    }
    if (result.completed && Math.abs(result.score) >= MATE_SCORE - 100) {
      break;
    }
  }

  if (best.column === null) {
    return fallbackSearch(board, profile);
  }

  return best;
}

function searchRoot(
  board: BoardState,
  profile: AIProfile,
  depth: number,
  options: SearchOptions,
  budget: SearchBudget,
): SearchResult {
  const now = options.now ?? (() => Date.now());
  const deadlineMs = options.deadlineMs;
  const perspective = board.turn;
  const moves = orderedLegalMoves(board);
  let bestColumn: number | null = null;
  let bestScore = -Infinity;
  let bestPv: number[] = [];
  let nodes = 0;
  let completed = true;

  const key = transpositionKey(profile, board);
  const ttHit = TRANSPOSITION_TABLE.get(key);
  if (ttHit && ttHit.depth >= depth && ttHit.column !== null) {
    return {
      column: ttHit.column,
      score: ttHit.score,
      depth,
      nodes: 0,
      completed: true,
      principalVariation: [ttHit.column],
    };
  }

  for (const column of moves) {
    if (budget.nodes >= budget.limit) {
      completed = false;
      break;
    }
    if (timeExpired(deadlineMs, now)) {
      completed = false;
      break;
    }
    const child = applyMove(board, column);
    budget.nodes += 1;
    const result = negamax(child, depth - 1, -MATE_SCORE, MATE_SCORE, profile, perspective, options, 1, budget);
    nodes += result.nodes + 1;
    const score = -result.score;
    if (score > bestScore || (score === bestScore && bestColumn !== null && centerPreference(column) < centerPreference(bestColumn))) {
      bestScore = score;
      bestColumn = column;
      bestPv = [column, ...result.principalVariation];
    }
  }

  if (bestColumn === null) {
    return fallbackSearch(board, profile);
  }

  TRANSPOSITION_TABLE.set(key, {
    depth,
    score: bestScore,
    flag: 'exact',
    column: bestColumn,
  });

  return {
    column: bestColumn,
    score: bestScore,
    depth,
    nodes,
    completed,
    principalVariation: bestPv,
  };
}

function negamax(
  board: BoardState,
  depth: number,
  alpha: number,
  beta: number,
  profile: AIProfile,
  perspective: Side,
  options: SearchOptions,
  plyFromRoot: number,
  budget: SearchBudget,
): SearchResult {
  const now = options.now ?? (() => Date.now());
  const deadlineMs = options.deadlineMs;
  const key = transpositionKey(profile, board);
  let nodes = 1;

  if (budget.nodes >= budget.limit) {
    return {
      column: null,
      score: evaluateBoard(board, profile, perspective),
      depth,
      nodes,
      completed: false,
      principalVariation: [],
    };
  }

  if (timeExpired(deadlineMs, now)) {
    return {
      column: null,
      score: evaluateBoard(board, profile, perspective),
      depth,
      nodes,
      completed: false,
      principalVariation: [],
    };
  }

  if (board.winner !== null) {
    return {
      column: null,
      score: -MATE_SCORE + plyFromRoot,
      depth,
      nodes,
      completed: true,
      principalVariation: [],
    };
  }

  if (board.isDraw) {
    return {
      column: null,
      score: 0,
      depth,
      nodes,
      completed: true,
      principalVariation: [],
    };
  }

  if (depth <= 0) {
    return {
      column: null,
      score: evaluateBoard(board, profile, perspective),
      depth,
      nodes,
      completed: true,
      principalVariation: [],
    };
  }

  const ttHit = TRANSPOSITION_TABLE.get(key);
  if (ttHit && ttHit.depth >= depth) {
    if (ttHit.flag === 'exact') {
      return {
        column: ttHit.column,
        score: ttHit.score,
        depth,
        nodes,
        completed: true,
        principalVariation: ttHit.column === null ? [] : [ttHit.column],
      };
    }
    if (ttHit.flag === 'lower' && ttHit.score >= beta) {
      return {
        column: ttHit.column,
        score: ttHit.score,
        depth,
        nodes,
        completed: true,
        principalVariation: ttHit.column === null ? [] : [ttHit.column],
      };
    }
    if (ttHit.flag === 'upper' && ttHit.score <= alpha) {
      return {
        column: ttHit.column,
        score: ttHit.score,
        depth,
        nodes,
        completed: true,
        principalVariation: ttHit.column === null ? [] : [ttHit.column],
      };
    }
  }

  let bestScore = -Infinity;
  let bestColumn: number | null = null;
  let bestPv: number[] = [];
  let currentAlpha = alpha;
  const originalAlpha = alpha;
  const moves = orderedLegalMoves(board);

  for (const column of moves) {
    if (budget.nodes >= budget.limit) {
      return {
        column: bestColumn,
        score: bestScore === -Infinity ? evaluateBoard(board, profile, perspective) : bestScore,
        depth,
        nodes,
        completed: false,
        principalVariation: bestPv,
      };
    }
    if (timeExpired(deadlineMs, now)) {
      return {
        column: bestColumn,
        score: bestScore === -Infinity ? evaluateBoard(board, profile, perspective) : bestScore,
        depth,
        nodes,
        completed: false,
        principalVariation: bestPv,
      };
    }

    const child = applyMove(board, column);
    budget.nodes += 1;
    const result = negamax(child, depth - 1, -beta, -currentAlpha, profile, perspective, options, plyFromRoot + 1, budget);
    nodes += result.nodes;
    const score = -result.score;
    if (score > bestScore || (score === bestScore && bestColumn !== null && centerPreference(column) < centerPreference(bestColumn))) {
      bestScore = score;
      bestColumn = column;
      bestPv = [column, ...result.principalVariation];
    }
    if (score > currentAlpha) {
      currentAlpha = score;
    }
    if (currentAlpha >= beta) {
      break;
    }
  }

  if (bestColumn === null) {
    return {
      column: null,
      score: evaluateBoard(board, profile, perspective),
      depth,
      nodes,
      completed: false,
      principalVariation: [],
    };
  }

  const flag: 'exact' | 'lower' | 'upper' =
    bestScore <= originalAlpha ? 'upper' : bestScore >= beta ? 'lower' : 'exact';

  TRANSPOSITION_TABLE.set(key, {
    depth,
    score: bestScore,
    flag,
    column: bestColumn,
  });

  return {
    column: bestColumn,
    score: bestScore,
    depth,
    nodes,
    completed: true,
    principalVariation: bestPv,
  };
}

function centerPreference(column: number): number {
  return Math.abs(column - 3);
}

function transpositionKey(profile: AIProfile, board: BoardState): string {
  return `${profile.id}|${boardKey(board)}`;
}

function fallbackSearch(board: BoardState, profile: AIProfile): SearchResult {
  const moves = legalMoves(board);
  if (moves.length === 0) {
    return {
      column: null,
      score: 0,
      depth: 0,
      nodes: 0,
      completed: true,
      principalVariation: [],
    };
  }

  let bestColumn = moves[0];
  let bestScore = -Infinity;
  for (const column of moves) {
    const score = scoreMoveHeuristic(board, column, profile);
    if (score > bestScore || (score === bestScore && centerPreference(column) < centerPreference(bestColumn))) {
      bestScore = score;
      bestColumn = column;
    }
  }

  return {
    column: bestColumn,
    score: bestScore,
    depth: 0,
    nodes: moves.length,
    completed: false,
    principalVariation: [bestColumn],
  };
}

function fallbackMove(board: BoardState, profile: AIProfile): BattleMoveResult {
  const result = fallbackSearch(board, profile);
  return {
    profile,
    source: 'fallback',
    ...result,
  };
}

export function analyzeMove(
  boardBeforeMove: BoardState,
  playedColumn: number,
  profileOrId: number | AIProfile = ORACLE_ANALYSIS,
): MoveAnalysis {
  const profile = analysisProfile(resolveAIProfile(profileOrId));
  if (!legalMoves(boardBeforeMove).includes(playedColumn)) {
    return {
      quality: 'blunder',
      bestMove: null,
      playedMove: playedColumn,
      bestScore: -MATE_SCORE,
      playedScore: -MATE_SCORE,
      delta: MATE_SCORE,
      reason: 'The move was illegal in this position.',
    };
  }

  const bestResult = chooseBattleMove(boardBeforeMove, profile, {
    resetTranspositionTable: false,
  });
  const side = boardBeforeMove.turn;
  const opponentSide = opponent(side);
  const bestMove = bestResult.column;
  const bestScore =
    bestMove === null
      ? bestResult.score
      : scoreAnalyzedMove(boardBeforeMove, bestMove, profile);
  const playedScore =
    bestMove !== null && playedColumn === bestMove
      ? bestScore
      : scoreAnalyzedMove(boardBeforeMove, playedColumn, profile);
  const delta = Math.max(0, bestScore - playedScore);
  const boardAfterMove = applyMove(boardBeforeMove, playedColumn);
  const immediateWinsNow = findWinningMoves(boardBeforeMove, side);
  const forcedBlocksNow =
    immediateWinsNow.length === 0 ? findWinningMoves(boardBeforeMove, opponentSide) : [];
  const opponentWinsAfterMove = findWinningMoves(boardAfterMove, opponentSide);
  const ourWinsAfterMove = boardAfterMove.winner === side ? [] : findWinningMoves(boardAfterMove, side);
  const missedImmediateWin =
    immediateWinsNow.length > 0 && !immediateWinsNow.includes(playedColumn);
  const leftImmediateLoss =
    forcedBlocksNow.length > 0 && opponentWinsAfterMove.length > 0;
  const blockedThreatAndCounterpunched =
    forcedBlocksNow.length > 0 &&
    opponentWinsAfterMove.length === 0 &&
    ourWinsAfterMove.length > 0;
  const cleanForcedBlock =
    forcedBlocksNow.length > 0 &&
    opponentWinsAfterMove.length === 0 &&
    ourWinsAfterMove.length === 0;
  let quality = classifyScoreDelta(delta);

  if (missedImmediateWin || leftImmediateLoss) {
    quality = 'blunder';
  } else if (blockedThreatAndCounterpunched) {
    quality = raiseQualityFloor(quality, 'good');
  }

  const reason = missedImmediateWin
    ? `An immediate win was available in ${formatColumns(immediateWinsNow)}, so passing on it is a major tactical miss.`
    : leftImmediateLoss
      ? opponentWinsAfterMove.length === 1
        ? `The opponent still wins immediately in ${formatColumns(opponentWinsAfterMove)} after this move.`
        : `The opponent still has immediate wins in ${formatColumns(opponentWinsAfterMove)} after this move.`
      : boardAfterMove.winner === side
        ? 'This move wins immediately, so it is the strongest tactical finish on the board.'
        : blockedThreatAndCounterpunched
          ? ourWinsAfterMove.length === 1
            ? `This move blocks the urgent threat and creates a direct winning reply in ${formatColumns(ourWinsAfterMove)}.`
            : `This move blocks the urgent threat and creates multiple winning replies in ${formatColumns(ourWinsAfterMove)}.`
          : cleanForcedBlock
            ? forcedBlocksNow.length === 1
              ? `This move covers the urgent winning square in ${formatColumns(forcedBlocksNow)} and keeps the game alive.`
              : `This move covers the urgent winning squares in ${formatColumns(forcedBlocksNow)} and keeps the game alive.`
          : quality === 'best'
            ? 'This move matches the strongest line the analysis found.'
            : quality === 'good'
              ? 'This move stays close to the best line.'
              : quality === 'inaccuracy'
                ? 'This move gives up some edge, but the position remains manageable.'
                : quality === 'mistake'
                  ? 'This move drops the evaluation in a meaningful way.'
                  : 'This move gives away a major advantage or tactical resource.';

  return {
    quality,
    bestMove,
    playedMove: playedColumn,
    bestScore,
    playedScore,
    delta,
    reason,
  };
}

function raiseQualityFloor(current: MoveQuality, minimum: MoveQuality): MoveQuality {
  const rank: Record<MoveQuality, number> = {
    blunder: 0,
    mistake: 1,
    inaccuracy: 2,
    good: 3,
    best: 4,
  };

  return rank[current] >= rank[minimum] ? current : minimum;
}

function formatColumns(columns: number[]): string {
  return columns.map((column) => String.fromCharCode(65 + column)).join(', ');
}

function analysisProfile(profile: AIProfile): AIProfile {
  return {
    ...profile,
    depth: Math.max(profile.depth, Math.min(profile.analysisDepth, profile.depth + 1)),
    useOpeningBook: false,
  };
}

function scoreAnalyzedMove(
  boardBeforeMove: BoardState,
  column: number,
  profile: AIProfile,
): number {
  const boardAfterMove = applyMove(boardBeforeMove, column);

  if (boardAfterMove.winner === boardBeforeMove.turn) {
    return MATE_SCORE - 1;
  }

  if (boardAfterMove.isDraw) {
    return 0;
  }

  const reply = chooseBattleMove(boardAfterMove, profile, {
    resetTranspositionTable: false,
  });

  return -reply.score;
}

export function getBattleAiProfiles(): readonly AIProfile[] {
  return AI_PROFILES;
}

export function analysisSettings(): AIProfile {
  return ORACLE_ANALYSIS;
}

export function clearTranspositionTable(): void {
  TRANSPOSITION_TABLE.clear();
}
