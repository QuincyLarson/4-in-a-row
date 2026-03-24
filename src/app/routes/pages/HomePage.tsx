import { Link } from 'react-router-dom';

import { battleAis, curriculumWorlds } from '../../../content';
import { useAppState } from '../../state/useAppState';
import { Card, CardGrid, Chip, InlineButton, PageSection } from './shared';

export function HomePage() {
  const {
    state: { save },
  } = useAppState();

  const completedLessons = save.progress.completedLessonIds.length;
  const bossWins = save.progress.bossWins.length;

  return (
    <PageSection
      eyebrow="Quick Start"
      title="A clean board, a fast bot, and a full course."
      body="Start playing immediately or jump into the lesson path."
      actions={
        <>
          <Link to="/play" style={{ textDecoration: 'none' }}>
            <InlineButton tone="accent">Play now</InlineButton>
          </Link>
          <Link to="/learn" style={{ textDecoration: 'none' }}>
            <InlineButton>Open lessons</InlineButton>
          </Link>
        </>
      }
    >
      <CardGrid>
        <Card
          title="Progress"
          body="Saved locally."
          accent="var(--accent)"
          footer={
            <>
              <Chip>{completedLessons} lessons complete</Chip>
              <Chip tone="success">{bossWins} bosses cleared</Chip>
            </>
          }
        >
          <p style={home.copy}>
            Lessons, boss clears, and settings survive refreshes.
          </p>
        </Card>
        <Card
          title="Ladder"
          body="Warmup Bot through Endgame Engine."
          accent="var(--cpu-0)"
          footer={<Chip>{battleAis.length - 1} battle profiles + Oracle</Chip>}
        >
          <p style={home.copy}>
            Early bots feel instant. Harder tiers stay fast with worker-backed search.
          </p>
        </Card>
        <Card
          title="Course"
          body="World 0 to Capstone."
          accent="var(--warning)"
          footer={<Chip tone="warning">{curriculumWorlds.length} worlds total</Chip>}
        >
          <p style={home.copy}>
            Short lessons, quick drills, checkpoints, and bosses.
          </p>
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
};
