import { useMemo, useState } from 'react';

import { useAppState } from '../../state/useAppState';
import { Card, CardGrid, Chip, InlineButton, PageSection } from './shared';

export function ProfilePage() {
  const { state, actions } = useAppState();
  const [draftName, setDraftName] = useState(state.save.profile.displayName ?? '');
  const [transferText, setTransferText] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      lessons: state.save.progress.completedLessonIds.length,
      bosses: state.save.progress.bossWins.length,
      reviewDue: state.save.review.entries.length,
      games: state.save.history.recentGames.length,
    }),
    [state.save],
  );

  return (
    <PageSection
      eyebrow="Profile & Settings"
      title={state.save.profile.displayName || 'Local profile'}
      body="Everything in this app is local-only. Sound, motion, pattern mode, contrast, and save transfer all live here."
    >
      <CardGrid>
        <Card
          title="Progress Snapshot"
          body="A quick read on curriculum progress and review load."
          accent="var(--accent)"
          footer={
            <>
              <Chip>{stats.lessons} lessons</Chip>
              <Chip tone="success">{stats.bosses} boss clears</Chip>
              <Chip>{stats.games} recent games</Chip>
            </>
          }
        >
          <p style={profile.copy}>Review due: {stats.reviewDue} items</p>
          <p style={profile.copy}>Created: {new Date(state.save.profile.createdAt).toLocaleDateString()}</p>
        </Card>
        <Card title="Display Name" body="Purely local. Used only to personalize the profile and lesson copy.">
          <label style={profile.label}>
            Name
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              style={profile.input}
            />
          </label>
          <InlineButton
            tone="accent"
            onClick={() => {
              actions.setDisplayName(draftName);
              setMessage('Display name updated.');
            }}
          >
            Save profile name
          </InlineButton>
        </Card>
      </CardGrid>

      <CardGrid>
        <Card title="Audio & Motion" body="Sound stays muted on demand. Reduced motion keeps the board readable without the extra bounce.">
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

        <Card title="Board Readability" body="Pattern mode makes the pieces distinguishable without relying on color alone.">
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
        body="The exported JSON is the versioned save envelope. Importing runs migrations before the app accepts it."
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
                actions.importSave(transferText);
                setDraftName(state.save.profile.displayName ?? '');
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
              setMessage('Progress reset to a fresh local profile.');
            }}
          >
            Reset progress
          </InlineButton>
        </div>
        <textarea
          value={transferText}
          onChange={(event) => setTransferText(event.target.value)}
          rows={14}
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
    lineHeight: 1.6,
  },
  label: {
    display: 'grid',
    gap: '0.55rem',
    color: 'var(--muted)',
  },
  input: {
    minHeight: '2.7rem',
    padding: '0.75rem 0.95rem',
    borderRadius: '0.95rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(127, 219, 255, 0.14)',
    color: 'var(--ink)',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    color: 'var(--muted)',
  },
  transferButtons: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
  },
  textarea: {
    width: '100%',
    minHeight: '18rem',
    padding: '1rem',
    borderRadius: '1rem',
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
