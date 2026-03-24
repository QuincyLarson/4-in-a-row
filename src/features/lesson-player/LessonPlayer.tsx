import { useMemo, useState } from 'react';

import { boardFromHumanMoves, chooseBattleMove, legalMoves } from '../../core';
import {
  curriculumByWorld,
  type CoachNote,
  type LessonDef,
  type LessonStep,
} from '../../content';
import { useAppState } from '../../app/state/useAppState';
import { BoardScene } from '../board/BoardScene';
import { GameArena } from '../battle/GameArena';

type LessonPlayerProps = {
  lesson: LessonDef;
};

export function LessonPlayer({ lesson }: LessonPlayerProps) {
  const { state, actions } = useAppState();
  const world = curriculumByWorld.get(lesson.worldId);
  const [stepIndex, setStepIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);
  const [resolvedSteps, setResolvedSteps] = useState<Record<string, boolean>>({});
  const [stepFeedback, setStepFeedback] = useState<string | null>(null);
  const step = lesson.steps[stepIndex];
  const progress = `${stepIndex + 1} / ${lesson.steps.length}`;
  const stars = Math.max(1, 3 - Math.floor(mistakes / 2) - (hints > 0 ? 1 : 0));

  const authoredBoard = useMemo(() => {
    if (!step.position) {
      return null;
    }
    return boardFromHumanMoves(step.position.moves, 'human');
  }, [step.position]);

  const nextHint =
    step.hintColumns?.[0] ??
    (authoredBoard ? chooseBattleMove(authoredBoard, 2).column ?? undefined : undefined);

  function markResolved(currentStep: LessonStep, success = true) {
    setResolvedSteps((previous) => ({ ...previous, [currentStep.id]: true }));
    if (!success) {
      setMistakes((value) => value + 1);
    }
  }

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

  function finishLesson() {
    const conceptScores = Object.fromEntries(
      lesson.tags.map((tag: LessonDef['tags'][number]) => [
        tag,
        Math.max(10, (state.save.progress.conceptScores[tag] ?? 0) + stars * 6),
      ]),
    );
    actions.completeLesson(lesson.id, stars, conceptScores);
    lesson.unlocks?.forEach((unlock: string) => actions.unlockWorld(unlock));
    world?.unlocks.forEach((unlock: string) => actions.unlockWorld(unlock));
    setStepFeedback(`Lesson complete. ${stars} star${stars === 1 ? '' : 's'} earned.`);
  }

  const stepResolved = !!resolvedSteps[step.id];

  return (
    <div style={lessonStyles.frame}>
      <header style={lessonStyles.header}>
        <div>
          <p style={lessonStyles.eyebrow}>{world?.title ?? lesson.worldId}</p>
          <h1 style={lessonStyles.title}>{lesson.title}</h1>
          <p style={lessonStyles.summary}>{lesson.summary}</p>
        </div>
        <div style={lessonStyles.meta}>
          <span style={lessonStyles.metaPill}>{progress}</span>
          <span style={lessonStyles.metaPill}>{lesson.estMinutes} min</span>
          <span style={lessonStyles.metaPill}>{stars} stars</span>
        </div>
      </header>

      <div style={lessonStyles.grid}>
        <div style={lessonStyles.main}>
          {step.type === 'battle' || step.type === 'boss' ? (
            <GameArena
              key={step.id}
              aiId={lesson.bossAiId ?? world?.bossAiId}
              initialMoves={step.position?.moves ?? []}
              mode="lesson"
              title={step.title}
              description={step.prompt}
              onFinish={(result) => {
                if (result === 'loss') {
                  setMistakes((value) => value + 1);
                  queueStepReview(step);
                  setStepFeedback(step.failureMessage ?? 'That run gave away the key idea. Try again.');
                  return;
                }
                markResolved(step);
                setStepFeedback(step.successMessage ?? 'Strong clear. Move on when you are ready.');
              }}
            />
          ) : step.type === 'concept' ? (
            <div style={lessonStyles.staticBoard}>
              {authoredBoard ? (
                <BoardScene
                  board={authoredBoard}
                  previewColumn={null}
                  status={step.prompt}
                  disabled
                />
              ) : null}
            </div>
          ) : (
            <LessonChallenge
              key={step.id}
              step={step}
              onCorrect={() => {
                markResolved(step);
                setStepFeedback(step.successMessage ?? 'Good. You matched the lesson idea.');
              }}
              onWrong={() => {
                setMistakes((value) => value + 1);
                queueStepReview(step);
                setStepFeedback(step.failureMessage ?? 'That move gives away the point of the position.');
              }}
              onHintUsed={() => {
                setHints((value) => value + 1);
                if (nextHint) {
                  setStepFeedback(`Hint: try column ${nextHint}.`);
                }
              }}
            />
          )}
        </div>

        <aside style={lessonStyles.sidebar}>
          <section style={lessonStyles.coachCard}>
            <h2 style={lessonStyles.panelTitle}>Coach</h2>
            <p style={lessonStyles.coachPrompt}>{step.prompt}</p>
            {step.coachNotes?.map((note: CoachNote) => (
              <article key={note.id} style={lessonStyles.note}>
                <strong style={lessonStyles.noteTitle}>{note.title}</strong>
                <p style={lessonStyles.noteBody}>{note.body}</p>
              </article>
            ))}
            {stepFeedback ? <p style={lessonStyles.feedback}>{stepFeedback}</p> : null}
          </section>

          <section style={lessonStyles.coachCard}>
            <h2 style={lessonStyles.panelTitle}>Lesson controls</h2>
            <div style={lessonStyles.actions}>
              {step.type !== 'concept' ? (
                <button
                  type="button"
                  style={lessonStyles.button}
                  onClick={() => {
                    setHints((value) => value + 1);
                    if (nextHint) {
                      setStepFeedback(`Hint: the lesson points toward column ${nextHint}.`);
                    }
                  }}
                >
                  Show hint
                </button>
              ) : null}
              <button
                type="button"
                style={lessonStyles.buttonAccent}
                disabled={!stepResolved && step.type !== 'concept'}
                onClick={() => {
                  if (stepIndex === lesson.steps.length - 1) {
                    finishLesson();
                    return;
                  }
                  setStepIndex((value) => value + 1);
                  setStepFeedback(null);
                }}
              >
                {stepIndex === lesson.steps.length - 1 ? 'Finish lesson' : 'Next step'}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function LessonChallenge({
  step,
  onCorrect,
  onWrong,
  onHintUsed,
}: {
  step: LessonStep;
  onCorrect: () => void;
  onWrong: () => void;
  onHintUsed: () => void;
}) {
  const board = useMemo(
    () => (step.position ? boardFromHumanMoves(step.position.moves, 'human') : null),
    [step.position],
  );
  const [preview, setPreview] = useState<number | null>(3);
  const [hintColumn, setHintColumn] = useState<number | null>(null);

  if (!board) {
    return null;
  }

  return (
    <BoardScene
      board={board}
      previewColumn={hintColumn ?? preview}
      onHoverColumn={(column) => {
        if (column !== null) {
          setPreview(column);
        }
      }}
      onSelectColumn={(column) => {
        const correct = step.acceptedColumns?.includes(column + 1) ?? false;
        if (correct) {
          onCorrect();
        } else {
          onWrong();
        }
      }}
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
          const correct = step.acceptedColumns?.includes(preview + 1) ?? false;
          if (correct) {
            onCorrect();
          } else {
            onWrong();
          }
        }
      }}
      onHint={() => {
        const hint = step.hintColumns?.[0];
        if (hint) {
          setHintColumn(hint - 1);
        }
        onHintUsed();
      }}
      status={step.prompt}
    />
  );
}

const lessonStyles = {
  frame: {
    display: 'grid',
    gap: '1.5rem',
  },
  header: {
    display: 'grid',
    gap: '0.8rem',
  },
  eyebrow: {
    margin: 0,
    color: 'var(--accent)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.18em',
    fontSize: '0.8rem',
  },
  title: {
    margin: '0.35rem 0 0',
    fontSize: '2rem',
  },
  summary: {
    margin: '0.4rem 0 0',
    color: 'var(--muted)',
    lineHeight: 1.7,
  },
  meta: {
    display: 'flex',
    gap: '0.65rem',
    flexWrap: 'wrap' as const,
  },
  metaPill: {
    display: 'inline-flex',
    padding: '0.35rem 0.75rem',
    borderRadius: '999px',
    background: 'rgba(127, 219, 255, 0.08)',
    color: 'var(--accent-2)',
  },
  grid: {
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))',
  },
  main: {
    display: 'grid',
    gap: '1rem',
  },
  staticBoard: {
    padding: '1rem',
    borderRadius: '1.2rem',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(127, 219, 255, 0.12)',
  },
  sidebar: {
    display: 'grid',
    gap: '1rem',
    alignContent: 'start',
  },
  coachCard: {
    display: 'grid',
    gap: '0.85rem',
    padding: '1rem',
    borderRadius: '1.2rem',
    background:
      'linear-gradient(180deg, rgba(19, 34, 56, 0.9), rgba(12, 23, 40, 0.96))',
    border: '1px solid rgba(120, 231, 255, 0.18)',
  },
  panelTitle: {
    margin: 0,
    fontSize: '1rem',
  },
  coachPrompt: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.7,
  },
  note: {
    display: 'grid',
    gap: '0.3rem',
  },
  noteTitle: {
    color: 'var(--accent)',
  },
  noteBody: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.7,
  },
  feedback: {
    margin: 0,
    color: 'var(--warning)',
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.65rem',
  },
  button: {
    minHeight: '2.6rem',
    padding: '0.7rem 1rem',
    borderRadius: '0.9rem',
    border: '1px solid rgba(127, 219, 255, 0.14)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'var(--ink)',
  },
  buttonAccent: {
    minHeight: '2.6rem',
    padding: '0.7rem 1rem',
    borderRadius: '0.9rem',
    border: '1px solid rgba(127, 219, 255, 0.28)',
    background:
      'linear-gradient(135deg, rgba(127, 219, 255, 0.2), rgba(113, 247, 213, 0.14))',
    color: 'var(--ink)',
  },
};
