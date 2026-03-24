import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { boardFromMoves } from '../../core';
import { AppStateProvider } from '../../app/state/AppStateContext';
import { GameArena } from '../../features/battle/GameArena';
import { BoardScene } from '../../features/board/BoardScene';

describe('BoardScene', () => {
  it('does not respond to keyboard shortcuts when disabled', () => {
    const onMovePreview = vi.fn();
    const onPrimaryAction = vi.fn();

    render(
      <BoardScene
        board={boardFromMoves([3, 2])}
        previewColumn={3}
        showPreview={false}
        onMovePreview={onMovePreview}
        onPrimaryAction={onPrimaryAction}
        status="Disabled board"
        disabled
      />,
    );

    fireEvent.keyDown(screen.getByRole('group', { name: 'Disabled board' }), {
      key: 'ArrowLeft',
    });
    fireEvent.keyDown(screen.getByRole('group', { name: 'Disabled board' }), {
      key: 'Enter',
    });

    expect(onMovePreview).not.toHaveBeenCalled();
    expect(onPrimaryAction).not.toHaveBeenCalled();
  });
});

describe('GameArena', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('locks the preview while a chip is still dropping and restores it after the delay', async () => {
    const { container } = render(
      <AppStateProvider>
        <GameArena title="Sandbox" description="Manual board" mode="sandbox" />
      </AppStateProvider>,
    );

    expect(container.querySelector('.board-preview--hover')).not.toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Drop in column 4' }));
    });

    expect(container.querySelectorAll('.board-chip')).toHaveLength(1);
    expect(container.querySelector('.board-preview--hover')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Drop in column 4' }));
    });
    expect(container.querySelectorAll('.board-chip')).toHaveLength(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(container.querySelector('.board-preview--hover')).not.toBeNull();
  });
});
