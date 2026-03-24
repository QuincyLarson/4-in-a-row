export type Side = 'human' | 'cpu';

export type GameOutcome = 'playing' | 'draw' | Side;

export interface BoardState {
  human: bigint;
  cpu: bigint;
  turn: Side;
  moves: number[];
  winner: Side | null;
  isDraw: boolean;
}

export interface CellCoord {
  col: number;
  row: number;
}

export interface WinningLine {
  cells: readonly CellCoord[];
}

export interface SearchResult {
  column: number | null;
  score: number;
  depth: number;
  nodes: number;
  completed: boolean;
  principalVariation: number[];
}

export type MoveQuality = 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

export interface MoveAnalysis {
  quality: MoveQuality;
  bestMove: number | null;
  playedMove: number | null;
  bestScore: number;
  playedScore: number;
  delta: number;
  reason: string;
}

export interface AIProfile {
  id: number;
  name: string;
  depth: number;
  useOpeningBook: boolean;
  iterativeDeepening: boolean;
  searchNodeLimit: number;
  centerWeight: number;
  threatWeight: number;
  doubleThreatWeight: number;
  diagonalWeight: number;
  parityWeight: number;
  fallbackBias: number;
  analysisDepth: number;
}

