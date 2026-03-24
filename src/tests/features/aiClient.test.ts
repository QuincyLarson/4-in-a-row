import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { chooseBattleMove, createBoard } from '../../core';

type MessageListener = (event: { data: unknown }) => void;
type GenericListener = () => void;

class MockWorker {
  static instances: MockWorker[] = [];

  readonly messageListeners: MessageListener[] = [];
  readonly errorListeners: GenericListener[] = [];
  readonly messageErrorListeners: GenericListener[] = [];
  readonly posts: unknown[] = [];
  readonly terminate = vi.fn();

  constructor() {
    MockWorker.instances.push(this);
  }

  addEventListener(type: string, listener: MessageListener | GenericListener) {
    if (type === 'message') {
      this.messageListeners.push(listener as MessageListener);
    } else if (type === 'error') {
      this.errorListeners.push(listener as GenericListener);
    } else if (type === 'messageerror') {
      this.messageErrorListeners.push(listener as GenericListener);
    }
  }

  postMessage(payload: unknown) {
    this.posts.push(payload);
  }

  emitMessage(payload: unknown) {
    this.messageListeners.forEach((listener) => listener({ data: payload }));
  }

  emitError() {
    this.errorListeners.forEach((listener) => listener());
  }
}

describe('aiClient', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    MockWorker.instances = [];
  });

  afterEach(async () => {
    const module = await import('../../features/battle/aiClient');
    module.__resetAiClientForTests();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('falls back to the in-thread chooser when workers are unavailable', async () => {
    vi.stubGlobal('Worker', undefined);
    const aiClient = await import('../../features/battle/aiClient');
    const board = createBoard();

    await expect(
      aiClient.requestBattleMove(board, 2, { deadlineMs: Date.now() }),
    ).resolves.toEqual(chooseBattleMove(board, 2, { deadlineMs: Date.now() }));
  });

  it('resolves concurrent worker requests by message id even out of order', async () => {
    vi.stubGlobal('Worker', MockWorker as unknown as typeof Worker);
    const aiClient = await import('../../features/battle/aiClient');
    const board = createBoard();

    const firstPromise = aiClient.requestBattleMove(board, 2);
    const secondPromise = aiClient.requestBattleMove(board, 2);

    const worker = MockWorker.instances[0];
    const [firstRequest, secondRequest] = worker.posts as Array<{ id: string }>;
    worker.emitMessage({
      id: secondRequest.id,
      ok: true,
      result: {
        column: 4,
        score: 2,
        depth: 1,
        nodes: 5,
        completed: true,
        principalVariation: [4],
      },
    });
    worker.emitMessage({
      id: firstRequest.id,
      ok: true,
      result: {
        column: 3,
        score: 1,
        depth: 1,
        nodes: 4,
        completed: true,
        principalVariation: [3],
      },
    });

    await expect(firstPromise).resolves.toMatchObject({ column: 3 });
    await expect(secondPromise).resolves.toMatchObject({ column: 4 });
  });

  it('times out a stalled worker request and falls back to the local chooser', async () => {
    vi.stubGlobal('Worker', MockWorker as unknown as typeof Worker);
    const aiClient = await import('../../features/battle/aiClient');
    const board = createBoard();

    const promise = aiClient.requestBattleMove(board, 2, { deadlineMs: Date.now() });
    await vi.advanceTimersByTimeAsync(901);

    await expect(promise).resolves.toEqual(chooseBattleMove(board, 2, { deadlineMs: Date.now() }));
    expect(MockWorker.instances[0].terminate).toHaveBeenCalled();
  });

  it('falls back when the worker emits an error event', async () => {
    vi.stubGlobal('Worker', MockWorker as unknown as typeof Worker);
    const aiClient = await import('../../features/battle/aiClient');
    const board = createBoard();

    const promise = aiClient.requestMoveAnalysis(board, 3, 2);
    MockWorker.instances[0].emitError();

    await expect(promise).resolves.toMatchObject({ playedMove: 3 });
    expect(MockWorker.instances[0].terminate).toHaveBeenCalled();
  });
});
