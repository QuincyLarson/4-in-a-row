import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppStateProvider } from '../../app/state/AppStateContext';
import { useAppState } from '../../app/state/useAppState';
import { STORAGE_KEY } from '../../storage/localSave';

function Harness() {
  const { state, actions } = useAppState();

  return (
    <div>
      <span data-testid="ready">{String(state.ready)}</span>
      <button type="button" onClick={() => actions.setReducedMotion(true)}>
        motion
      </button>
      <button type="button" onClick={() => actions.setColorMode('default')}>
        color
      </button>
      <button type="button" onClick={() => actions.setHighContrast(true)}>
        contrast
      </button>
    </div>
  );
}

describe('AppStateProvider', () => {
  it('hydrates, updates body datasets, and persists after ready', async () => {
    window.localStorage.clear();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <AppStateProvider>
        <Harness />
      </AppStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('ready')).toHaveTextContent('true');
    });

    fireEvent.click(screen.getByRole('button', { name: 'motion' }));
    fireEvent.click(screen.getByRole('button', { name: 'color' }));
    fireEvent.click(screen.getByRole('button', { name: 'contrast' }));

    await waitFor(() => {
      expect(document.body.dataset.motion).toBe('reduced');
      expect(document.body.dataset.pattern).toBe('default');
      expect(document.body.dataset.contrast).toBe('high');
    });

    expect(setItemSpy).toHaveBeenCalled();
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('"reducedMotion":true');
  });
});
