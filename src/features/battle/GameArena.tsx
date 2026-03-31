import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  applyMove,
  boardFromHumanMoves,
  boardOutcome,
  chooseBattleMove,
  cloneBoard,
  createBoard,
  getDropRow,
  legalMoves,
  winningLinesFor,
  type BoardState,
  type MoveAnalysis,
} from '../../core';
import { useAppState } from '../../app/state/useAppState';
import { getSfxController } from '../../audio/sfx';
import { battleAiById, battleAis } from '../../content';
import { BoardScene } from '../board/BoardScene';
import { getDropDurationMs, getImpactDelayMs } from '../board/motion';
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

type MoveLogEntry = {
  turnNumber: number;
  side: 'human' | 'cpu';
  sessionPly: number;
  label: string;
};

type MoveLogRow = {
  turnNumber: number;
  human?: MoveLogEntry;
  cpu?: MoveLogEntry;
};

type HumanAnalysisState = {
  analysis: MoveAnalysis;
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
  const [analysisState, setAnalysisState] = useState<HumanAnalysisState | null>(null);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [replayPly, setReplayPly] = useState<number | null>(null);
  const [outcomeVisible, setOutcomeVisible] = useState(false);
  const [coachFlashActive, setCoachFlashActive] = useState(false);
  const finishedRef = useRef(false);
  const soundTimeoutsRef = useRef<number[]>([]);
  const previewTimeoutRef = useRef<number | null>(null);
  const outcomeTimeoutRef = useRef<number | null>(null);
  const coachFlashTimeoutRef = useRef<number | null>(null);
  const analysisRequestRef = useRef(0);
  const cpuReadyAtRef = useRef(0);
  const sfx = useMemo(() => getSfxController(), []);
  const aiMeta = aiId ? battleAiById.get(aiId) : null;
  const sessionMoves = board.moves.slice(baseBoard.moves.length);
  const moveLog = useMemo(() => buildMoveLog(baseBoard, sessionMoves), [baseBoard, sessionMoves]);
  const replayEntry =
    replayPly !== null ? moveLog.find((entry) => entry.sessionPly === replayPly) ?? null : null;
  const replayBoard =
    replayPly !== null ? boardFromSessionReplay(baseBoard, sessionMoves, replayPly) : null;
  const displayBoard = replayBoard ?? board;
  const visibleAnalysis = analysisState?.analysis ?? null;
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
    displayBoard.winner !== null
      ? winningLinesFor(displayBoard, displayBoard.winner)[0] ?? null
      : null;
  const canUndo = board.moves.length > baseBoard.moves.length;
  const sandboxMode = mode === 'sandbox' && !aiId;
  const status = replayEntry
    ? `Replay move ${replayEntry.sessionPly}: ${replayEntry.label}.`
    : statusText(board, thinking, result, aiMeta?.name, sandboxMode);
  const outcomeLabel =
    result === 'win' ? 'You win!' : result === 'loss' ? 'Try again!' : result === 'draw' ? 'Draw!' : null;
  const nextAi = aiId ? nextLadderAi(aiId) : null;
  const canAdvance = result === 'win' && nextAi !== null && mode !== 'lesson';
  const controlsDisabled = replayPly !== null;
  const coachLines = coachCopy(result, visibleAnalysis, hintColumn);
  const canDrop = Boolean(
    !controlsDisabled &&
      activePreview !== null &&
      previewVisible &&
      !thinking &&
      result === null &&
      ((board.turn === 'human' && legalMoves(board).includes(activePreview)) ||
        (sandboxMode && board.turn === 'cpu' && legalMoves(board).includes(activePreview))),
  );
  const canHint = Boolean(!controlsDisabled && result === null && !thinking && board.turn === 'human');

  useEffect(() => {
    return () => {
      clearQueuedSounds(soundTimeoutsRef);
      clearPreviewLock(previewTimeoutRef);
      clearOutcomeDelay(outcomeTimeoutRef);
      clearCoachFlash(coachFlashTimeoutRef, setCoachFlashActive);
    };
  }, []);

  useEffect(() => {
    clearOutcomeDelay(outcomeTimeoutRef);

    if (result === null || replayPly !== null) {
      return;
    }

    const delayMs = result === 'win' ? 250 : 0;
    outcomeTimeoutRef.current = window.setTimeout(() => {
      outcomeTimeoutRef.current = null;
      setOutcomeVisible(true);
    }, delayMs);

    return () => clearOutcomeDelay(outcomeTimeoutRef);
  }, [replayPly, result]);

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
          const impactDelay = getImpactDelayMs(
            landingRow,
            save.settings.reducedMotion,
          );
          lockPreview(previewTimeoutRef, setPreviewVisible, landingDelay);
          if (save.settings.soundEnabled) {
            void sfx.cpuMove();
            queueSound(soundTimeoutsRef, () => void sfx.land(), impactDelay);
          }
          cpuReadyAtRef.current = 0;
          setReplayPly(null);
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

    setReplayPly(null);
    setOutcomeVisible(false);
    const boardBefore = board;
    const landingRow = getDropRow(board, column) ?? 0;
    const landingDelay = getDropDurationMs(
      landingRow,
      save.settings.reducedMotion,
    );
    const impactDelay = getImpactDelayMs(
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
      queueSound(soundTimeoutsRef, () => void sfx.land(), impactDelay);
    }

    if (!aiId) {
      analysisRequestRef.current += 1;
      setAnalysisState(null);
      onHumanResolvedMove?.(column, null);
      return;
    }

    const requestId = analysisRequestRef.current + 1;
    analysisRequestRef.current = requestId;
    const nextAnalysis = await requestMoveAnalysis(
      boardBefore,
      column,
      AI_ID_TO_LEVEL.oracle,
    );
    if (analysisRequestRef.current !== requestId) {
      return;
    }
    setAnalysisState({
      analysis: nextAnalysis,
    });
    triggerCoachFlash(
      coachFlashTimeoutRef,
      setCoachFlashActive,
      save.settings.reducedMotion,
    );
    onHumanResolvedMove?.(column, nextAnalysis);
  }

  function playManualOtherSide(column: number) {
    if (!previewVisible || thinking || board.turn !== 'cpu' || !legalMoves(board).includes(column)) {
      return;
    }
    setReplayPly(null);
    setOutcomeVisible(false);
    const landingRow = getDropRow(board, column) ?? 0;
    const landingDelay = getDropDurationMs(
      landingRow,
      save.settings.reducedMotion,
    );
    const impactDelay = getImpactDelayMs(
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
      queueSound(soundTimeoutsRef, () => void sfx.land(), impactDelay);
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
    if (result !== null || replayPly !== null || thinking || board.turn !== 'human') {
      return;
    }
    const move = chooseBattleMove(board, AI_ID_TO_LEVEL[aiId ?? 'center-sentinel'] ?? 2);
    setHintColumn(move.column);
    if (save.settings.soundEnabled) {
      void sfx.uiConfirm();
    }
  }

  function resetBoard() {
    clearQueuedSounds(soundTimeoutsRef);
    clearPreviewLock(previewTimeoutRef);
    clearOutcomeDelay(outcomeTimeoutRef);
    clearCoachFlash(coachFlashTimeoutRef, setCoachFlashActive);
    analysisRequestRef.current += 1;
    cpuReadyAtRef.current = 0;
    setBoard(baseBoard);
    setPreviewVisible(true);
    setPreviewColumn(nearestPlayable(baseBoard, 3));
    setHintColumn(null);
    setAnalysisState(null);
    setReplayPly(null);
    setOutcomeVisible(false);
    setThinking(Boolean(aiId && baseBoard.turn === 'cpu' && boardOutcome(baseBoard) === 'playing'));
    finishedRef.current = false;
  }

  function undoMove() {
    if (!canUndo) {
      return;
    }
    clearQueuedSounds(soundTimeoutsRef);
    clearPreviewLock(previewTimeoutRef);
    clearOutcomeDelay(outcomeTimeoutRef);
    clearCoachFlash(coachFlashTimeoutRef, setCoachFlashActive);
    analysisRequestRef.current += 1;
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
    setHintColumn(null);
    setAnalysisState(null);
    setReplayPly(null);
    setOutcomeVisible(false);
    setThinking(
      Boolean(aiId && reconstructed.turn === 'cpu' && boardOutcome(reconstructed) === 'playing'),
    );
    finishedRef.current = false;
  }

  function dropPreview() {
    if (activePreview === null) {
      return;
    }
    if (board.turn === 'human') {
      void playHumanMove(activePreview);
    } else if (sandboxMode) {
      playManualOtherSide(activePreview);
    }
  }

  function goToNextLevel() {
    if (!nextAi) {
      return;
    }
    setReplayPly(null);
    navigate(`/battle?ai=${nextAi.id}`);
  }

  return (
    <div className={`game-arena${mode === 'lesson' ? ' game-arena--lesson' : ''}`}>
      {mode !== 'lesson' ? (
        <div className="game-arena__masthead">
          <div className="game-arena__copy">
            <h2 className="game-arena__title">{title}</h2>
            {description ? <p className="game-arena__description">{description}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="game-arena__shell">
        <div className="game-arena__boardColumn">
          <div className="game-arena__boardWrap">
            <BoardScene
              board={displayBoard}
              previewColumn={hintColumn ?? activePreview}
              reducedMotion={save.settings.reducedMotion}
              showPreview={
                replayPly === null &&
                previewVisible &&
                (sandboxMode || !aiId || (!thinking && board.turn === 'human'))
              }
              onHoverColumn={(column) => {
                if (replayPly !== null) {
                  return;
                }
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
              onRestart={resetBoard}
              onUndo={undoMove}
              onToggleMute={() => actions.setSound(!save.settings.soundEnabled)}
              status={status}
              disabled={!previewVisible || thinking || (board.turn === 'cpu' && !!aiId) || replayPly !== null}
              winningLine={winningLine}
              showConfetti={result === 'win' && replayPly === null}
              outcomeLabel={replayPly === null && outcomeVisible ? outcomeLabel : null}
              outcomeActions={
                replayPly === null && result && outcomeVisible
                  ? [
                      { label: 'Replay', onClick: resetBoard, variant: 'secondary' as const },
                      ...(result === 'win' && canAdvance
                        ? [{ label: 'Next level', onClick: goToNextLevel }]
                        : []),
                    ]
                  : []
              }
            />
          </div>
        </div>

        <aside className="game-arena__rail" aria-label="Match tools">
          <section className="game-arena__panel">
            <div className="game-arena__panelHeader">
              <h3 className="game-arena__panelTitle">Controls</h3>
            </div>
            <div className="game-arena__buttonGrid">
              <button
                type="button"
                className="game-arena__button"
                disabled={!canDrop}
                onClick={dropPreview}
              >
                Drop (Enter)
              </button>
              <button
                type="button"
                className="game-arena__button"
                disabled={!canHint}
                onClick={requestHint}
              >
                Hint (H)
              </button>
              <button
                type="button"
                className="game-arena__button game-arena__button--danger"
                onClick={resetBoard}
              >
                Reset (R)
              </button>
            </div>
            <div className="game-arena__utilityRow">
              <button
                type="button"
                className="game-arena__textButton"
                disabled={!canUndo || controlsDisabled}
                onClick={undoMove}
              >
                Undo (U)
              </button>
              <button
                type="button"
                className="game-arena__textButton"
                onClick={() => actions.setSound(!save.settings.soundEnabled)}
              >
                {save.settings.soundEnabled ? 'Mute (M)' : 'Sound on (M)'}
              </button>
            </div>
          </section>

          <section
            className={`game-arena__panel${
              coachFlashActive ? ' game-arena__panel--coachFlash' : ''
            }${coachFlashActive && save.settings.reducedMotion ? ' game-arena__panel--coachFlashReduced' : ''}`}
          >
            <div className="game-arena__panelHeader">
              <div className="game-arena__coachHeader">
                {visibleAnalysis ? (
                  <span className={`game-arena__coachQuality game-arena__coachQuality--${analysisTone(visibleAnalysis)}`}>
                    {analysisToneLabel(visibleAnalysis)}
                  </span>
                ) : null}
                <h3 className="game-arena__panelTitle">Coach</h3>
              </div>
            </div>
            <div className="game-arena__analysis" aria-live="polite">
              {coachLines.map((line, index) => (
                <p
                  key={`${index}-${line}`}
                  className={`game-arena__bodyCopy${
                    index === 0 ? ' game-arena__bodyCopy--strong' : ''
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>
          </section>

          <section className="game-arena__panel">
            <div className="game-arena__panelHeader">
              <h3 className="game-arena__panelTitle">Moves</h3>
            </div>
            <div className="game-arena__moveList" aria-label="Move log">
              {moveLog.length === 0 ? (
                <p className="game-arena__bodyCopy">Moves appear here.</p>
              ) : (
                <table className="game-arena__moveTable">
                  <tbody>
                    {moveRows(moveLog).map((row) => (
                      <tr key={row.turnNumber} className="game-arena__moveRow">
                        <th scope="row" className="game-arena__moveNumber">
                          {row.turnNumber}.
                        </th>
                        {(['human', 'cpu'] as const).map((side) => (
                          <td key={`${row.turnNumber}-${side}`} className="game-arena__moveCell">
                            {row[side] ? (
                              <button
                                type="button"
                                className={`game-arena__moveButton${
                                  replayPly === row[side]?.sessionPly ? ' is-active' : ''
                                }`}
                                onMouseEnter={() => setReplayPly(row[side]?.sessionPly ?? null)}
                                onMouseLeave={() => setReplayPly(null)}
                                onFocus={() => setReplayPly(row[side]?.sessionPly ?? null)}
                                onBlur={() => setReplayPly(null)}
                                aria-label={`Replay move ${row[side]?.sessionPly}: ${row[side]?.label}`}
                              >
                                {row[side]?.label}
                              </button>
                            ) : (
                              <span className="game-arena__moveGap">...</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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

function boardFromSessionReplay(baseBoard: BoardState, sessionMoves: number[], ply: number) {
  let replayBoard = cloneBoard(baseBoard);
  for (const move of sessionMoves.slice(0, ply)) {
    replayBoard = applyMove(replayBoard, move);
  }
  return replayBoard;
}

function buildMoveLog(baseBoard: BoardState, sessionMoves: number[]) {
  let replayBoard = cloneBoard(baseBoard);
  const entries: MoveLogEntry[] = [];

  sessionMoves.forEach((move, index) => {
    const row = (getDropRow(replayBoard, move) ?? 0) + 1;
    const side = replayBoard.turn;
    const turnNumber = Math.floor(replayBoard.moves.length / 2) + 1;
    entries.push({
      turnNumber,
      side,
      sessionPly: index + 1,
      label: `${columnLetter(move)}${row}`,
    });
    replayBoard = applyMove(replayBoard, move);
  });

  return entries;
}

function moveRows(entries: MoveLogEntry[]): MoveLogRow[] {
  const rows: MoveLogRow[] = [];

  for (const entry of entries) {
    const lastRow = rows.at(-1);
    if (!lastRow || lastRow.turnNumber !== entry.turnNumber) {
      rows.push({
        turnNumber: entry.turnNumber,
        [entry.side]: entry,
      });
      continue;
    }
    lastRow[entry.side] = entry;
  }

  return rows;
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

function clearOutcomeDelay(timeoutRef: MutableRefObject<number | null>) {
  if (timeoutRef.current !== null) {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
}

function triggerCoachFlash(
  timeoutRef: MutableRefObject<number | null>,
  setFlashActive: (value: boolean) => void,
  reducedMotion: boolean,
) {
  clearCoachFlash(timeoutRef, setFlashActive);
  setFlashActive(true);
  timeoutRef.current = window.setTimeout(() => {
    timeoutRef.current = null;
    setFlashActive(false);
  }, reducedMotion ? 180 : 760);
}

function clearCoachFlash(
  timeoutRef: MutableRefObject<number | null>,
  setFlashActive: (value: boolean) => void,
) {
  if (timeoutRef.current !== null) {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
  setFlashActive(false);
}

function statusText(
  board: BoardState,
  thinking: boolean,
  result: 'win' | 'loss' | 'draw' | null,
  aiName?: string,
  sandboxMode?: boolean,
) {
  if (result === 'win') {
    return 'You won.';
  }
  if (result === 'loss') {
    return `${aiName ?? 'CPU'} won.`;
  }
  if (result === 'draw') {
    return 'Draw.';
  }
  if (thinking) {
    return `${aiName ?? 'CPU'} is thinking.`;
  }
  if (sandboxMode) {
    return board.turn === 'human'
      ? 'Human to move.'
      : 'CPU side to move.';
  }
  return board.turn === 'human'
    ? 'Your move.'
    : `${aiName ?? 'CPU'} to move.`;
}

function coachCopy(
  result: 'win' | 'loss' | 'draw' | null,
  analysis: MoveAnalysis | null,
  hintColumn: number | null,
) {
  if (hintColumn !== null) {
    return [
      `Hint: try ${columnLetter(hintColumn)}.`,
      'It is the cleanest practical move in this position.',
    ];
  }
  if (analysis) {
    return analysisCopy(analysis);
  }
  if (result === 'win') {
    return ['Clean finish.', 'You converted the final chance and closed the game.'];
  }
  if (result === 'loss') {
    return [
      'That line slipped.',
      'Replay the key turn and look for the immediate win, block, or center move you missed.',
    ];
  }
  if (result === 'draw') {
    return ['Solid hold.', 'You kept the position level and denied the loss.'];
  }
  return [
    'Make your move.',
    'The coach keeps your last note on screen until the new analysis is ready.',
  ];
}

function analysisCopy(analysis: MoveAnalysis) {
  const played = analysis.playedMove !== null ? columnLetter(analysis.playedMove) : null;
  const best = analysis.bestMove !== null ? columnLetter(analysis.bestMove) : null;

  if (analysis.quality === 'best') {
    return [
      played
        ? `You played ${played}, and that matches the best line.`
        : 'That matches the best line.',
      'You kept the pressure where it belonged and did not hand back an easy tactical reply.',
    ];
  }

  if (analysis.quality === 'good') {
    return [
      played && best
        ? `You played ${played}. It works, but ${best} was a little cleaner.`
        : 'Good practical move.',
      'Your move keeps the game playable, but the stronger line would have preserved a bit more pressure and denied more counterplay.',
    ];
  }

  if (analysis.quality === 'inaccuracy') {
    return [
      played && best
        ? `You played ${played}, but ${best} kept more of the edge.`
        : 'That move gives back some of the edge.',
      'Nothing collapses immediately, but the board becomes easier for the opponent to answer. Check wins, blocks, and center leverage before slower moves.',
    ];
  }

  if (analysis.quality === 'mistake') {
    return [
      played && best
        ? `You played ${played}, but ${best} was the key move here.`
        : 'That was a meaningful slip.',
      'This move lowered the position enough to give the opponent a clearer plan. The better line kept your threats alive and cut off easier replies.',
    ];
  }

  return [
    played && best
      ? `You played ${played}, but ${best} was urgent.`
      : 'That move missed an urgent idea.',
    'It gives away a major tactical resource. In spots like this, scan for immediate wins and forced blocks before anything quieter.',
  ];
}

function analysisTone(analysis: MoveAnalysis): 'best' | 'good' | 'bad' {
  return analysis.quality === 'best'
    ? 'best'
    : analysis.quality === 'good'
      ? 'good'
      : 'bad';
}

function analysisToneLabel(analysis: MoveAnalysis) {
  return analysisTone(analysis) === 'bad'
    ? 'Bad'
    : analysisTone(analysis) === 'good'
      ? 'Good'
      : 'Best';
}

function nextLadderAi(currentAiId: string) {
  const playableAis = battleAis.filter((ai) => ai.role !== 'analysis');
  const currentIndex = playableAis.findIndex((ai) => ai.id === currentAiId);
  return currentIndex >= 0 ? playableAis[currentIndex + 1] ?? null : null;
}

function columnLetter(column: number) {
  return String.fromCharCode(65 + column);
}
