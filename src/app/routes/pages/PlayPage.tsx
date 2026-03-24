import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { battleAis } from '../../../content';
import { GameArena } from '../../../features/battle/GameArena';
import { findReviewTarget, isAiUnlocked } from '../../progression';
import { useAppState } from '../../state/useAppState';
import { PageSection } from './shared';

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
      body="Choose an opponent and keep the board, coach, and controls on one screen."
      actions={
        <div style={play.toolbar}>
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
          <div style={play.toolbarFooter}>
            <span style={play.summary}>
              {selected.name}: {selected.summary}
            </span>
            <Link to="/battle" style={play.link}>
              Full ladder
            </Link>
          </div>
        </div>
      }
    >
      <GameArena
        aiId={selected.id}
        title={`${selected.name} sparring`}
        description={`Strengths: ${selected.strengths.join(', ')}.`}
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
    gap: '0.45rem',
    color: 'var(--muted)',
    fontSize: '0.84rem',
    letterSpacing: '0.03em',
    textTransform: 'uppercase' as const,
  },
  toolbar: {
    display: 'grid',
    gap: '0.7rem',
    padding: '0.9rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(245, 246, 247, 0.08)',
    background: 'var(--surface)',
    minWidth: 'min(100%, 22rem)',
  },
  select: {
    minHeight: '2.7rem',
    padding: '0.7rem 0.9rem',
    borderRadius: '0.85rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(127, 219, 255, 0.14)',
    color: 'var(--ink)',
    fontSize: '0.98rem',
  },
  toolbarFooter: {
    display: 'grid',
    gap: '0.45rem',
  },
  summary: {
    color: 'var(--muted)',
    fontSize: '0.9rem',
    lineHeight: 1.45,
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'underline',
    textUnderlineOffset: '0.18em',
    fontWeight: 600,
    fontSize: '0.92rem',
  },
};
