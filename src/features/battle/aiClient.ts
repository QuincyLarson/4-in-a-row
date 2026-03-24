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

let worker: Worker | null = null;
let messageCounter = 0;
const pending = new Map<
  string,
  {
    resolve(value: ReturnType<typeof chooseBattleMove> | MoveAnalysis): void;
    reject(reason?: unknown): void;
  }
>();

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') {
    return null;
  }

  if (!worker) {
    worker = new Worker(new URL('../../workers/ai.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.addEventListener('message', (event: MessageEvent<AiWorkerResponse>) => {
      const payload = event.data;
      const queued = pending.get(payload.id);
      if (!queued) {
        return;
      }
      pending.delete(payload.id);
      if (payload.ok) {
        queued.resolve(payload.result);
      } else {
        queued.reject(new Error(payload.error));
      }
    });
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
    pending.set(request.id, {
      resolve: (value) => resolve(value as T),
      reject,
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
