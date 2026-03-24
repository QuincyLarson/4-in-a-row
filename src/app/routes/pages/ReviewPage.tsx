import { Link } from 'react-router-dom';

import { curriculumLessons } from '../../../content';
import { useAppState } from '../../state/useAppState';
import { Card, CardGrid, Chip, PageSection } from './shared';

export function ReviewPage() {
  const {
    state: { save },
  } = useAppState();

  const dueEntries = save.review.entries
    .slice()
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt));

  const recommendedLesson = dueEntries
    .map((entry) =>
      curriculumLessons.find((lesson) =>
        lesson.steps.some((step) => step.id === entry.puzzleId || step.reviewTags?.includes(entry.conceptTag as never)),
      ),
    )
    .find(Boolean);

  return (
    <PageSection
      eyebrow="Review Queue"
      title="Bring weak patterns back until they stay fixed."
      body="Review stays light on purpose: a few positions, a clear explanation, and a visible signal that the concept is stabilizing."
    >
      {dueEntries.length === 0 ? (
        <Card
          title="Nothing due yet"
          body="As you miss puzzles, use hints, or blunder in battle, review items will queue here."
          accent="var(--success)"
          footer={<Chip tone="success">Queue clear</Chip>}
        >
          <p style={review.copy}>
            A good first session is the rules path in World 0 followed by the
            immediate-tactics checkpoint in World 1.
          </p>
          <Link to="/learn" style={review.link}>
            Open the curriculum
          </Link>
        </Card>
      ) : (
        <CardGrid>
          {dueEntries.map((entry) => (
            <Card
              key={entry.puzzleId}
              title={entry.puzzleId}
              body={`Concept: ${entry.conceptTag}`}
              accent="var(--warning)"
              footer={
                <>
                  <Chip>{entry.correct}/{entry.attempts || 0} correct</Chip>
                  <Chip tone={entry.streak >= 2 ? 'success' : 'warning'}>
                    {entry.streak >= 2 ? 'Settling in' : 'Needs reps'}
                  </Chip>
                </>
              }
            >
              <p style={review.copy}>Due {new Date(entry.dueAt).toLocaleString()}</p>
            </Card>
          ))}
        </CardGrid>
      )}

      {recommendedLesson ? (
        <Card
          title="Recommended next lesson"
          body={recommendedLesson.summary}
          accent="var(--accent)"
          footer={<Chip>{recommendedLesson.estMinutes} minutes</Chip>}
        >
          <Link to={`/lesson/${recommendedLesson.id}`} style={review.link}>
            Replay {recommendedLesson.title}
          </Link>
        </Card>
      ) : null}
    </PageSection>
  );
}

const review = {
  copy: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.7,
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'none',
    fontWeight: 600,
  },
};
