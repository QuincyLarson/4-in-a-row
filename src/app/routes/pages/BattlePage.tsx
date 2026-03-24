import { Link } from 'react-router-dom';

import { battleAis } from '../../../content';
import { isAiUnlocked } from '../../progression';
import { useAppState } from '../../state/useAppState';
import { Card, CardGrid, Chip, PageSection } from './shared';

export function BattlePage() {
  const {
    state: { save },
  } = useAppState();

  return (
    <PageSection
      eyebrow="Battle Ladder"
      title="Named opponents that teach through pressure."
      body="Warmup Bot gets you moving. The bosses punish exactly the concepts the lessons are trying to install."
    >
      <CardGrid>
        {battleAis.map((ai) => {
          const beaten = save.progress.bossWins.includes(ai.id);
          const unlocked = isAiUnlocked(save, ai);
          const tone =
            ai.role === 'analysis'
              ? 'var(--warning)'
              : ai.role === 'boss'
                ? 'var(--human-0)'
                : 'var(--cpu-0)';

          return (
            <Card
              key={ai.id}
              title={ai.name}
              body={ai.summary}
              accent={tone}
              footer={
                <>
                  <Chip>Level {ai.level}</Chip>
                  <Chip tone={beaten ? 'success' : unlocked ? 'default' : 'warning'}>
                    {beaten
                      ? 'Cleared'
                      : ai.role === 'analysis'
                        ? unlocked
                          ? 'Analysis'
                          : 'Locked'
                        : unlocked
                          ? 'Available'
                          : 'Locked'}
                  </Chip>
                  <Chip>{ai.tacticalBudgetMs}ms target</Chip>
                </>
              }
            >
              <ul style={battle.list}>
                {ai.strengths.map((strength) => (
                  <li key={strength}>{strength}</li>
                ))}
              </ul>
              {ai.role !== 'analysis' ? (
                <Link
                  to={unlocked ? `/play?ai=${ai.id}` : '/learn'}
                  style={{
                    ...battle.link,
                    opacity: unlocked ? 1 : 0.7,
                  }}
                >
                  {unlocked ? 'Start this matchup' : 'Unlock in Learn'}
                </Link>
              ) : (
                <Link
                  to={unlocked ? '/sandbox' : '/learn'}
                  style={{
                    ...battle.link,
                    opacity: unlocked ? 1 : 0.7,
                  }}
                >
                  {unlocked ? 'Open analysis sandbox' : 'Reach Oracle to unlock'}
                </Link>
              )}
            </Card>
          );
        })}
      </CardGrid>
    </PageSection>
  );
}

const battle = {
  list: {
    margin: 0,
    paddingLeft: '1rem',
    color: 'var(--muted)',
    lineHeight: 1.7,
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'none',
    fontWeight: 600,
  },
};
