import { MATE_SCORE } from './constants';
import {
  applyMove,
  boardKey,
  boardOutcome,
  legalMoves,
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
import type { AIProfile, MoveAnalysis, SearchResult } from './types';
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
    if (result.column !== null && (result.score > best.score || !best.completed)) {
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
  const profile = resolveAIProfile(profileOrId);
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
  const bestMove = bestResult.column;
  const bestScore =
    bestMove === null
      ? bestResult.score
      : scoreMoveHeuristic(boardBeforeMove, bestMove, profile);
  const playedScore =
    bestMove !== null && playedColumn === bestMove
      ? bestScore
      : scoreMoveHeuristic(boardBeforeMove, playedColumn, profile);
  const delta = Math.max(0, bestScore - playedScore);
  const quality = classifyScoreDelta(delta);
  const reason =
    quality === 'best'
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

export function getBattleAiProfiles(): readonly AIProfile[] {
  return AI_PROFILES;
}

export function analysisSettings(): AIProfile {
  return ORACLE_ANALYSIS;
}

export function clearTranspositionTable(): void {
  TRANSPOSITION_TABLE.clear();
}
