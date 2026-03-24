import { createDefaultSave, migrateSaveEnvelope } from './migrations';
import type { SaveEnvelope } from './types';

export const STORAGE_KEY = 'drop-four-academy.save';

export function loadSaveEnvelope(storage: Storage | undefined = globalThis.localStorage): SaveEnvelope {
  if (!storage) {
    return createDefaultSave();
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultSave();
    }
    return migrateSaveEnvelope(JSON.parse(raw));
  } catch {
    return createDefaultSave();
  }
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
