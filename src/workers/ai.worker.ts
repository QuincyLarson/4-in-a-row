import type { AIProfile, BoardState, MoveAnalysis, SearchOptions } from '../core';
import { analyzeMove, chooseBattleMove, resolveAIProfile } from '../core';

export type AiWorkerRequest =
  | {
      id: string;
      kind: 'choose';
      board: BoardState;
      profile: number | AIProfile;
      options?: SearchOptions;
    }
  | {
      id: string;
      kind: 'analyze';
      board: BoardState;
      playedColumn: number;
      profile?: number | AIProfile;
    };

export type AiWorkerResponse =
  | {
      id: string;
      ok: true;
      result: ReturnType<typeof chooseBattleMove> | MoveAnalysis;
    }
  | {
      id: string;
      ok: false;
      error: string;
    };

type WorkerMessageEvent<T> = {
  data: T;
};

type WorkerScope = {
  addEventListener: (
    type: 'message',
    listener: (event: WorkerMessageEvent<AiWorkerRequest>) => void,
  ) => void;
  postMessage: (message: AiWorkerResponse) => void;
};

const workerScope = globalThis as typeof globalThis & WorkerScope;

workerScope.addEventListener('message', (event) => {
  const message = event.data;
  try {
    if (message.kind === 'choose') {
      const profile = resolveAIProfile(message.profile);
      const result = chooseBattleMove(message.board, profile, message.options);
      const response: AiWorkerResponse = { id: message.id, ok: true, result };
      workerScope.postMessage(response);
      return;
    }

    const result = analyzeMove(message.board, message.playedColumn, message.profile);
    const response: AiWorkerResponse = { id: message.id, ok: true, result };
    workerScope.postMessage(response);
  } catch (error) {
    const response: AiWorkerResponse = {
      id: message.id,
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown AI worker error',
    };
    workerScope.postMessage(response);
  }
});
