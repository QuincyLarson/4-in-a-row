import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { battleAis } from '../../../content';
import { GameArena } from '../../../features/battle/GameArena';
import { findReviewTarget, isAiUnlocked } from '../../progression';
import { useAppState } from '../../state/useAppState';
import { Card, CardGrid, InlineButton } from './shared';

export function BattlePage() {
  const {
    state: { save },
    actions,
  } = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();
  const playableAis = battleAis.filter((ai) => ai.role !== 'analysis');
  const unlockedAis = playableAis.filter((ai) => isAiUnlocked(save, ai));
  const selectedId = searchParams.get('ai') ?? unlockedAis[0]?.id ?? playableAis[0]?.id ?? 'warmup-bot';
  const selected = useMemo(
    () =>
      unlockedAis.find((ai) => ai.id === selectedId) ??
      unlockedAis[0] ??
      playableAis[0],
    [playableAis, selectedId, unlockedAis],
  );

  if (!selected) {
    return <section style={battle.page}>No battle profiles are available.</section>;
  }

  return (
    <section style={battle.page}>
      <GameArena
        aiId={selected.id}
        title={`Level ${selected.level}: ${selected.name}`}
        description={selected.summary}
        mode="battle"
        onHumanResolvedMove={(_, analysis) => {
          if (!analysis || !['inaccuracy', 'mistake', 'blunder'].includes(analysis.quality)) {
            return;
          }

          const conceptTag = selected.reviewTags[0] ?? 'review';
          const target = findReviewTarget({
            puzzleId: `battle-${selected.id}-${conceptTag}`,
            conceptTag,
            dueAt: new Date().toISOString(),
            attempts: 0,
            correct: 0,
            streak: 0,
          });

          if (!target) {
            return;
          }

          actions.queueReview({
            puzzleId: target.step.id,
            conceptTag,
            dueAt: new Date(Date.now() + 5 * 60_000).toISOString(),
            attempts: 0,
            correct: 0,
            streak: 0,
          });
        }}
      />

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
          const isSelected = selected.id === ai.id;

          return (
            <Card
              key={ai.id}
              title={`Level ${ai.level}: ${ai.name}`}
              body={ai.summary}
              accent={tone}
            >
              <p style={battle.statusLine}>
                Status: {beaten ? 'Cleared' : unlocked ? 'Ready' : 'Locked'}
                {isSelected ? ' · Current match' : ''}
              </p>
              {ai.role === 'analysis' ? (
                <p style={battle.copy}>Coach analysis is already active during your matches.</p>
              ) : (
                <InlineButton
                  tone={unlocked ? 'accent' : 'default'}
                  disabled={!unlocked}
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.set('ai', ai.id);
                    setSearchParams(nextParams);
                  }}
                >
                  {isSelected ? 'Current match' : unlocked ? 'Start match' : `Beat ${previousAi?.name ?? 'the previous level'}`}
                </InlineButton>
              )}
            </Card>
          );
        })}
      </CardGrid>
    </section>
  );
}

const battle = {
  page: {
    display: 'grid',
    gap: '0.95rem',
  },
  copy: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.45,
    fontSize: '0.9rem',
  },
  statusLine: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.35,
    fontSize: '0.78rem',
    letterSpacing: '0.01em',
  },
};
