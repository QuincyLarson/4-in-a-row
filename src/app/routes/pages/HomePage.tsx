import { useState } from 'react';
import { curriculumLessons, curriculumWorlds } from '../../../content';
import { nextLessonForSave } from '../../progression';
import { useAppState } from '../../state/useAppState';
import { Card, CardGrid, Chip, PageSection, RouteButton } from './shared';

export function HomePage() {
  const {
    state: { save },
  } = useAppState();
  const [now] = useState(() => Date.now());

  const completedLessons = save.progress.completedLessonIds.length;
  const bossWins = save.progress.bossWins.length;
  const reviewDue = save.review.entries.filter((entry) => new Date(entry.dueAt).getTime() <= now).length;
  const nextLesson = nextLessonForSave(save) ?? curriculumLessons[0];

  return (
    <PageSection
      eyebrow="Welcome"
      title="Learn Drop 4"
      body="Play first, then learn the patterns that matter. The whole course stays local, fast, and easy to return to."
      actions={
        <>
          <RouteButton to="/play" tone="accent">Play now</RouteButton>
          <RouteButton to={`/lesson/${nextLesson.id}`}>Continue course</RouteButton>
          <RouteButton to="/review">Review queue</RouteButton>
        </>
      }
    >
      <CardGrid>
        <Card
          title="Start here"
          body="A short path that gets a new visitor moving without a wall of instructions."
          accent="var(--warning)"
          footer={
            <>
              <Chip tone="warning">Play</Chip>
              <Chip tone="success">Learn</Chip>
              <Chip>Review</Chip>
            </>
          }
        >
          <ol style={home.steps}>
            <li>Play one fast match to see how the board feels.</li>
            <li>Learn one idea per screen, then practice it right away.</li>
            <li>Use the review queue to clean up mistakes until they stick.</li>
          </ol>
        </Card>
        <Card
          title="Your progress"
          body="Saved locally and ready to resume after refresh."
          accent="var(--cpu-0)"
          footer={
            <>
              <Chip>{completedLessons}/{curriculumLessons.length} lessons</Chip>
              <Chip tone="success">{bossWins} bosses</Chip>
              <Chip tone={reviewDue > 0 ? 'warning' : 'default'}>
                {reviewDue > 0 ? `${reviewDue} due reviews` : 'No reviews due'}
              </Chip>
            </>
          }
        >
          <p style={home.copy}>
            Save data, motion settings, and completed lessons stay in localStorage only.
          </p>
        </Card>
        <Card
          title="Next up"
          body={nextLesson.title}
          accent="var(--accent)"
          footer={
            <>
              <Chip tone="warning">{nextLesson.estMinutes} min</Chip>
              <Chip>{curriculumWorlds.length} worlds</Chip>
            </>
          }
        >
          <p style={home.copy}>
            {nextLesson.summary}
          </p>
          <RouteButton to={`/lesson/${nextLesson.id}`} tone="accent">
            Continue with {nextLesson.title}
          </RouteButton>
        </Card>
      </CardGrid>
    </PageSection>
  );
}

const home = {
  copy: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.6,
  },
  steps: {
    display: 'grid',
    gap: '0.6rem',
    margin: 0,
    paddingLeft: '1.25rem',
    color: 'var(--muted)',
    lineHeight: 1.65,
  },
};
