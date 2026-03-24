import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';

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
import { getSfxController } from '../../audio/sfx';
import { battleAiById } from '../../content';
import { BoardScene } from '../board/BoardScene';
import { getDropDurationMs } from '../board/motion';
import { requestBattleMove, requestMoveAnalysis } from './aiClient';

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
  const finishedRef = useRef(false);
  const soundTimeoutsRef = useRef<number[]>([]);
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

  useEffect(() => {
    return () => {
      clearQueuedSounds(soundTimeoutsRef);
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
    if (thinking || board.turn !== 'human' || !legalMoves(board).includes(column)) {
      return;
    }

    const boardBefore = board;
    const landingRow = getDropRow(board, column) ?? 0;
    const landingDelay = getDropDurationMs(
      landingRow,
      save.settings.reducedMotion,
    );
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
    if (thinking || board.turn !== 'cpu' || !legalMoves(board).includes(column)) {
      return;
    }
    const landingRow = getDropRow(board, column) ?? 0;
    const landingDelay = getDropDurationMs(
      landingRow,
      save.settings.reducedMotion,
    );
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
    cpuReadyAtRef.current = 0;
    setBoard(baseBoard);
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
    cpuReadyAtRef.current = 0;
    const trim = aiId ? 2 : 1;
    const nextMoves = board.moves.slice(
      0,
      Math.max(baseBoard.moves.length, board.moves.length - trim),
    );
    const reconstructed =
      nextMoves.length === 0 ? createBoard('human') : boardFromZeroBasedMoves(nextMoves);
    setBoard(reconstructed);
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
    <div style={arena.frame}>
      <div style={arena.header}>
        <div>
          <h2 style={arena.title}>{title}</h2>
          <p style={arena.description}>{description}</p>
        </div>
        <div style={arena.pills}>
          {aiMeta ? <span style={arena.pill}>{aiMeta.name}</span> : null}
          {hintColumn !== null ? (
            <span style={{ ...arena.pill, color: 'var(--warning)' }}>
              Hint: column {hintColumn + 1}
            </span>
          ) : null}
        </div>
      </div>

      <div style={arena.grid}>
        <BoardScene
          board={board}
          previewColumn={hintColumn ?? activePreview}
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
          status={statusText(board, thinking, result, aiMeta?.name, sandboxMode)}
          disabled={thinking || (board.turn === 'cpu' && !!aiId)}
          winningLine={winningLine}
          showConfetti={result === 'win'}
        />

        <aside style={arena.sidebar}>
          <div style={arena.panel}>
            <h3 style={arena.panelTitle}>Controls</h3>
            <ul style={arena.list}>
              <li>Arrow keys move the preview chip.</li>
              <li>Enter or Space drops the chip.</li>
              <li>H for hint, R for reset, U for undo, M for mute.</li>
            </ul>
            <div style={arena.buttons}>
              <button type="button" style={arena.button} onClick={requestHint}>
                Hint
              </button>
              <button
                type="button"
                style={arena.button}
                disabled={!canUndo}
                onClick={undoMove}
              >
                Undo
              </button>
              <button type="button" style={arena.buttonDanger} onClick={confirmResetBoard}>
                Reset board
              </button>
            </div>
          </div>

          <div style={arena.panel}>
            <h3 style={arena.panelTitle}>Coach</h3>
            {analysis ? (
              <div style={arena.analysis}>
                <strong style={arena.analysisLabel}>{analysis.quality}</strong>
                <p style={arena.analysisBody}>{analysis.reason}</p>
                {analysis.bestMove !== null ? (
                  <p style={arena.analysisBody}>
                    Better move: column {analysis.bestMove + 1}
                  </p>
                ) : null}
              </div>
            ) : (
              <p style={arena.analysisBody}>
                {result
                  ? result === 'win'
                    ? 'Clean finish. Replay or climb to a tougher opponent.'
                    : result === 'draw'
                      ? 'Solid hold. See if you can convert the same shape next time.'
                      : 'Use hint or review to revisit the turning point.'
                  : thinking
                    ? `${aiMeta?.name ?? 'CPU'} is choosing a reply.`
                    : 'The coach labels stronger alternatives after your moves.'}
              </p>
            )}
          </div>
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

const arena = {
  frame: {
    display: 'grid',
    gap: '1.25rem',
  },
  header: {
    display: 'grid',
    gap: '0.55rem',
  },
  title: {
    margin: 0,
    fontSize: '1.2rem',
  },
  description: {
    margin: '0.4rem 0 0',
    color: 'var(--muted)',
    lineHeight: 1.6,
  },
  pills: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.6rem',
  },
  pill: {
    display: 'inline-flex',
    padding: '0.35rem 0.7rem',
    borderRadius: '999px',
    background: 'rgba(127, 219, 255, 0.08)',
    color: 'var(--accent-2)',
  },
  grid: {
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: '1fr',
  },
  sidebar: {
    display: 'grid',
    gap: '1rem',
    alignContent: 'start' as const,
  },
  panel: {
    display: 'grid',
    gap: '0.8rem',
    padding: '1rem',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface)',
    border: '1px solid rgba(245, 246, 247, 0.08)',
  },
  panelTitle: {
    margin: 0,
    fontSize: '1rem',
  },
  list: {
    margin: 0,
    paddingLeft: '1rem',
    color: 'var(--muted)',
    lineHeight: 1.7,
  },
  analysis: {
    display: 'grid',
    gap: '0.5rem',
  },
  analysisLabel: {
    textTransform: 'capitalize' as const,
    color: 'var(--accent)',
  },
  analysisBody: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.7,
  },
  buttons: {
    display: 'flex',
    gap: '0.65rem',
    flexWrap: 'wrap' as const,
  },
  button: {
    minHeight: '2.6rem',
    padding: '0.7rem 0.95rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(245, 246, 247, 0.12)',
    background: 'var(--bg-1)',
    color: 'var(--ink)',
  },
  buttonDanger: {
    minHeight: '2.6rem',
    padding: '0.7rem 0.95rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(255, 173, 173, 0.28)',
    background: 'rgba(255, 173, 173, 0.1)',
    color: 'var(--ink)',
  },
};
