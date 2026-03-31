import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { curriculumLessons } from '../../../content';
import { importSaveEnvelope } from '../../../storage/localSave';
import { useAppState } from '../../state/useAppState';
import { Card, CardGrid, InlineButton } from './shared';

export function ProfilePage() {
  const { state, actions } = useAppState();
  const [draftName, setDraftName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [transferText, setTransferText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const totalLessons = curriculumLessons.length;
  const nameValue = editingName ? draftName : (state.save.profile.displayName ?? '');

  const stats = useMemo(
    () => ({
      lessons: state.save.progress.completedLessonIds.length,
      bosses: state.save.progress.bossWins.length,
      reviewDue: state.save.review.entries.filter(
        (entry) => new Date(entry.dueAt).getTime() <= now,
      ).length,
    }),
    [now, state.save],
  );

  return (
    <section style={profile.page}>
      <CardGrid>
        <Card
          title="Progress"
          accent="var(--accent)"
        >
          <p style={profile.copy}>Completed lessons: {stats.lessons} of {totalLessons}</p>
          <p style={profile.copy}>Cleared bosses: {stats.bosses}</p>
          <p style={profile.copy}>Review due: {stats.reviewDue}</p>
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

        <Card title="Coach heuristics" body="See the tactical checks and positional rules behind the coach panel.">
          <Link to="/strategy/how-learn-drop-4-coach-evaluates-moves" style={profile.link}>
            Read how the coach evaluates moves
          </Link>
        </Card>

        <Card title="Board options">
          <fieldset style={profile.group}>
            <legend style={profile.groupTitle}>Piece styling</legend>
            <p style={profile.groupBody}>
              Default uses plain color. Pattern adds marks to make yellow and blue easier to tell apart.
            </p>
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
                name="colorMode"
                checked={state.save.settings.colorMode === 'pattern'}
                onChange={() => actions.setColorMode('pattern')}
              />
              Pattern mode
            </label>
          </fieldset>

          <fieldset style={profile.group}>
            <legend style={profile.groupTitle}>CPU pace</legend>
            <p style={profile.groupBody}>
              Snappy gives the reply a short beat. Instant plays as soon as the board is ready.
            </p>
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
          </fieldset>
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
    </section>
  );
}

const profile = {
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
  group: {
    display: 'grid',
    gap: '0.5rem',
    padding: 0,
    margin: 0,
    border: 0,
    minInlineSize: 0,
  },
  groupTitle: {
    padding: 0,
    marginBottom: '0.1rem',
    color: 'var(--ink)',
    fontSize: '0.88rem',
    fontWeight: 700,
  },
  groupBody: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.45,
    fontSize: '0.88rem',
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
  link: {
    color: 'var(--accent)',
    textDecoration: 'underline',
    textUnderlineOffset: '0.18em',
    fontWeight: 600,
  },
};
