import { battleAis } from '../../../content';
import { isAiUnlocked } from '../../progression';
import { useAppState } from '../../state/useAppState';
import { Card, CardGrid, Chip, PageSection, RouteButton } from './shared';

export function BattlePage() {
  const {
    state: { save },
  } = useAppState();

  return (
    <PageSection
      eyebrow="Battle Ladder"
      title="Climb the ladder."
      body="Beat one level to unlock the next."
    >
      <CardGrid>
        {battleAis.map((ai) => {
          const beaten =
            save.progress.clearedAiIds.includes(ai.id) || save.progress.bossWins.includes(ai.id);
          const unlocked = isAiUnlocked(save, ai);
          const previousAi = battleAis.find((profile) => profile.level === ai.level - 1) ?? null;
          const tone =
            ai.role === 'analysis'
              ? 'var(--warning)'
              : ai.role === 'boss'
                ? 'var(--human-0)'
                : 'var(--cpu-0)';

          return (
            <Card
              key={ai.id}
              title={`Level ${ai.level}: ${ai.name}`}
              body={ai.summary}
              accent={tone}
              footer={
                <>
                  <Chip tone={beaten ? 'success' : unlocked ? 'default' : 'warning'}>
                    {beaten ? 'Cleared' : unlocked ? 'Ready' : 'Locked'}
                  </Chip>
                </>
              }
            >
              {ai.role !== 'analysis' ? (
                <RouteButton to={unlocked ? `/play?ai=${ai.id}` : '/battle'} tone={unlocked ? 'accent' : 'default'} disabled={!unlocked}>
                  {unlocked ? 'Start match' : `Beat ${previousAi?.name ?? 'the previous level'}`}
                </RouteButton>
              ) : (
                <RouteButton to={unlocked ? '/sandbox' : '/battle'} tone={unlocked ? 'accent' : 'default'} disabled={!unlocked}>
                  {unlocked ? 'Open coach' : `Beat ${previousAi?.name ?? 'the previous level'}`}
                </RouteButton>
              )}
            </Card>
          );
        })}
      </CardGrid>
    </PageSection>
  );
}
