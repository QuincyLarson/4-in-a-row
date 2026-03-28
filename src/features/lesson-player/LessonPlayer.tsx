import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  applyMove,
  boardFromHumanMoves,
  chooseBattleMove,
  createBoard,
  getDropRow,
  legalMoves,
  type BoardState,
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
  | { kind: 'correct' }
  | { kind: 'complete'; visibleStars: number }
  | null;

const STEP_SUCCESS_MS = 1_000;
const LESSON_COMPLETE_MS = 900;

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
      setOverlay({ kind: 'complete', visibleStars: 0 });
      [100, 200, 300].forEach((delay, index) => {
        queueTimeout(timeoutsRef, () => {
          setOverlay({ kind: 'complete', visibleStars: index + 1 });
        }, delay);
      });
      queueTimeout(timeoutsRef, continueToNextSection, LESSON_COMPLETE_MS);
      return;
    }

    setCoachStatus(null);
    setOverlay({ kind: 'correct' });
    queueTimeout(timeoutsRef, () => {
      setOverlay(null);
      setStepIndex((value) => value + 1);
    }, STEP_SUCCESS_MS);
  }

  function handleWrong() {
    const hint = lessonHintColumn(step);
    setMistakes((value) => value + 1);
    queueStepReview(step);
    setCoachHint(hint);
    setCoachStatus(
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
              onFinish={(result) => {
                if (result === 'loss') {
                  handleWrong();
                  return;
                }
                handleCorrect();
              }}
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
                  {coachStatus ??
                    (step.type === 'concept'
                      ? 'Make the move that fits the idea.'
                      : 'Make one move.')}
                </p>
                {coachHint ? (
                  <p className="lesson-player__coachHint">Hint: column {coachHint}.</p>
                ) : null}
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
  onWrong: () => void;
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

      onWrong();
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

  if (overlay.kind === 'complete') {
    return (
      <div className="lesson-player__overlay">
        <div className="lesson-player__overlayCard lesson-player__overlayCard--complete">
          <p className="lesson-player__overlayLabel">Lesson complete</p>
          <div className="lesson-player__stars" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={`lesson-player__star${
                  overlay.visibleStars > index ? ' is-visible' : ''
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-player__overlay">
      <p className="lesson-player__floatText">Correct!</p>
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
