import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { battleAis } from '../../../content';
import { GameArena } from '../../../features/battle/GameArena';
import { findReviewTarget, isAiUnlocked } from '../../progression';
import { useAppState } from '../../state/useAppState';
import { Card, PageSection } from './shared';

export function PlayPage() {
  const {
    state: { save },
    actions,
  } = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('ai') ?? 'warmup-bot';
  const playableAis = battleAis.filter((ai) => ai.role !== 'analysis');
  const unlockedAis = playableAis.filter((ai) => isAiUnlocked(save, ai));
  const selected = useMemo(
    () =>
      unlockedAis.find((ai) => ai.id === selectedId) ??
      unlockedAis[0] ??
      playableAis[0],
    [playableAis, selectedId, unlockedAis],
  );

  return (
    <PageSection
      eyebrow="Instant Play"
      title="Fast local play against the ladder."
      body="Learn Drop 4 keeps the board responsive, drops pieces in SVG, and hands harder tiers to a worker-backed AI path."
    >
      <Card title="Opponent" body={selected.summary} accent="var(--cpu-0)">
        <label style={play.label}>
          Choose AI
          <select
            value={selected.id}
            onChange={(event) => {
              searchParams.set('ai', event.target.value);
              setSearchParams(searchParams);
            }}
            style={play.select}
          >
            {playableAis.map((ai) => (
                <option key={ai.id} value={ai.id} disabled={!isAiUnlocked(save, ai)}>
                  {ai.name}
                  {!isAiUnlocked(save, ai) ? ' (locked)' : ''}
                </option>
              ))}
          </select>
        </label>
        <p style={play.copy}>Strengths: {selected.strengths.join(', ')}.</p>
        <Link to="/battle" style={play.link}>
          Open the full ladder
        </Link>
      </Card>

      <GameArena
        aiId={selected.id}
        title={`${selected.name} sparring`}
        description="Hover to preview a column, then confirm with click, tap, or keyboard."
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
    </PageSection>
  );
}

const play = {
  label: {
    display: 'grid',
    gap: '0.5rem',
    color: 'var(--muted)',
  },
  select: {
    minHeight: '2.8rem',
    padding: '0.75rem 0.95rem',
    borderRadius: '0.95rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(127, 219, 255, 0.14)',
    color: 'var(--ink)',
  },
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
