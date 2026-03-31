import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  applyMove,
  boardFromHumanMoves,
  chooseBattleMove,
  createBoard,
  getDropRow,
  legalMoves,
  winningLinesFor,
  type BoardState,
  type Side,
} from '../../core';
import {
  curriculumByWorld,
  curriculumLessons,
  type CoachNote,
  type LessonDef,
  type LessonStep,
} from '../../content';
import { useAppState } from '../../app/state/useAppState';
import { isWorldComplete } from '../../app/progression';
import { BoardScene } from '../board/BoardScene';
import { getDropDurationMs } from '../board/motion';
import { GameArena } from '../battle/GameArena';
import './lessonPlayer.css';

type LessonPlayerProps = {
  lesson: LessonDef;
};

type LessonOverlay =
  | { kind: 'message'; text: string }
  | null;

const STEP_SUCCESS_MS = 2_000;
const LESSON_COMPLETE_MS = 2_000;
const ARENA_RESULT_SETTLE_MS = 900;

export function LessonPlayer({ lesson }: LessonPlayerProps) {
  const navigate = useNavigate();
  const { state, actions } = useAppState();
  const world = curriculumByWorld.get(lesson.worldId);
  const [stepIndex, setStepIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [coachStatus, setCoachStatus] = useState<string | null>(null);
  const [coachHint, setCoachHint] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<LessonOverlay>(null);
  const timeoutsRef = useRef<number[]>([]);
  const step = lesson.steps[stepIndex];
  const stepBoard = useMemo(
    () => (step.position ? boardFromHumanMoves(step.position.moves, 'human') : createBoard('human')),
    [step],
  );
  const stepGuidance = useMemo(() => lessonGuidance(step, stepBoard), [step, stepBoard]);
  const lessonNumber = stepIndex + 1;
  const totalLessons = lesson.steps.length;
  const usesArena = step.type === 'battle' || step.type === 'boss';
  const stars = Math.max(1, 3 - Math.floor(mistakes / 2) - (hintsUsed > 0 ? 1 : 0));

  useEffect(() => {
    return () => clearTimeouts(timeoutsRef);
  }, []);

  function queueStepReview(currentStep: LessonStep) {
    const dueAt = new Date(Date.now() + 60_000).toISOString();
    currentStep.reviewTags?.forEach((tag) => {
      actions.queueReview({
        puzzleId: currentStep.id,
        conceptTag: tag,
        dueAt,
        attempts: 0,
        correct: 0,
        streak: 0,
      });
    });
  }

  function finishLessonProgress() {
    const conceptScores = Object.fromEntries(
      lesson.tags.map((tag) => [
        tag,
        Math.max(10, (state.save.progress.conceptScores[tag] ?? 0) + stars * 6),
      ]),
    );
    actions.completeLesson(lesson.id, stars, conceptScores);
    lesson.unlocks?.forEach((unlock) => actions.unlockWorld(unlock));
    if (world) {
      const projectedSave = {
        ...state.save,
        progress: {
          ...state.save.progress,
          completedLessonIds: Array.from(
            new Set([...state.save.progress.completedLessonIds, lesson.id]),
          ),
        },
      };
      if (
        isWorldComplete(projectedSave, world) ||
        (world.lessonIds.every((lessonId) => projectedSave.progress.completedLessonIds.includes(lessonId)) &&
          (state.save.progress.bossWins.includes(world.bossAiId) || lesson.bossAiId === world.bossAiId))
      ) {
        world.unlocks.forEach((unlock) => actions.unlockWorld(unlock));
      }
    }
  }

  function continueToNextSection() {
    const lessonIndex = curriculumLessons.findIndex((item) => item.id === lesson.id);
    const nextLesson = lessonIndex >= 0 ? curriculumLessons[lessonIndex + 1] ?? null : null;
    navigate(nextLesson ? `/lesson/${nextLesson.id}` : '/learn');
  }

  function handleCorrect() {
    clearTimeouts(timeoutsRef);
    setCoachHint(null);

    if (stepIndex === lesson.steps.length - 1) {
      finishLessonProgress();
      setCoachStatus(null);
      setOverlay({ kind: 'message', text: 'Nice one' });
      queueTimeout(timeoutsRef, () => {
        setOverlay(null);
        continueToNextSection();
      }, LESSON_COMPLETE_MS);
      return;
    }

    setCoachStatus(null);
    setOverlay({ kind: 'message', text: 'Nice one' });
    queueTimeout(timeoutsRef, () => {
      setOverlay(null);
      setStepIndex((value) => value + 1);
    }, STEP_SUCCESS_MS);
  }

  function handleArenaFinish(result: 'win' | 'loss' | 'draw') {
    clearTimeouts(timeoutsRef);
    queueTimeout(timeoutsRef, () => {
      if (result === 'loss') {
        handleWrong();
        return;
      }
      handleCorrect();
    }, ARENA_RESULT_SETTLE_MS);
  }

  function handleWrong(feedback?: string) {
    const hint = lessonHintColumn(step);
    setMistakes((value) => value + 1);
    queueStepReview(step);
    setCoachHint(hint);
    setCoachStatus(
      feedback ??
        step.failureMessage ??
        (hint ? `Not quite. Try column ${hint}.` : 'Not quite. Try again.'),
    );
  }

  function handleHint() {
    const hint = lessonHintColumn(step);
    if (!hint) {
      return;
    }
    setHintsUsed((value) => value + 1);
    setCoachHint(hint);
    setCoachStatus(`Try column ${hint}.`);
  }

  return (
    <div className="lesson-player">
      <header className="lesson-player__header">
        <h1 className="lesson-player__title">
          {lesson.title} - Lesson {lessonNumber} of {totalLessons}
        </h1>
      </header>

      {usesArena ? (
        <div className="lesson-player__arenaShell">
          <div className="lesson-player__boardShell">
            <GameArena
              key={step.id}
              aiId={lesson.bossAiId ?? world?.bossAiId}
              initialMoves={step.position?.moves ?? []}
              mode="lesson"
              title={step.title}
              description={step.prompt}
              onFinish={(result) => handleArenaFinish(result)}
            />
            <LessonOverlayView overlay={overlay} />
          </div>
        </div>
      ) : (
        <div className="lesson-player__grid">
          <div className="lesson-player__main">
            <div className="lesson-player__boardShell">
              <LessonChallenge
                key={step.id}
                step={step}
                reducedMotion={state.save.settings.reducedMotion}
                disabled={overlay !== null}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onHint={handleHint}
              />
              <LessonOverlayView overlay={overlay} />
            </div>
          </div>

          <aside className="lesson-player__sidebar">
            <section className="lesson-player__coachCard">
              <h2 className="lesson-player__coachTitle">Coach</h2>
              <p className="lesson-player__prompt">{step.prompt}</p>

              <div className="lesson-player__coachState" aria-live="polite">
                <p className="lesson-player__coachStatus">
                  {coachStatus ?? stepGuidance.summary}
                </p>
                {coachHint ? (
                  <p className="lesson-player__coachHint">Hint: column {coachHint}.</p>
                ) : null}
              </div>

              <div className="lesson-player__coachExplain">
                <p className="lesson-player__coachExplainLine">
                  <strong>Why this works:</strong> {stepGuidance.whyCorrect}
                </p>
                <p className="lesson-player__coachExplainLine">
                  <strong>Why the others miss:</strong> {stepGuidance.whyNot}
                </p>
              </div>

              {step.coachNotes?.map((note: CoachNote) => (
                <article key={note.id} className="lesson-player__note">
                  <strong className="lesson-player__noteTitle">{note.title}</strong>
                  <p className="lesson-player__noteBody">{note.body}</p>
                </article>
              ))}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

function LessonChallenge({
  step,
  reducedMotion,
  disabled,
  onCorrect,
  onWrong,
  onHint,
}: {
  step: LessonStep;
  reducedMotion: boolean;
  disabled: boolean;
  onCorrect: () => void;
  onWrong: (feedback?: string) => void;
  onHint: () => void;
}) {
  const startingBoard = useMemo(
    () => (step.position ? boardFromHumanMoves(step.position.moves, 'human') : createBoard('human')),
    [step.position],
  );
  const [board, setBoard] = useState<BoardState>(startingBoard);
  const [preview, setPreview] = useState<number | null>(nearestPlayable(startingBoard, 3));
  const [hintColumn, setHintColumn] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const timeoutsRef = useRef<number[]>([]);
  const acceptedColumns = useMemo(
    () => acceptedColumnsForStep(step, startingBoard),
    [startingBoard, step],
  );

  useEffect(() => {
    return () => clearTimeouts(timeoutsRef);
  }, []);

  function resolveColumn(column: number) {
    if (disabled || locked || !legalMoves(board).includes(column)) {
      return;
    }

    const landingRow = getDropRow(board, column) ?? 0;
    const landingDelay = getDropDurationMs(landingRow, reducedMotion);
    const nextBoard = applyMove(board, column);
    const isCorrect = acceptedColumns.includes(column + 1);

    setLocked(true);
    setHintColumn(null);
    setBoard(nextBoard);
    setPreview(column);

    queueTimeout(timeoutsRef, () => {
      if (isCorrect) {
        onCorrect();
        return;
      }

      onWrong(wrongMoveFeedback(step, startingBoard, column, acceptedColumns));
      queueTimeout(timeoutsRef, () => {
        setBoard(startingBoard);
        setPreview(nearestPlayable(startingBoard, column));
        setLocked(false);
      }, 260);
    }, landingDelay + 40);
  }

  return (
    <div className="lesson-player__boardStage">
      <BoardScene
        board={board}
        previewColumn={hintColumn ?? preview}
        reducedMotion={reducedMotion}
        onHoverColumn={(column) => {
          if (column !== null) {
            setPreview(column);
          }
        }}
        onSelectColumn={resolveColumn}
        onMovePreview={(direction) => {
          const legal = legalMoves(board);
          if (legal.length === 0) {
            return;
          }
          const current = preview ?? legal[0];
          const index = legal.indexOf(current);
          const nextIndex = (index + direction + legal.length) % legal.length;
          setPreview(legal[nextIndex]);
        }}
        onPrimaryAction={() => {
          if (preview !== null) {
            resolveColumn(preview);
          }
        }}
        onHint={() => {
          const hint = lessonHintColumn(step);
          if (hint) {
            setHintColumn(hint - 1);
          }
          onHint();
        }}
        status={step.prompt}
        disabled={disabled || locked}
      />
    </div>
  );
}

function LessonOverlayView({ overlay }: { overlay: LessonOverlay }) {
  if (!overlay) {
    return null;
  }

  return (
    <div className="lesson-player__overlay">
      <p className="lesson-player__floatText">{overlay.text}</p>
    </div>
  );
}

function acceptedColumnsForStep(step: LessonStep, board: BoardState) {
  if (step.acceptedColumns && step.acceptedColumns.length > 0) {
    return step.acceptedColumns;
  }
  if (step.hintColumns && step.hintColumns.length > 0) {
    return step.hintColumns;
  }
  const best = chooseBattleMove(board, 2).column;
  return [best === null ? 4 : best + 1];
}

function lessonHintColumn(step: LessonStep) {
  if (step.hintColumns && step.hintColumns.length > 0) {
    return step.hintColumns[0];
  }
  const board = step.position ? boardFromHumanMoves(step.position.moves, 'human') : createBoard('human');
  const best = chooseBattleMove(board, 2).column;
  return best === null ? 4 : best + 1;
}

function lessonGuidance(step: LessonStep, board: BoardState) {
  const accepted = acceptedColumnsForStep(step, board);
  const legal = legalMoves(board).map((column) => column + 1);
  const humanWins = immediateWinningColumns(board, 'human');
  const cpuWins = immediateWinningColumns(board, 'cpu');
  const primary = accepted[0];
  const promptFallback =
    step.type === 'concept'
      ? 'Make the move that fits the idea.'
      : 'Make one move that matches the position.';

  if (accepted.length >= legal.length && legal.length > 0) {
    return {
      summary: 'Any legal column works here. Focus on the board mechanic this step is teaching.',
      whyCorrect:
        'This position is about watching gravity do the work. You choose a column and the chip falls to the lowest open square.',
      whyNot:
        'There is no hidden trick yet. The real point is noticing where the chip actually lands.',
    };
  }

  if (accepted.length > 1) {
    return {
      summary: `Accepted moves: ${formatColumns(accepted)}. They all fit the same idea here.`,
      whyCorrect: multiMoveReason(step, accepted),
      whyNot:
        'The unaccepted moves are legal, but they miss the lesson idea and leave you with less pressure, less control, or less support.',
    };
  }

  if (primary && humanWins.includes(primary)) {
    return {
      summary: `Column ${primary} is the move. It wins immediately.`,
      whyCorrect: `Column ${primary} completes a ${winningLineKind(board, 'human', primary)} four right now.`,
      whyNot:
        'The other legal moves do not finish the line, so they pass up a win that is already on the board.',
    };
  }

  if (primary && cpuWins.includes(primary)) {
    return {
      summary: `Column ${primary} is urgent. It cuts off the opponent's immediate win.`,
      whyCorrect: `If you do not play column ${primary}, the opponent can win there on the next move.`,
      whyNot:
        'Any other move leaves that threat standing, so the tactic still belongs to the opponent.',
    };
  }

  if (primary) {
    return {
      summary: step.successMessage ?? promptFallback,
      whyCorrect: conceptReason(step, primary, board),
      whyNot: contrastReason(step, primary),
    };
  }

  return {
    summary: promptFallback,
    whyCorrect: 'This move matches the key idea the board is trying to teach.',
    whyNot: 'The other legal moves miss the main point of the position.',
  };
}

function wrongMoveFeedback(
  step: LessonStep,
  board: BoardState,
  selectedColumn: number,
  accepted: number[],
) {
  const played = selectedColumn + 1;
  const target = accepted[0];
  const humanWins = immediateWinningColumns(board, 'human');
  const cpuWins = immediateWinningColumns(board, 'cpu');

  if (target && humanWins.includes(target) && !humanWins.includes(played)) {
    return `Column ${played} is legal, but it does not finish the winning line. Column ${target} wins immediately.`;
  }

  if (target && cpuWins.includes(target) && played !== target) {
    return `Column ${played} leaves the opponent's winning square open. Column ${target} is the block you cannot skip.`;
  }

  if (accepted.length > 1) {
    return `Column ${played} misses the lesson idea here. Stay with ${formatColumns(accepted)} instead.`;
  }

  if (target) {
    return `Column ${played} is playable, but column ${target} fits this position better. ${contrastReason(
      step,
      target,
    )}`;
  }

  return step.failureMessage ?? 'Not quite. Try again.';
}

function immediateWinningColumns(board: BoardState, side: Side) {
  const probe = { ...board, turn: side, winner: null, isDraw: false };
  return legalMoves(probe)
    .filter((column) => applyMove(probe, column).winner === side)
    .map((column) => column + 1);
}

function winningLineKind(board: BoardState, side: Side, humanColumn: number) {
  const moved = applyMove(
    { ...board, turn: side, winner: null, isDraw: false },
    humanColumn - 1,
  );
  const line = winningLinesFor(moved, side)[0];
  if (!line) {
    return 'four';
  }

  const [a, b] = line.cells;
  if (a.col === b.col) {
    return 'vertical';
  }
  if (a.row === b.row) {
    return 'horizontal';
  }
  return 'diagonal';
}

function conceptReason(step: LessonStep, target: number, board: BoardState) {
  const tags = step.reviewTags ?? [];
  if (tags.includes('rules')) {
    const landingRow = getDropRow(board, target - 1);
    if (landingRow !== null && landingRow > 0) {
      return `Column ${target} is right because the chip lands on the stack that is already there. That is the exact gravity pattern this step is teaching.`;
    }
    return `Column ${target} is right because it shows the board mechanic cleanly: you choose the column, and gravity chooses the row.`;
  }
  if (tags.includes('center') || tags.includes('opening')) {
    return `Column ${target} is right because it keeps more future lines alive and gives you better central reach.`;
  }
  if (tags.includes('threat')) {
    return `Column ${target} is right because it creates pressure the opponent has to answer, instead of adding a quiet chip.`;
  }
  if (tags.includes('double-threat')) {
    return `Column ${target} is right because it builds toward two problems at once, or prevents that split before it appears.`;
  }
  if (tags.includes('diagonal')) {
    return `Column ${target} is right because it creates or protects the support square the diagonal needs.`;
  }
  if (tags.includes('parity') || tags.includes('endgame') || tags.includes('defense')) {
    return `Column ${target} is right because it keeps control of the important timing square instead of handing that access away.`;
  }
  return `Column ${target} is the move that matches the pattern this step is training.`;
}

function contrastReason(step: LessonStep, target: number) {
  const tags = step.reviewTags ?? [];
  if (tags.includes('rules')) {
    return 'The other moves avoid the exact stack or landing pattern this step wants you to notice.';
  }
  if (tags.includes('center') || tags.includes('opening')) {
    return `The other moves are legal, but they give you less influence and less flexibility than column ${target}.`;
  }
  if (tags.includes('threat')) {
    return 'The other moves add a chip without forcing a reply, so they do not create the same pressure.';
  }
  if (tags.includes('double-threat')) {
    return 'The other moves leave only one easy idea on the board, which is much easier for the opponent to answer.';
  }
  if (tags.includes('diagonal')) {
    return 'The other moves do not make the diagonal playable, or they ignore the support square that matters first.';
  }
  if (tags.includes('parity') || tags.includes('endgame') || tags.includes('defense')) {
    return 'The other moves look active, but they give away the timing or access that actually decides the position.';
  }
  return 'The other moves miss the main point of the position.';
}

function multiMoveReason(step: LessonStep, accepted: number[]) {
  const acceptedText = formatColumns(accepted);
  const tags = step.reviewTags ?? [];
  if (tags.includes('center') || tags.includes('opening')) {
    return `${acceptedText} all keep the structure healthy and preserve central influence.`;
  }
  if (tags.includes('double-threat') || tags.includes('threat')) {
    return `${acceptedText} all keep the same forcing idea alive.`;
  }
  return `${acceptedText} all satisfy the tactical idea this step is teaching.`;
}

function formatColumns(columns: number[]) {
  if (columns.length === 1) {
    return `column ${columns[0]}`;
  }
  if (columns.length === 2) {
    return `columns ${columns[0]} and ${columns[1]}`;
  }
  return `columns ${columns.slice(0, -1).join(', ')}, and ${columns.at(-1)}`;
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

function queueTimeout(ref: MutableRefObject<number[]>, cb: () => void, delayMs: number) {
  const timeoutId = window.setTimeout(() => {
    ref.current = ref.current.filter((entry) => entry !== timeoutId);
    cb();
  }, delayMs);
  ref.current.push(timeoutId);
}

function clearTimeouts(ref: MutableRefObject<number[]>) {
  ref.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
  ref.current = [];
}
