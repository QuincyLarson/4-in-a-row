import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { curriculumLessons } from '../../../content';
import { importSaveEnvelope } from '../../../storage/localSave';
import { useAppState } from '../../state/useAppState';
import { Card, InlineButton } from './shared';

export function ProfilePage() {
  const { state, actions } = useAppState();
  const [transferText, setTransferText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [now] = useState(() => Date.now());
  const totalLessons = curriculumLessons.length;

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

  useEffect(() => {
    if (!showResetModal) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowResetModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResetModal]);

  return (
    <section style={profile.page}>
      <div style={profile.layout}>
        <div style={profile.mainColumn}>
          <Card title="Progress" accent="var(--accent)">
            <p style={profile.copy}>Completed lessons: {stats.lessons} of {totalLessons}</p>
            <p style={profile.copy}>Cleared bosses: {stats.bosses}</p>
            <p style={profile.copy}>Review due: {stats.reviewDue}</p>
          </Card>

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

        </div>

        <aside style={profile.sideColumn}>
          <Card title="Coach heuristics" body="See the tactical checks and positional rules behind the coach panel.">
            <Link to="/strategy/how-learn-drop-4-coach-evaluates-moves" style={profile.link}>
              Read how the coach evaluates moves
            </Link>
          </Card>

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
                    importSaveEnvelope(transferText);
                    actions.importSave(transferText);
                    setMessage('Save imported successfully.');
                  } catch {
                    setMessage('Import failed. Check that the JSON is complete.');
                  }
                }}
              >
                Import
              </InlineButton>
            </div>
            <textarea
              value={transferText}
              onChange={(event) => setTransferText(event.target.value)}
              rows={10}
              style={profile.textarea}
            />
            <InlineButton
              tone="danger"
              onClick={() => {
                setShowResetModal(true);
              }}
            >
              Reset progress
            </InlineButton>
            {message ? <p style={profile.message}>{message}</p> : null}
          </Card>
        </aside>
      </div>

      {showResetModal ? (
        <div style={profile.modalScrim} onClick={() => setShowResetModal(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-progress-title"
            aria-describedby="reset-progress-body"
            style={profile.modal}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={profile.modalHeader}>
              <h2 id="reset-progress-title" style={profile.modalTitle}>
                Reset progress?
              </h2>
              <button
                type="button"
                aria-label="Dismiss reset warning"
                style={profile.modalDismiss}
                onClick={() => setShowResetModal(false)}
              >
                Close
              </button>
            </div>
            <p id="reset-progress-body" style={profile.modalBody}>
              This clears lessons, boss wins, and saved settings on this browser.
            </p>
            <div style={profile.modalActions}>
              <InlineButton onClick={() => setShowResetModal(false)}>Cancel</InlineButton>
              <InlineButton
                tone="danger"
                onClick={() => {
                  actions.resetSave();
                  setTransferText('');
                  setShowResetModal(false);
                  setMessage('Progress reset to a fresh local profile.');
                }}
              >
                Reset progress
              </InlineButton>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

const profile = {
  page: {
    display: 'grid',
    gap: '0.95rem',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.45fr) minmax(18rem, 0.95fr)',
    gap: '0.95rem',
    alignItems: 'start',
  },
  mainColumn: {
    display: 'grid',
    gap: '0.95rem',
  },
  sideColumn: {
    display: 'grid',
    gap: '0.95rem',
    alignSelf: 'start',
  },
  copy: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.45,
    fontSize: '0.9rem',
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
  modalScrim: {
    position: 'fixed' as const,
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    padding: '1rem',
    background: 'rgba(10, 10, 35, 0.7)',
    zIndex: 30,
  },
  modal: {
    width: 'min(100%, 28rem)',
    display: 'grid',
    gap: '0.85rem',
    padding: '1rem',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)',
    border: '1px solid rgba(255, 173, 173, 0.28)',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1rem',
  },
  modalDismiss: {
    minHeight: '2rem',
    padding: '0.2rem 0.45rem',
    borderRadius: '0.55rem',
    border: '1px solid rgba(245, 246, 247, 0.16)',
    background: 'transparent',
    color: 'var(--muted)',
    cursor: 'pointer',
  },
  modalBody: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.45,
    fontSize: '0.92rem',
  },
  modalActions: {
    display: 'flex',
    gap: '0.55rem',
    justifyContent: 'flex-end',
    flexWrap: 'wrap' as const,
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'underline',
    textUnderlineOffset: '0.18em',
    fontWeight: 600,
  },
};
