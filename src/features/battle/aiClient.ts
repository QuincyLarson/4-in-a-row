import {
  analyzeMove,
  chooseBattleMove,
  type AIProfile,
  type BoardState,
  type MoveAnalysis,
  type SearchOptions,
} from '../../core';
import type {
  AiWorkerRequest,
  AiWorkerResponse,
} from '../../workers/ai.worker';

const WORKER_TIMEOUT_MS = 900;

let worker: Worker | null = null;
let messageCounter = 0;
const pending = new Map<
  string,
  {
    resolve(value: ReturnType<typeof chooseBattleMove> | MoveAnalysis): void;
    reject(reason?: unknown): void;
    timeoutId: number;
  }
>();

function clearPendingRequest(id: string) {
  const queued = pending.get(id);
  if (!queued) {
    return null;
  }

  window.clearTimeout(queued.timeoutId);
  pending.delete(id);
  return queued;
}

function resetWorker(reason = new Error('AI worker unavailable')) {
  for (const [id, queued] of pending.entries()) {
    window.clearTimeout(queued.timeoutId);
    pending.delete(id);
    queued.reject(reason);
  }

  if (worker) {
    worker.terminate();
    worker = null;
  }
}

function handleWorkerMessage(event: MessageEvent<AiWorkerResponse>) {
  const payload = event.data;
  const queued = clearPendingRequest(payload.id);
  if (!queued) {
    return;
  }

  if (payload.ok) {
    queued.resolve(payload.result);
  } else {
    queued.reject(new Error(payload.error));
  }
}

function handleWorkerFailure() {
  resetWorker(new Error('AI worker failed'));
}

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') {
    return null;
  }

  if (!worker) {
    worker = new Worker(new URL('../../workers/ai.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.addEventListener('message', handleWorkerMessage);
    worker.addEventListener('error', handleWorkerFailure);
    worker.addEventListener('messageerror', handleWorkerFailure);
  }

  return worker;
}

function nextMessageId() {
  messageCounter += 1;
  return `ai-${messageCounter}`;
}

function runWorkerRequest<T extends ReturnType<typeof chooseBattleMove> | MoveAnalysis>(
  request: AiWorkerRequest,
): Promise<T> {
  const target = getWorker();
  if (!target) {
    return Promise.reject(new Error('AI worker unavailable'));
  }

  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      clearPendingRequest(request.id);
      reject(new Error('AI worker timed out'));
      resetWorker(new Error('AI worker timed out'));
    }, WORKER_TIMEOUT_MS);

    pending.set(request.id, {
      resolve: (value) => resolve(value as T),
      reject,
      timeoutId,
    });
    target.postMessage(request);
  });
}

export async function requestBattleMove(
  board: BoardState,
  profile: number | AIProfile,
  options: SearchOptions = {},
) {
  if (typeof profile === 'number' && profile < 2) {
    return chooseBattleMove(board, profile, options);
  }

  try {
    return await runWorkerRequest<ReturnType<typeof chooseBattleMove>>({
      id: nextMessageId(),
      kind: 'choose',
      board,
      profile,
      options,
    });
  } catch {
    return chooseBattleMove(board, profile, options);
  }
}

export async function requestMoveAnalysis(
  board: BoardState,
  playedColumn: number,
  profile?: number | AIProfile,
) {
  try {
    return await runWorkerRequest<MoveAnalysis>({
      id: nextMessageId(),
      kind: 'analyze',
      board,
      playedColumn,
      profile,
    });
  } catch {
    return analyzeMove(board, playedColumn, profile);
  }
}

export function __resetAiClientForTests() {
  resetWorker();
  messageCounter = 0;
}
