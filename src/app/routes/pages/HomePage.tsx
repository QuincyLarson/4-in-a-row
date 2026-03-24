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
      eyebrow="Onboarding"
      title="The first ten minutes should already feel sharp."
      body="Start with rules in minutes, lock in the tactical scan, then climb through worlds on center control, threats, forks, diagonals, parity, openings, and endgame conversion."
      actions={
        <>
          <Link to="/learn" style={{ textDecoration: 'none' }}>
            <InlineButton tone="accent">Open the curriculum</InlineButton>
          </Link>
          <Link to="/play" style={{ textDecoration: 'none' }}>
            <InlineButton>Jump into play</InlineButton>
          </Link>
        </>
      }
    >
      <CardGrid>
        <Card
          title="Your Progress"
          body="Local-only progression survives refreshes, browser restarts, and GitHub Pages deployment."
          accent="var(--accent)"
          footer={
            <>
              <Chip>{completedLessons} lessons complete</Chip>
              <Chip tone="success">{bossWins} bosses cleared</Chip>
            </>
          }
        >
          <p style={home.copy}>
            Worlds unlock in order, review items come back automatically, and the
            profile page can export or reset the versioned save envelope.
          </p>
        </Card>
        <Card
          title="Battle Ladder"
          body="Nine named opponents cover warmup tactics through the parity-aware endgame tier."
          accent="var(--cpu-0)"
          footer={<Chip>{battleAis.length - 1} battle profiles + Oracle</Chip>}
        >
          <p style={home.copy}>
            Easy tiers feel instant. Harder tiers stay worker-friendly and still bias
            toward fast practical play instead of brute-force depth.
          </p>
        </Card>
        <Card
          title="10-Hour Map"
          body="The full path is authored and ready: worlds 0 through 8, then the capstone exam and gauntlet."
          accent="var(--warning)"
          footer={<Chip tone="warning">{curriculumWorlds.length} worlds total</Chip>}
        >
          <p style={home.copy}>
            Each world contains compact lessons, drills, a checkpoint, and a named
            boss that pressures the idea you just learned.
          </p>
        </Card>
      </CardGrid>

      <CardGrid>
        <Card title="Learn Loop" body="Concept card, guided move, drills, reflection, unlock.">
          <ul style={home.list}>
            <li>World 0 teaches the board, gravity, winning lines, and first blocks.</li>
            <li>Worlds 1-4 build tactical hygiene, center value, threats, and forks.</li>
            <li>Worlds 5-8 cover diagonals, parity, openings, and conversion.</li>
          </ul>
        </Card>
        <Card title="Review Loop" body="Mistakes feed a small due queue instead of vanishing.">
          <ul style={home.list}>
            <li>Missed puzzle patterns are tagged by concept.</li>
            <li>Hints and battle blunders can schedule extra review.</li>
            <li>The goal is to create a visible “you fixed this” moment.</li>
          </ul>
        </Card>
        <Card title="Accessibility" body="Pattern mode, high contrast, reduced motion, keyboard play, and sound toggles are all first-class settings.">
          <ul style={home.list}>
            <li>Human and CPU chips use different inner motifs, not color alone.</li>
            <li>Reduced motion preserves clarity while removing the extra bounce.</li>
            <li>Sound cues remain optional and are documented in settings copy.</li>
          </ul>
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
  list: {
    margin: 0,
    paddingLeft: '1rem',
    color: 'var(--muted)',
    lineHeight: 1.7,
  },
};
