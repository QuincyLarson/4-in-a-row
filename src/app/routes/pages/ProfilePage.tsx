import { useMemo, useState } from 'react';

import { importSaveEnvelope } from '../../../storage/localSave';
import { useAppState } from '../../state/useAppState';
import { Card, CardGrid, Chip, InlineButton, PageSection } from './shared';

export function ProfilePage() {
  const { state, actions } = useAppState();
  const [draftName, setDraftName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [transferText, setTransferText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const nameValue = editingName ? draftName : (state.save.profile.displayName ?? '');

  const stats = useMemo(
    () => ({
      lessons: state.save.progress.completedLessonIds.length,
      bosses: state.save.progress.bossWins.length,
      reviewDue: state.save.review.entries.filter(
        (entry) => new Date(entry.dueAt).getTime() <= now,
      ).length,
      games: state.save.history.recentGames.length,
    }),
    [now, state.save],
  );

  return (
    <PageSection
      eyebrow="Profile"
      title={state.save.profile.displayName || 'Local profile'}
      body="Local settings, accessibility, and save transfer."
    >
      <CardGrid>
        <Card
          title="Progress Snapshot"
          body="A quick read on your local progress."
          accent="var(--accent)"
          footer={
            <>
              <Chip>{stats.lessons} lessons</Chip>
              <Chip tone="success">{stats.bosses} boss clears</Chip>
              <Chip>{stats.games} recent games</Chip>
            </>
          }
        >
          <p style={profile.copy}>Review due: {stats.reviewDue}</p>
          <p style={profile.copy}>Created: {new Date(state.save.profile.createdAt).toLocaleDateString()}</p>
        </Card>
      <Card title="Display Name" body="Used only in this browser.">
          <label style={profile.label}>
            Name
            <input
              value={nameValue}
              onChange={(event) => {
                setEditingName(true);
                setDraftName(event.target.value);
              }}
              style={profile.input}
            />
          </label>
          <InlineButton
            tone="accent"
            onClick={() => {
              actions.setDisplayName(nameValue);
              setEditingName(false);
              setMessage('Display name updated.');
            }}
          >
            Save name
          </InlineButton>
        </Card>
      </CardGrid>

      <CardGrid>
        <Card title="Audio & Motion" body="Control sound and motion.">
          <label style={profile.toggle}>
            <input
              type="checkbox"
              checked={state.save.settings.soundEnabled}
              onChange={(event) => actions.setSound(event.target.checked)}
            />
            Sound enabled
          </label>
          <label style={profile.toggle}>
            <input
              type="checkbox"
              checked={state.save.settings.reducedMotion}
              onChange={(event) => actions.setReducedMotion(event.target.checked)}
            />
            Reduced motion
          </label>
          <label style={profile.toggle}>
            <input
              type="checkbox"
              checked={state.save.settings.highContrast}
              onChange={(event) => actions.setHighContrast(event.target.checked)}
            />
            High contrast
          </label>
        </Card>

        <Card title="Sound cues" body="What each cue means.">
          <p style={profile.copy}>High ping: your piece is released.</p>
          <p style={profile.copy}>Low ping: the CPU releases a piece.</p>
          <p style={profile.copy}>Thunk: a piece lands in the grid.</p>
          <p style={profile.copy}>Win/loss chords: end-of-game feedback.</p>
        </Card>

        <Card title="Board Readability" body="Piece clarity and CPU tempo.">
          <label style={profile.toggle}>
            <input
              type="radio"
              name="colorMode"
              checked={state.save.settings.colorMode === 'pattern'}
              onChange={() => actions.setColorMode('pattern')}
            />
            Pattern mode
          </label>
          <label style={profile.toggle}>
            <input
              type="radio"
              name="colorMode"
              checked={state.save.settings.colorMode === 'default'}
              onChange={() => actions.setColorMode('default')}
            />
            Default color mode
          </label>
          <label style={profile.toggle}>
            <input
              type="radio"
              name="cpuMoveSpeed"
              checked={state.save.settings.cpuMoveSpeed === 'snappy'}
              onChange={() => actions.setCpuMoveSpeed('snappy')}
            />
            Snappy CPU tempo
          </label>
          <label style={profile.toggle}>
            <input
              type="radio"
              name="cpuMoveSpeed"
              checked={state.save.settings.cpuMoveSpeed === 'instant'}
              onChange={() => actions.setCpuMoveSpeed('instant')}
            />
            Instant CPU tempo
          </label>
        </Card>
      </CardGrid>

      <Card
        title="Export / Import Progress"
        body="Export or import the versioned save envelope."
        accent="var(--warning)"
      >
        <div style={profile.transferButtons}>
          <InlineButton
            onClick={() => {
              setTransferText(actions.exportSave());
              setMessage('Save exported into the text box.');
            }}
          >
            Export
          </InlineButton>
          <InlineButton
            tone="accent"
            onClick={() => {
              try {
                const imported = importSaveEnvelope(transferText);
                actions.importSave(transferText);
                setDraftName(imported.profile.displayName ?? '');
                setEditingName(false);
                setMessage('Save imported successfully.');
              } catch {
                setMessage('Import failed. Check that the JSON is complete.');
              }
            }}
          >
            Import
          </InlineButton>
          <InlineButton
            tone="danger"
            onClick={() => {
              actions.resetSave();
              setTransferText('');
              setDraftName('');
              setEditingName(false);
              setMessage('Progress reset to a fresh local profile.');
            }}
          >
            Reset progress
          </InlineButton>
        </div>
        <textarea
          value={transferText}
          onChange={(event) => setTransferText(event.target.value)}
          rows={10}
          style={profile.textarea}
        />
        {message ? <p style={profile.message}>{message}</p> : null}
      </Card>
    </PageSection>
  );
}

const profile = {
  copy: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.45,
    fontSize: '0.9rem',
  },
  label: {
    display: 'grid',
    gap: '0.4rem',
    color: 'var(--muted)',
    fontSize: '0.88rem',
  },
  input: {
    minHeight: '2.4rem',
    padding: '0.58rem 0.8rem',
    borderRadius: '0.8rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(127, 219, 255, 0.14)',
    color: 'var(--ink)',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--muted)',
    fontSize: '0.9rem',
  },
  transferButtons: {
    display: 'flex',
    gap: '0.55rem',
    flexWrap: 'wrap' as const,
  },
  textarea: {
    width: '100%',
    minHeight: '12rem',
    padding: '0.85rem',
    borderRadius: '0.85rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(127, 219, 255, 0.14)',
    color: 'var(--ink)',
    resize: 'vertical' as const,
  },
  message: {
    margin: 0,
    color: 'var(--accent)',
  },
};
