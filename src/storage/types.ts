export type ColorMode = 'default' | 'pattern';
export type CpuMoveSpeed = 'instant' | 'snappy';
export type GameResult = 'win' | 'loss' | 'draw';

export interface ReviewEntry {
  puzzleId: string;
  conceptTag: string;
  dueAt: string;
  attempts: number;
  correct: number;
  streak: number;
  lastSeen?: string;
}

export interface RecentGame {
  id: string;
  aiId: string;
  result: GameResult;
  finishedAt: string;
  plyCount: number;
}

export interface SaveEnvelopeV1 {
  version: 1;
  profile: {
    createdAt: string;
    displayName?: string;
  };
  settings: {
    soundEnabled: boolean;
    reducedMotion: boolean;
    colorMode: ColorMode;
    cpuMoveSpeed: CpuMoveSpeed;
    highContrast: boolean;
  };
  progress: {
    completedLessonIds: string[];
    lessonStars: Record<string, number>;
    bossWins: string[];
    clearedAiIds: string[];
    worldUnlocks: string[];
    conceptScores: Record<string, number>;
    capstonePassed: boolean;
  };
  review: {
    duePuzzleIds: string[];
    entries: ReviewEntry[];
    lastGeneratedAt?: string;
  };
  history: {
    recentGames: RecentGame[];
  };
}

export type SaveEnvelope = SaveEnvelopeV1;
