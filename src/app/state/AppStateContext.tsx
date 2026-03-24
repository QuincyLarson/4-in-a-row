import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import { createDefaultSave } from '../../storage/migrations';
import {
  exportSaveEnvelope,
  importSaveEnvelope,
  loadSaveEnvelope,
  persistSaveEnvelope,
  resetSaveEnvelope,
} from '../../storage/localSave';
import type {
  ColorMode,
  CpuMoveSpeed,
  GameResult,
  ReviewEntry,
  SaveEnvelope,
} from '../../storage/types';

export interface AppState {
  save: SaveEnvelope;
  ready: boolean;
}

type AppAction =
  | { type: 'hydrate'; save: SaveEnvelope }
  | { type: 'set-display-name'; displayName: string }
  | { type: 'set-sound'; enabled: boolean }
  | { type: 'set-reduced-motion'; enabled: boolean }
  | { type: 'set-color-mode'; colorMode: ColorMode }
  | { type: 'set-cpu-move-speed'; cpuMoveSpeed: CpuMoveSpeed }
  | { type: 'set-high-contrast'; enabled: boolean }
  | { type: 'complete-lesson'; lessonId: string; stars: number; conceptScores?: Record<string, number> }
  | { type: 'unlock-world'; worldId: string }
  | { type: 'record-boss-win'; aiId: string }
  | { type: 'record-game'; aiId: string; result: GameResult; plyCount: number }
  | { type: 'queue-review'; entry: ReviewEntry }
  | { type: 'resolve-review'; puzzleId: string; correct: boolean; nextDueAt: string }
  | { type: 'import-save'; save: SaveEnvelope }
  | { type: 'reset-save' };

interface AppStateContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  actions: {
    setDisplayName(displayName: string): void;
    setSound(enabled: boolean): void;
    setReducedMotion(enabled: boolean): void;
    setColorMode(colorMode: ColorMode): void;
    setCpuMoveSpeed(cpuMoveSpeed: CpuMoveSpeed): void;
    setHighContrast(enabled: boolean): void;
    completeLesson(lessonId: string, stars: number, conceptScores?: Record<string, number>): void;
    unlockWorld(worldId: string): void;
    recordBossWin(aiId: string): void;
    recordGame(aiId: string, result: GameResult, plyCount: number): void;
    queueReview(entry: ReviewEntry): void;
    resolveReview(puzzleId: string, correct: boolean, nextDueAt: string): void;
    exportSave(): string;
    importSave(json: string): void;
    resetSave(): void;
  };
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

function createInitialState(): AppState {
  return {
    save: createDefaultSave(),
    ready: false,
  };
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'hydrate':
      return {
        save: action.save,
        ready: true,
      };
    case 'set-display-name':
      return {
        ...state,
        save: {
          ...state.save,
          profile: {
            ...state.save.profile,
            displayName: action.displayName.trim() || undefined,
          },
        },
      };
    case 'set-sound':
      return updateSettings(state, { soundEnabled: action.enabled });
    case 'set-reduced-motion':
      return updateSettings(state, { reducedMotion: action.enabled });
    case 'set-color-mode':
      return updateSettings(state, { colorMode: action.colorMode });
    case 'set-cpu-move-speed':
      return updateSettings(state, { cpuMoveSpeed: action.cpuMoveSpeed });
    case 'set-high-contrast':
      return updateSettings(state, { highContrast: action.enabled });
    case 'complete-lesson': {
      const completed = new Set(state.save.progress.completedLessonIds);
      completed.add(action.lessonId);
      return {
        ...state,
        save: {
          ...state.save,
          progress: {
            ...state.save.progress,
            completedLessonIds: Array.from(completed),
            lessonStars: {
              ...state.save.progress.lessonStars,
              [action.lessonId]: Math.max(
                action.stars,
                state.save.progress.lessonStars[action.lessonId] ?? 0,
              ),
            },
            conceptScores: {
              ...state.save.progress.conceptScores,
              ...action.conceptScores,
            },
          },
        },
      };
    }
    case 'unlock-world': {
      const unlocks = new Set(state.save.progress.worldUnlocks);
      unlocks.add(action.worldId);
      return {
        ...state,
        save: {
          ...state.save,
          progress: {
            ...state.save.progress,
            worldUnlocks: Array.from(unlocks),
          },
        },
      };
    }
    case 'record-boss-win': {
      const wins = new Set(state.save.progress.bossWins);
      wins.add(action.aiId);
      return {
        ...state,
        save: {
          ...state.save,
          progress: {
            ...state.save.progress,
            bossWins: Array.from(wins),
          },
        },
      };
    }
    case 'record-game':
      return {
        ...state,
        save: {
          ...state.save,
          history: {
            recentGames: [
              {
                id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
                aiId: action.aiId,
                result: action.result,
                finishedAt: new Date().toISOString(),
                plyCount: action.plyCount,
              },
              ...state.save.history.recentGames,
            ].slice(0, 24),
          },
        },
      };
    case 'queue-review': {
      const existing = state.save.review.entries.find(
        (entry) => entry.puzzleId === action.entry.puzzleId,
      );
      const entries = existing
        ? state.save.review.entries.map((entry) =>
            entry.puzzleId === action.entry.puzzleId
              ? {
                  ...entry,
                  dueAt: action.entry.dueAt,
                }
              : entry,
          )
        : [...state.save.review.entries, action.entry];

      const duePuzzleIds = Array.from(new Set(entries.map((entry) => entry.puzzleId)));
      return {
        ...state,
        save: {
          ...state.save,
          review: {
            ...state.save.review,
            duePuzzleIds,
            entries,
            lastGeneratedAt: new Date().toISOString(),
          },
        },
      };
    }
    case 'resolve-review': {
      const entries = state.save.review.entries.map((entry) =>
        entry.puzzleId === action.puzzleId
          ? {
              ...entry,
              attempts: entry.attempts + 1,
              correct: entry.correct + (action.correct ? 1 : 0),
              streak: action.correct ? entry.streak + 1 : 0,
              dueAt: action.nextDueAt,
              lastSeen: new Date().toISOString(),
            }
          : entry,
      );
      return {
        ...state,
        save: {
          ...state.save,
          review: {
            ...state.save.review,
            duePuzzleIds: Array.from(new Set(entries.map((entry) => entry.puzzleId))),
            entries,
          },
        },
      };
    }
    case 'import-save':
      return {
        save: action.save,
        ready: true,
      };
    case 'reset-save':
      return {
        save: resetSaveEnvelope(),
        ready: true,
      };
    default:
      return state;
  }
}

function updateSettings(
  state: AppState,
  patch: Partial<AppState['save']['settings']>,
): AppState {
  return {
    ...state,
    save: {
      ...state.save,
      settings: {
        ...state.save.settings,
        ...patch,
      },
    },
  };
}

export function AppStateProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    dispatch({ type: 'hydrate', save: loadSaveEnvelope() });
  }, []);

  useEffect(() => {
    if (!state.ready) {
      return;
    }
    persistSaveEnvelope(state.save);
  }, [state.ready, state.save]);

  useEffect(() => {
    const body = document.body;
    body.dataset.motion = state.save.settings.reducedMotion ? 'reduced' : 'default';
    body.dataset.pattern = state.save.settings.colorMode;
    body.dataset.contrast = state.save.settings.highContrast ? 'high' : 'default';
  }, [
    state.save.settings.colorMode,
    state.save.settings.highContrast,
    state.save.settings.reducedMotion,
  ]);

  const value = useMemo<AppStateContextValue>(() => {
    const actions: AppStateContextValue['actions'] = {
      setDisplayName(displayName) {
        dispatch({ type: 'set-display-name', displayName });
      },
      setSound(enabled) {
        dispatch({ type: 'set-sound', enabled });
      },
      setReducedMotion(enabled) {
        dispatch({ type: 'set-reduced-motion', enabled });
      },
      setColorMode(colorMode) {
        dispatch({ type: 'set-color-mode', colorMode });
      },
      setCpuMoveSpeed(cpuMoveSpeed) {
        dispatch({ type: 'set-cpu-move-speed', cpuMoveSpeed });
      },
      setHighContrast(enabled) {
        dispatch({ type: 'set-high-contrast', enabled });
      },
      completeLesson(lessonId, stars, conceptScores) {
        dispatch({ type: 'complete-lesson', lessonId, stars, conceptScores });
      },
      unlockWorld(worldId) {
        dispatch({ type: 'unlock-world', worldId });
      },
      recordBossWin(aiId) {
        dispatch({ type: 'record-boss-win', aiId });
      },
      recordGame(aiId, result, plyCount) {
        dispatch({ type: 'record-game', aiId, result, plyCount });
      },
      queueReview(entry) {
        dispatch({ type: 'queue-review', entry });
      },
      resolveReview(puzzleId, correct, nextDueAt) {
        dispatch({ type: 'resolve-review', puzzleId, correct, nextDueAt });
      },
      exportSave() {
        return exportSaveEnvelope(state.save);
      },
      importSave(json) {
        dispatch({ type: 'import-save', save: importSaveEnvelope(json) });
      },
      resetSave() {
        dispatch({ type: 'reset-save' });
      },
    };

    return {
      state,
      dispatch,
      actions,
    };
  }, [state]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export { AppStateContext };
