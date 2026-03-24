import type { SaveEnvelope, SaveEnvelopeV1 } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function createDefaultSave(now = new Date()): SaveEnvelopeV1 {
  return {
    version: 1,
    profile: {
      createdAt: now.toISOString(),
    },
    settings: {
      soundEnabled: true,
      reducedMotion: false,
      colorMode: 'pattern',
      cpuMoveSpeed: 'snappy',
      highContrast: false,
    },
    progress: {
      completedLessonIds: [],
      lessonStars: {},
      bossWins: [],
      worldUnlocks: ['world-0', 'battle'],
      conceptScores: {},
      capstonePassed: false,
    },
    review: {
      duePuzzleIds: [],
      entries: [],
    },
    history: {
      recentGames: [],
    },
  };
}

export function migrateSaveEnvelope(input: unknown): SaveEnvelope {
  if (!isRecord(input)) {
    return createDefaultSave();
  }

  const version = input.version;
  if (version === 1) {
    return sanitizeV1(input);
  }

  return createDefaultSave();
}

function sanitizeV1(input: Record<string, unknown>): SaveEnvelopeV1 {
  const fallback = createDefaultSave();
  const profile = isRecord(input.profile) ? input.profile : {};
  const settings = isRecord(input.settings) ? input.settings : {};
  const progress = isRecord(input.progress) ? input.progress : {};
  const review = isRecord(input.review) ? input.review : {};
  const history = isRecord(input.history) ? input.history : {};

  return {
    version: 1,
    profile: {
      createdAt:
        typeof profile.createdAt === 'string'
          ? profile.createdAt
          : fallback.profile.createdAt,
      displayName:
        typeof profile.displayName === 'string' ? profile.displayName : undefined,
    },
    settings: {
      soundEnabled:
        typeof settings.soundEnabled === 'boolean'
          ? settings.soundEnabled
          : fallback.settings.soundEnabled,
      reducedMotion:
        typeof settings.reducedMotion === 'boolean'
          ? settings.reducedMotion
          : fallback.settings.reducedMotion,
      colorMode:
        settings.colorMode === 'default' || settings.colorMode === 'pattern'
          ? settings.colorMode
          : fallback.settings.colorMode,
      cpuMoveSpeed:
        settings.cpuMoveSpeed === 'instant' || settings.cpuMoveSpeed === 'snappy'
          ? settings.cpuMoveSpeed
          : fallback.settings.cpuMoveSpeed,
      highContrast:
        typeof settings.highContrast === 'boolean'
          ? settings.highContrast
          : fallback.settings.highContrast,
    },
    progress: {
      completedLessonIds: sanitizeStringArray(progress.completedLessonIds),
      lessonStars: sanitizeNumberRecord(progress.lessonStars),
      bossWins: sanitizeStringArray(progress.bossWins),
      worldUnlocks:
        sanitizeStringArray(progress.worldUnlocks).length > 0
          ? sanitizeStringArray(progress.worldUnlocks)
          : fallback.progress.worldUnlocks,
      conceptScores: sanitizeNumberRecord(progress.conceptScores),
      capstonePassed:
        typeof progress.capstonePassed === 'boolean'
          ? progress.capstonePassed
          : fallback.progress.capstonePassed,
    },
    review: {
      duePuzzleIds: sanitizeStringArray(review.duePuzzleIds),
      entries: Array.isArray(review.entries)
        ? review.entries.filter(isRecord).map((entry) => ({
            puzzleId:
              typeof entry.puzzleId === 'string' ? entry.puzzleId : 'unknown-puzzle',
            conceptTag:
              typeof entry.conceptTag === 'string' ? entry.conceptTag : 'review',
            dueAt:
              typeof entry.dueAt === 'string'
                ? entry.dueAt
                : fallback.profile.createdAt,
            attempts:
              typeof entry.attempts === 'number' ? entry.attempts : 0,
            correct: typeof entry.correct === 'number' ? entry.correct : 0,
            streak: typeof entry.streak === 'number' ? entry.streak : 0,
            lastSeen:
              typeof entry.lastSeen === 'string' ? entry.lastSeen : undefined,
          }))
        : fallback.review.entries,
      lastGeneratedAt:
        typeof review.lastGeneratedAt === 'string'
          ? review.lastGeneratedAt
          : undefined,
    },
    history: {
      recentGames: Array.isArray(history.recentGames)
        ? history.recentGames.filter(isRecord).map((game) => ({
            id: typeof game.id === 'string' ? game.id : crypto.randomUUID(),
            aiId: typeof game.aiId === 'string' ? game.aiId : 'warmup-bot',
            result:
              game.result === 'win' || game.result === 'loss' || game.result === 'draw'
                ? game.result
                : 'draw',
            finishedAt:
              typeof game.finishedAt === 'string'
                ? game.finishedAt
                : fallback.profile.createdAt,
            plyCount: typeof game.plyCount === 'number' ? game.plyCount : 0,
          }))
        : fallback.history.recentGames,
    },
  };
}

function sanitizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function sanitizeNumberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] => typeof entry[1] === 'number',
    ),
  );
}
