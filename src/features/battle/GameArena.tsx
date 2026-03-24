import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  applyMove,
  boardFromHumanMoves,
  boardOutcome,
  chooseBattleMove,
  createBoard,
  getDropRow,
  legalMoves,
  winningLinesFor,
  type BoardState,
  type MoveAnalysis,
} from '../../core';
import { useAppState } from '../../app/state/useAppState';
import { isAiUnlocked } from '../../app/progression';
import { getSfxController } from '../../audio/sfx';
import { battleAiById, battleAis } from '../../content';
import { BoardScene } from '../board/BoardScene';
import { getDropDurationMs } from '../board/motion';
import { requestBattleMove, requestMoveAnalysis } from './aiClient';
import './gameArena.css';

type GameArenaProps = {
  aiId?: string;
  initialMoves?: number[];
  title: string;
  description: string;
  mode?: 'play' | 'battle' | 'sandbox' | 'lesson';
  onHumanResolvedMove?: (column: number, analysis: MoveAnalysis | null) => void;
  onFinish?: (result: 'win' | 'loss' | 'draw', board: BoardState) => void;
};

const AI_ID_TO_LEVEL: Record<string, number> = {
  'warmup-bot': 0,
  'block-baron': 1,
  'center-sentinel': 2,
  'threat-smith': 3,
  forksmith: 4,
  'diagonal-djinn': 5,
  'parity-phantom': 6,
  'mirror-master': 7,
  'endgame-engine': 8,
  oracle: 8,
};

export function GameArena(props: GameArenaProps) {
  const sessionKey = `${props.aiId ?? 'none'}:${props.initialMoves?.join(',') ?? ''}:${
    props.mode ?? 'play'
  }`;
  return <GameArenaSession key={sessionKey} {...props} />;
}

function GameArenaSession({
  aiId,
  initialMoves = [],
  title,
  description,
  mode = 'play',
  onHumanResolvedMove,
  onFinish,
}: GameArenaProps) {
  const navigate = useNavigate();
  const {
    state: { save },
    actions,
  } = useAppState();
  const baseBoard = useMemo(() => {
    if (initialMoves.length === 0) {
      return createBoard('human');
    }
    return boardFromHumanMoves(initialMoves, 'human');
  }, [initialMoves]);
  const [board, setBoard] = useState<BoardState>(baseBoard);
  const [previewColumn, setPreviewColumn] = useState<number | null>(
    nearestPlayable(baseBoard, 3),
  );
  const [hintColumn, setHintColumn] = useState<number | null>(null);
  const [thinking, setThinking] = useState(
    Boolean(aiId && baseBoard.turn === 'cpu' && boardOutcome(baseBoard) === 'playing'),
  );
  const [analysis, setAnalysis] = useState<MoveAnalysis | null>(null);
  const [previewVisible, setPreviewVisible] = useState(true);
  const finishedRef = useRef(false);
  const soundTimeoutsRef = useRef<number[]>([]);
  const previewTimeoutRef = useRef<number | null>(null);
  const cpuReadyAtRef = useRef(0);
  const sfx = useMemo(() => getSfxController(), []);
  const aiMeta = aiId ? battleAiById.get(aiId) : null;
  const activePreview = nearestPlayable(board, previewColumn ?? 3);
  const outcome = boardOutcome(board);
  const result =
    outcome === 'playing'
      ? null
      : outcome === 'draw'
        ? 'draw'
        : outcome === 'human'
          ? 'win'
          : 'loss';
  const winningLine =
    board.winner !== null ? winningLinesFor(board, board.winner)[0] ?? null : null;
  const canUndo = board.moves.length > baseBoard.moves.length;
  const sandboxMode = mode === 'sandbox' && !aiId;
  const status = statusText(board, thinking, result, aiMeta?.name, sandboxMode);
  const outcomeLabel =
    result === 'win' ? 'You win!' : result === 'loss' ? 'Try again!' : result === 'draw' ? 'Draw!' : null;
  const nextAi = aiId ? nextLadderAi(aiId) : null;
  const canAdvance =
    result === 'win' &&
    mode !== 'lesson' &&
    nextAi !== null &&
    isAiUnlocked(save, nextAi);

  useEffect(() => {
    return () => {
      clearQueuedSounds(soundTimeoutsRef);
      clearPreviewLock(previewTimeoutRef);
    };
  }, []);

  useEffect(() => {
    if (result === null || finishedRef.current) {
      return;
    }

    finishedRef.current = true;
    if (aiId) {
      actions.recordGame(aiId, result, board.moves.length);
      if (result === 'win' && aiMeta?.role === 'boss') {
        actions.recordBossWin(aiId);
      }
    }

    if (save.settings.soundEnabled) {
      if (result === 'win') {
        void sfx.win();
      } else if (result === 'loss') {
        void sfx.loss();
      }
    }

    onFinish?.(result, board);
  }, [actions, aiId, aiMeta?.role, board, onFinish, result, save.settings.soundEnabled, sfx]);

  useEffect(() => {
    if (!aiId || board.turn !== 'cpu' || outcome !== 'playing') {
      return;
    }

    let cancelled = false;
    const deadlineMs = Date.now() + (aiMeta?.tacticalBudgetMs ?? 70);

    void requestBattleMove(board, AI_ID_TO_LEVEL[aiId] ?? 2, { deadlineMs })
      .then((move) => {
        if (cancelled || move.column === null) {
          return;
        }
        const column = move.column;
        const baseDelay = save.settings.cpuMoveSpeed === 'snappy' ? 90 : 170;
        const waitForLanding = Math.max(0, cpuReadyAtRef.current - Date.now());
        const delay = Math.max(baseDelay, waitForLanding);
        window.setTimeout(() => {
          if (cancelled) {
            return;
          }
          const landingRow = getDropRow(board, column) ?? 0;
          const landingDelay = getDropDurationMs(
            landingRow,
            save.settings.reducedMotion,
          );
          lockPreview(previewTimeoutRef, setPreviewVisible, landingDelay);
          if (save.settings.soundEnabled) {
            void sfx.cpuMove();
            queueSound(soundTimeoutsRef, () => void sfx.land(), landingDelay);
          }
          cpuReadyAtRef.current = 0;
          const next = applyMove(board, column);
          setBoard(next);
          setHintColumn(null);
          setThinking(false);
          setPreviewColumn(nearestPlayable(next, column));
        }, delay);
      })
      .catch(() => {
        if (!cancelled) {
          setThinking(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    aiId,
    aiMeta?.tacticalBudgetMs,
    board,
    outcome,
    save.settings.cpuMoveSpeed,
    save.settings.reducedMotion,
    save.settings.soundEnabled,
    sfx,
  ]);

  async function playHumanMove(column: number) {
    if (!previewVisible || thinking || board.turn !== 'human' || !legalMoves(board).includes(column)) {
      return;
    }

    const boardBefore = board;
    const landingRow = getDropRow(board, column) ?? 0;
    const landingDelay = getDropDurationMs(
      landingRow,
      save.settings.reducedMotion,
    );
    lockPreview(previewTimeoutRef, setPreviewVisible, landingDelay);
    cpuReadyAtRef.current = Date.now() + landingDelay + 28;
    const nextBoard = applyMove(board, column);
    setBoard(nextBoard);
    setHintColumn(null);
    setPreviewColumn(nearestPlayable(nextBoard, column));
    if (aiId && nextBoard.turn === 'cpu' && boardOutcome(nextBoard) === 'playing') {
      setThinking(true);
    }

    if (save.settings.soundEnabled) {
      void sfx.humanMove();
      queueSound(soundTimeoutsRef, () => void sfx.land(), landingDelay);
    }

    if (!aiId) {
      setAnalysis(null);
      onHumanResolvedMove?.(column, null);
      return;
    }

    const nextAnalysis = await requestMoveAnalysis(
      boardBefore,
      column,
      AI_ID_TO_LEVEL.oracle,
    );
    setAnalysis(nextAnalysis);
    onHumanResolvedMove?.(column, nextAnalysis);
  }

  function playManualOtherSide(column: number) {
    if (!previewVisible || thinking || board.turn !== 'cpu' || !legalMoves(board).includes(column)) {
      return;
    }
    const landingRow = getDropRow(board, column) ?? 0;
    const landingDelay = getDropDurationMs(
      landingRow,
      save.settings.reducedMotion,
    );
    lockPreview(previewTimeoutRef, setPreviewVisible, landingDelay);
    const nextBoard = applyMove(board, column);
    setBoard(nextBoard);
    setHintColumn(null);
    setPreviewColumn(nearestPlayable(nextBoard, column));
    if (save.settings.soundEnabled) {
      void sfx.cpuMove();
      queueSound(soundTimeoutsRef, () => void sfx.land(), landingDelay);
    }
  }

  function cyclePreview(direction: -1 | 1) {
    const moves = legalMoves(board);
    if (moves.length === 0) {
      return;
    }
    const current = activePreview ?? moves[0];
    const startIndex = Math.max(0, moves.indexOf(current));
    const nextIndex = (startIndex + direction + moves.length) % moves.length;
    setPreviewColumn(moves[nextIndex]);
  }

  function requestHint() {
    const move = chooseBattleMove(board, AI_ID_TO_LEVEL[aiId ?? 'center-sentinel'] ?? 2);
    setHintColumn(move.column);
    if (save.settings.soundEnabled) {
      void sfx.uiConfirm();
    }
  }

  function resetBoard() {
    clearQueuedSounds(soundTimeoutsRef);
    clearPreviewLock(previewTimeoutRef);
    cpuReadyAtRef.current = 0;
    setBoard(baseBoard);
    setPreviewVisible(true);
    setPreviewColumn(nearestPlayable(baseBoard, 3));
    setHintColumn(null);
    setAnalysis(null);
    setThinking(Boolean(aiId && baseBoard.turn === 'cpu' && boardOutcome(baseBoard) === 'playing'));
    finishedRef.current = false;
  }

  function undoMove() {
    if (!canUndo) {
      return;
    }
    clearQueuedSounds(soundTimeoutsRef);
    clearPreviewLock(previewTimeoutRef);
    cpuReadyAtRef.current = 0;
    const trim = aiId ? 2 : 1;
    const nextMoves = board.moves.slice(
      0,
      Math.max(baseBoard.moves.length, board.moves.length - trim),
    );
    const reconstructed =
      nextMoves.length === 0 ? createBoard('human') : boardFromZeroBasedMoves(nextMoves);
    setBoard(reconstructed);
    setPreviewVisible(true);
    setPreviewColumn(nearestPlayable(reconstructed, activePreview ?? 3));
    setAnalysis(null);
    setThinking(
      Boolean(aiId && reconstructed.turn === 'cpu' && boardOutcome(reconstructed) === 'playing'),
    );
    finishedRef.current = false;
  }

  function confirmResetBoard() {
    if (
      !window.confirm('Reset the current board? This clears the current position and move history.')
    ) {
      return;
    }
    resetBoard();
  }

  return (
    <div className="game-arena">
      <div className="game-arena__masthead">
        <div className="game-arena__copy">
          <h2 className="game-arena__title">{title}</h2>
          <p className="game-arena__description">{description}</p>
        </div>
        <div className="game-arena__meta">
          {aiMeta ? <span className="game-arena__pill">{aiMeta.name}</span> : null}
          {result ? <span className="game-arena__pill">{outcomeLabel}</span> : null}
        </div>
      </div>

      <div className="game-arena__shell">
        <div className="game-arena__boardColumn">
          <div className="game-arena__boardWrap">
            <BoardScene
              board={board}
              previewColumn={hintColumn ?? activePreview}
              reducedMotion={save.settings.reducedMotion}
              showPreview={
                previewVisible && (sandboxMode || !aiId || (!thinking && board.turn === 'human'))
              }
              onHoverColumn={(column) => {
                if (column !== null) {
                  setPreviewColumn(column);
                }
              }}
              onSelectColumn={(column) => {
                if (board.turn === 'human') {
                  void playHumanMove(column);
                } else if (sandboxMode) {
                  playManualOtherSide(column);
                }
              }}
              onMovePreview={cyclePreview}
              onPrimaryAction={() => {
                if (activePreview === null) {
                  return;
                }
                if (board.turn === 'human') {
                  void playHumanMove(activePreview);
                } else if (sandboxMode) {
                  playManualOtherSide(activePreview);
                }
              }}
              onHint={requestHint}
              onRestart={confirmResetBoard}
              onUndo={undoMove}
              onToggleMute={() => actions.setSound(!save.settings.soundEnabled)}
              status={status}
              disabled={!previewVisible || thinking || (board.turn === 'cpu' && !!aiId)}
              winningLine={winningLine}
              showConfetti={result === 'win'}
              outcomeLabel={outcomeLabel}
            />
          </div>
        </div>

        <aside className="game-arena__rail" aria-label="Match tools">
          <section className="game-arena__panel">
            <div className="game-arena__panelHeader">
              <h3 className="game-arena__panelTitle">Controls</h3>
              <span className="game-arena__microPill">Keys live</span>
            </div>
            <div className="game-arena__buttonGrid">
              <button
                type="button"
                className="game-arena__button"
                disabled={!canUndo}
                onClick={undoMove}
              >
                Undo
              </button>
              <button
                type="button"
                className="game-arena__button"
                onClick={() => actions.setSound(!save.settings.soundEnabled)}
              >
                {save.settings.soundEnabled ? 'Mute' : 'Sound on'}
              </button>
              <button
                type="button"
                className="game-arena__button game-arena__button--danger"
                onClick={confirmResetBoard}
              >
                Reset board
              </button>
            </div>
            <div className="game-arena__shortcutGrid" aria-label="Keyboard shortcuts">
              <span className="game-arena__shortcut">
                <span>Preview</span>
                <kbd className="game-arena__key">← →</kbd>
              </span>
              <span className="game-arena__shortcut">
                <span>Drop</span>
                <kbd className="game-arena__key">Enter</kbd>
              </span>
              <span className="game-arena__shortcut">
                <span>Hint</span>
                <kbd className="game-arena__key">H</kbd>
              </span>
              <span className="game-arena__shortcut">
                <span>Undo</span>
                <kbd className="game-arena__key">U</kbd>
              </span>
              <span className="game-arena__shortcut">
                <span>Reset</span>
                <kbd className="game-arena__key">R</kbd>
              </span>
              <span className="game-arena__shortcut">
                <span>Sound</span>
                <kbd className="game-arena__key">M</kbd>
              </span>
            </div>
          </section>

          <section className="game-arena__panel">
            <div className="game-arena__panelHeader">
              <h3 className="game-arena__panelTitle">Coach</h3>
              {hintColumn !== null ? (
                <span className="game-arena__microPill game-arena__microPill--accent">
                  Hint: {hintColumn + 1}
                </span>
              ) : analysis ? (
                <span className="game-arena__microPill game-arena__microPill--accent">
                  {analysis.quality}
                </span>
              ) : null}
            </div>
            <div className="game-arena__analysis">
              <p className="game-arena__bodyCopy">
                {coachCopy(result, thinking, analysis, aiMeta?.name)}
              </p>
              {analysis && analysis.bestMove !== null ? (
                <p className="game-arena__bodyCopy">Better move: column {analysis.bestMove + 1}.</p>
              ) : null}
              {hintColumn !== null ? (
                <p className="game-arena__bodyCopy">Try column {hintColumn + 1} next.</p>
              ) : null}
            </div>
            <div className="game-arena__buttonGrid">
              <button type="button" className="game-arena__button" onClick={requestHint}>
                Show hint
              </button>
              {canAdvance && nextAi ? (
                <button
                  type="button"
                  className="game-arena__button"
                  onClick={() => {
                    if (nextAi.role === 'analysis') {
                      navigate('/sandbox');
                    } else {
                      navigate(`/play?ai=${nextAi.id}`);
                    }
                  }}
                >
                  {nextAi.role === 'analysis' ? 'Open Oracle' : `Next: ${nextAi.name}`}
                </button>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function nearestPlayable(board: BoardState, preferred: number) {
  const moves = legalMoves(board);
  if (moves.length === 0) {
    return null;
  }
  return moves.reduce((best, move) =>
    Math.abs(move - preferred) < Math.abs(best - preferred) ? move : best,
  );
}

function boardFromZeroBasedMoves(moves: number[]) {
  let board = createBoard('human');
  for (const move of moves) {
    board = applyMove(board, move);
  }
  return board;
}

function queueSound(
  timeoutsRef: MutableRefObject<number[]>,
  cb: () => void,
  delayMs: number,
) {
  const timeoutId = window.setTimeout(() => {
    timeoutsRef.current = timeoutsRef.current.filter((entry) => entry !== timeoutId);
    cb();
  }, delayMs);
  timeoutsRef.current.push(timeoutId);
}

function clearQueuedSounds(timeoutsRef: MutableRefObject<number[]>) {
  timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
  timeoutsRef.current = [];
}

function lockPreview(
  timeoutRef: MutableRefObject<number | null>,
  setPreviewVisible: (value: boolean) => void,
  delayMs: number,
) {
  clearPreviewLock(timeoutRef);
  setPreviewVisible(false);
  timeoutRef.current = window.setTimeout(() => {
    timeoutRef.current = null;
    setPreviewVisible(true);
  }, delayMs);
}

function clearPreviewLock(timeoutRef: MutableRefObject<number | null>) {
  if (timeoutRef.current !== null) {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
}

function statusText(
  board: BoardState,
  thinking: boolean,
  result: 'win' | 'loss' | 'draw' | null,
  aiName?: string,
  sandboxMode?: boolean,
) {
  if (result === 'win') {
    return 'You won. Confetti is live, and the board is ready for another run.';
  }
  if (result === 'loss') {
    return `${aiName ?? 'CPU'} converted the position. Replay with the coach and inspect the turning point.`;
  }
  if (result === 'draw') {
    return 'Draw. Strong defensive hold.';
  }
  if (thinking) {
    return `${aiName ?? 'CPU'} is thinking.`;
  }
  if (sandboxMode) {
    return board.turn === 'human'
      ? 'Human to move. Use the board to test a line.'
      : 'CPU side to move. This sandbox lets you drive both sides.';
  }
  return board.turn === 'human'
    ? 'Your move. Hover, tap, or use the keyboard preview.'
    : `${aiName ?? 'CPU'} to move.`;
}

function coachCopy(
  result: 'win' | 'loss' | 'draw' | null,
  thinking: boolean,
  analysis: MoveAnalysis | null,
  aiName?: string,
) {
  if (result === 'win') {
    return 'Nice. You converted the game.';
  }
  if (result === 'loss') {
    return 'That line slipped. Try again or use the hint.';
  }
  if (result === 'draw') {
    return 'Drawn position. Clean hold.';
  }
  if (thinking) {
    return `${aiName ?? 'CPU'} is choosing a reply.`;
  }
  if (analysis) {
    return analysis.reason;
  }
  return 'Hint when needed. Otherwise just play.';
}

function nextLadderAi(currentAiId: string) {
  const currentIndex = battleAis.findIndex((ai) => ai.id === currentAiId);
  return currentIndex >= 0 ? battleAis[currentIndex + 1] ?? null : null;
}
