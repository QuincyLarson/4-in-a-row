import { describe, expect, it } from 'vitest';

import { createDefaultSave, migrateSaveEnvelope } from '../../storage/migrations';
import {
  exportSaveEnvelope,
  importSaveEnvelope,
  LEGACY_STORAGE_KEYS,
  loadSaveEnvelope,
  persistSaveEnvelope,
  STORAGE_KEY,
} from '../../storage/localSave';

function createStorage(initial: Record<string, string> = {}): Storage {
  const state = new Map(Object.entries(initial));
  return {
    get length() {
      return state.size;
    },
    clear() {
      state.clear();
    },
    getItem(key) {
      return state.get(key) ?? null;
    },
    key(index) {
      return Array.from(state.keys())[index] ?? null;
    },
    removeItem(key) {
      state.delete(key);
    },
    setItem(key, value) {
      state.set(key, value);
    },
  };
}

describe('local save envelope', () => {
  it('loads from the current storage key and preserves a round-trip export/import', () => {
    const save = createDefaultSave(new Date('2026-03-24T12:00:00.000Z'));
    save.profile.displayName = 'Quincy';
    const storage = createStorage();

    persistSaveEnvelope(save, storage);
    expect(storage.getItem(STORAGE_KEY)).toContain('"Quincy"');

    const loaded = loadSaveEnvelope(storage);
    expect(loaded.profile.displayName).toBe('Quincy');
    expect(importSaveEnvelope(exportSaveEnvelope(loaded))).toEqual(loaded);
  });

  it('falls back to the legacy storage key and skips malformed newer entries', () => {
    const legacySave = createDefaultSave(new Date('2026-03-24T12:00:00.000Z'));
    legacySave.profile.displayName = 'Legacy learner';
    const storage = createStorage({
      [STORAGE_KEY]: '{not valid json',
      [LEGACY_STORAGE_KEYS[0]]: JSON.stringify(legacySave),
    });

    expect(loadSaveEnvelope(storage).profile.displayName).toBe('Legacy learner');
  });
});

describe('save migration', () => {
  it('sanitizes partial v1 data and restores defaults for bad values', () => {
    const migrated = migrateSaveEnvelope({
      version: 1,
      profile: {
        createdAt: '2026-03-24T12:00:00.000Z',
        displayName: 'Learner',
      },
      settings: {
        soundEnabled: 'yes',
        reducedMotion: true,
        colorMode: 'not-a-mode',
      },
      progress: {
        completedLessonIds: ['world-0-board-and-gravity'],
        lessonStars: { alpha: 3, beta: 'nope' },
      },
    });

    expect(migrated.profile.displayName).toBe('Learner');
    expect(migrated.settings.reducedMotion).toBe(true);
    expect(migrated.settings.soundEnabled).toBe(true);
    expect(migrated.settings.colorMode).toBe('pattern');
    expect(migrated.progress.completedLessonIds).toEqual(['world-0-board-and-gravity']);
    expect(migrated.progress.lessonStars).toEqual({ alpha: 3 });
    expect(migrated.progress.clearedAiIds).toEqual([]);
  });

  it('resets unknown versions to the default save envelope', () => {
    const migrated = migrateSaveEnvelope({ version: 99, profile: { displayName: 'Nope' } });
    expect(migrated).toEqual(createDefaultSave(new Date(migrated.profile.createdAt)));
  });
});
