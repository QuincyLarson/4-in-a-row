import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { battleAis } from '../../../content';
import { GameArena } from '../../../features/battle/GameArena';
import { Card, PageSection } from './shared';

export function PlayPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('ai') ?? 'warmup-bot';
  const selected = useMemo(
    () => battleAis.find((ai) => ai.id === selectedId) ?? battleAis[0],
    [selectedId],
  );

  return (
    <PageSection
      eyebrow="Instant Play"
      title="Fast local play against the ladder."
      body="The board responds immediately, the chips drop in SVG, and medium-plus tiers hand off search work to a worker-friendly AI path."
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
            {battleAis
              .filter((ai) => ai.role !== 'analysis')
              .map((ai) => (
                <option key={ai.id} value={ai.id}>
                  {ai.name}
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
