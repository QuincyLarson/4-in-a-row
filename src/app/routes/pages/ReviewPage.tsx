import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { boardFromHumanMoves, legalMoves } from '../../../core';
import { BoardScene } from '../../../features/board/BoardScene';
import { useAppState } from '../../state/useAppState';
import {
  findReviewTarget,
  lessonSummaryForStep,
  nextReviewDueAt,
  reviewBuckets,
} from '../../progression';
import { Card, CardGrid, Chip, InlineButton, PageSection } from './shared';

export function ReviewPage() {
  const {
    state: { save },
    actions,
  } = useAppState();
  const [sessionStats, setSessionStats] = useState({ fixed: 0, repeated: 0 });
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const orderedEntries = useMemo(
    () =>
      save.review.entries
        .slice()
        .sort((left, right) => left.dueAt.localeCompare(right.dueAt)),
    [save.review.entries],
  );
  const dueNow = useMemo(
    () =>
      orderedEntries.filter((entry) => new Date(entry.dueAt).getTime() <= now),
    [now, orderedEntries],
  );
  const buckets = useMemo(() => reviewBuckets(orderedEntries), [orderedEntries]);
  const currentTarget = useMemo(
    () =>
      dueNow
        .map((entry) => ({
          entry,
          target: findReviewTarget(entry),
        }))
        .find(
          (item) =>
            item.target?.step.position &&
            item.target.step.acceptedColumns &&
            item.target.step.acceptedColumns.length > 0,
        ) ?? null,
    [dueNow],
  );

  return (
    <PageSection
      eyebrow="Review Queue"
      title="Fix the pattern now, then let it come back later."
      body="Review is deliberately short: one position, one decision, a clear result, then a scheduled return."
      actions={
        <>
          <Chip tone="warning">{dueNow.length} due now</Chip>
          <Chip>{buckets.overdue.length} overdue</Chip>
          <Chip tone="success">{buckets.stabilizing.length} stabilizing</Chip>
        </>
      }
    >
      {currentTarget ? (
        <ReviewDrill
          entry={currentTarget.entry}
          lessonTitle={currentTarget.target!.lesson.title}
          summary={lessonSummaryForStep(currentTarget.target!.lesson, currentTarget.target!.step)}
          step={currentTarget.target!.step}
          onResolved={(correct, nextDueAt) => {
            actions.resolveReview(
              currentTarget.entry.puzzleId,
              correct,
              nextDueAt,
            );
            setSessionStats((value) => ({
              fixed: value.fixed + (correct ? 1 : 0),
              repeated: value.repeated + (correct ? 0 : 1),
            }));
            setLastFeedback(
              correct
                ? `Locked in. This position comes back ${formatDueLabel(nextDueAt)}.`
                : `Queued again soon. You'll see this shape again ${formatDueLabel(nextDueAt)}.`,
            );
            setNow(Date.now());
          }}
        />
      ) : (
        <Card
          title={dueNow.length === 0 ? 'Nothing due right now' : 'Queue has no direct drill yet'}
          body={
            dueNow.length === 0
              ? 'You are caught up. Fresh mistakes from lessons and battles will return here for spaced review.'
              : 'Some review items point back to lessons rather than a standalone drill. Use the suggested lesson card below to replay the concept.'
          }
          accent={dueNow.length === 0 ? 'var(--success)' : 'var(--warning)'}
          footer={
            dueNow.length === 0 ? <Chip tone="success">Queue clear</Chip> : <Chip>Lesson replay</Chip>
          }
        >
          {sessionStats.fixed > 0 || sessionStats.repeated > 0 ? (
            <p style={review.copy}>
              Session result: {sessionStats.fixed} fixed, {sessionStats.repeated} queued again.
            </p>
          ) : null}
          {lastFeedback ? <p style={review.feedback}>{lastFeedback}</p> : null}
          <Link to="/learn" style={review.link}>
            Open the curriculum
          </Link>
        </Card>
      )}

      <CardGrid>
        <Card
          title="Session pulse"
          body="A quick read on what is urgent versus what is beginning to stick."
          accent="var(--accent)"
          footer={
            <>
              <Chip tone="warning">{dueNow.length} due now</Chip>
              <Chip>{buckets.dueSoon.length} due soon</Chip>
              <Chip tone="success">{buckets.stabilizing.length} stable reps</Chip>
            </>
          }
        >
          <p style={review.copy}>
            {sessionStats.fixed > 0 || sessionStats.repeated > 0
              ? `This session: ${sessionStats.fixed} corrected, ${sessionStats.repeated} recycled.`
              : 'Start with the first due position and keep the loop short.'}
          </p>
          {lastFeedback ? <p style={review.feedback}>{lastFeedback}</p> : null}
        </Card>

        {orderedEntries.slice(0, 6).map((entry) => {
          const target = findReviewTarget(entry);
          const statusTone =
            new Date(entry.dueAt).getTime() <= now
              ? 'warning'
              : entry.streak >= 2
                ? 'success'
                : 'default';
          return (
            <Card
              key={entry.puzzleId}
              title={target?.lesson.title ?? entry.puzzleId}
              body={target ? lessonSummaryForStep(target.lesson, target.step) : `Concept: ${entry.conceptTag}`}
              accent="var(--warning)"
              footer={
                <>
                  <Chip tone={statusTone}>
                    {new Date(entry.dueAt).getTime() <= now ? 'Due now' : 'Scheduled'}
                  </Chip>
                  <Chip>{entry.correct}/{entry.attempts || 0} correct</Chip>
                  <Chip tone={entry.streak >= 2 ? 'success' : 'warning'}>
                    {entry.streak >= 2 ? 'Settling' : 'Needs reps'}
                  </Chip>
                </>
              }
            >
              <p style={review.copy}>Next due: {new Date(entry.dueAt).toLocaleString()}</p>
              {target ? (
                <Link to={`/lesson/${target.lesson.id}`} style={review.link}>
                  Replay {target.lesson.title}
                </Link>
              ) : null}
            </Card>
          );
        })}
      </CardGrid>
    </PageSection>
  );
}

function ReviewDrill({
  entry,
  lessonTitle,
  summary,
  step,
  onResolved,
}: {
  entry: {
    puzzleId: string;
    conceptTag: string;
    dueAt: string;
    attempts: number;
    correct: number;
    streak: number;
  };
  lessonTitle: string;
  summary: string;
  step: NonNullable<ReturnType<typeof findReviewTarget>>['step'];
  onResolved: (correct: boolean, nextDueAt: string) => void;
}) {
  const board = boardFromHumanMoves(step.position?.moves ?? [], 'human');
  const accepted = step.acceptedColumns?.map((column) => column - 1) ?? [];
  const [preview, setPreview] = useState<number | null>(accepted[0] ?? legalMoves(board)[0] ?? null);
  const [hintColumn, setHintColumn] = useState<number | null>(null);

  const submitMove = (column: number) => {
    const correct = accepted.includes(column);
    onResolved(correct, nextReviewDueAt(entry, correct));
    setHintColumn(null);
  };

  return (
    <Card
      title={`Review: ${lessonTitle}`}
      body={summary}
      accent="var(--warning)"
      footer={
        <>
          <Chip tone="warning">Due now</Chip>
          <Chip>{entry.correct}/{entry.attempts || 0} correct</Chip>
          <Chip tone={entry.streak >= 2 ? 'success' : 'warning'}>
            {entry.streak >= 2 ? 'Streak building' : 'Needs reps'}
          </Chip>
        </>
      }
    >
      <BoardScene
        board={board}
        previewColumn={hintColumn ?? preview}
        onHoverColumn={(column) => {
          if (column !== null) {
            setPreview(column);
          }
        }}
        onSelectColumn={submitMove}
        onMovePreview={(direction) => {
          const moves = legalMoves(board);
          if (moves.length === 0) {
            return;
          }
          const current = preview ?? moves[0];
          const index = Math.max(0, moves.indexOf(current));
          const nextIndex = (index + direction + moves.length) % moves.length;
          setPreview(moves[nextIndex]);
        }}
        onPrimaryAction={() => {
          if (preview !== null) {
            submitMove(preview);
          }
        }}
        onHint={() => {
          const hint = step.hintColumns?.[0];
          if (typeof hint === 'number') {
            setHintColumn(hint - 1);
          }
        }}
        status={step.prompt}
      />

      <div style={review.actions}>
        <InlineButton
          onClick={() => {
            const hint = step.hintColumns?.[0];
            if (typeof hint === 'number') {
              setHintColumn(hint - 1);
            }
          }}
        >
          Show hint
        </InlineButton>
        <Link to="/learn" style={review.link}>
          Open lesson map
        </Link>
      </div>
    </Card>
  );
}

function formatDueLabel(nextDueAt: string) {
  const deltaMs = new Date(nextDueAt).getTime() - Date.now();
  const minutes = Math.round(deltaMs / 60_000);
  if (minutes < 60) {
    return `in about ${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `in about ${hours} hour${hours === 1 ? '' : 's'}`;
  }
  const days = Math.round(hours / 24);
  return `in about ${days} day${days === 1 ? '' : 's'}`;
}

const review = {
  copy: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.7,
  },
  feedback: {
    margin: 0,
    color: 'var(--warning)',
    lineHeight: 1.6,
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'none',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
};
