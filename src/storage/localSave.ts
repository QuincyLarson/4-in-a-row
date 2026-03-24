import { createDefaultSave, migrateSaveEnvelope } from './migrations';
import type { SaveEnvelope } from './types';

export const STORAGE_KEY = 'learn-drop-4.save';
export const LEGACY_STORAGE_KEYS = ['drop-four-academy.save'] as const;

export function loadSaveEnvelope(storage: Storage | undefined = globalThis.localStorage): SaveEnvelope {
  if (!storage) {
    return createDefaultSave();
  }

  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    try {
      const raw = storage.getItem(key);
      if (!raw) {
        continue;
      }
      return migrateSaveEnvelope(JSON.parse(raw));
    } catch {
      continue;
    }
  }

  return createDefaultSave();
}

export function persistSaveEnvelope(
  save: SaveEnvelope,
  storage: Storage | undefined = globalThis.localStorage,
): void {
  if (!storage) {
    return;
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(save));
}

export function exportSaveEnvelope(save: SaveEnvelope): string {
  return JSON.stringify(save, null, 2);
}

export function importSaveEnvelope(json: string): SaveEnvelope {
  return migrateSaveEnvelope(JSON.parse(json));
}

export function resetSaveEnvelope(): SaveEnvelope {
  return createDefaultSave();
}
