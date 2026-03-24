import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { boardFromMoves } from '../../core';
import { AppStateProvider } from '../../app/state/AppStateContext';
import { GameArena } from '../../features/battle/GameArena';
import { BoardScene } from '../../features/board/BoardScene';

describe('BoardScene', () => {
  it('moves focus to the board frame when a column is clicked, so keyboard shortcuts work', () => {
    const onMovePreview = vi.fn();
    const onPrimaryAction = vi.fn();

    render(
      <BoardScene
        board={boardFromMoves([3, 2])}
        previewColumn={3}
        onMovePreview={onMovePreview}
        onPrimaryAction={onPrimaryAction}
        status="Interactive board"
      />,
    );

    const frame = screen.getByRole('group', { name: 'Interactive board' });
    const column = screen.getByRole('button', { name: 'Drop in column 4' });

    fireEvent.mouseDown(column);
    fireEvent.click(column);

    expect(frame).toHaveFocus();

    fireEvent.keyDown(frame, { key: 'ArrowLeft' });
    fireEvent.keyDown(frame, { key: 'Enter' });

    expect(onMovePreview).toHaveBeenCalledWith(-1);
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
  });

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

  it('handles keyboard shortcuts globally when the board is not focused', () => {
    const onMovePreview = vi.fn();
    const onHint = vi.fn();

    render(
      <>
        <button type="button">Outside</button>
        <BoardScene
          board={boardFromMoves([3, 2])}
          previewColumn={3}
          onMovePreview={onMovePreview}
          onHint={onHint}
          status="Global board"
        />
      </>,
    );

    screen.getByRole('button', { name: 'Outside' }).focus();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'h' });

    expect(onMovePreview).toHaveBeenCalledWith(1);
    expect(onHint).toHaveBeenCalledTimes(1);
  });

  it('renders outcome text over the board', () => {
    render(
      <BoardScene
        board={boardFromMoves([3, 2])}
        previewColumn={3}
        status="Won board"
        outcomeLabel="You win!"
      />,
    );

    expect(screen.getByText('You win!')).toBeInTheDocument();
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
      <MemoryRouter>
        <AppStateProvider>
          <GameArena title="Sandbox" description="Manual board" mode="sandbox" />
        </AppStateProvider>
      </MemoryRouter>,
    );

    expect(container.querySelector('.board-preview--hover')).not.toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Drop in column 4' }));
    });

    expect(container.querySelectorAll('.board-chip')).toHaveLength(2);
    expect(container.querySelectorAll('.board-chip--drop-overlay')).toHaveLength(1);
    expect(container.querySelector('.board-preview--hover')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Drop in column 4' }));
    });
    expect(container.querySelectorAll('.board-chip')).toHaveLength(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(container.querySelector('.board-preview--hover')).not.toBeNull();
  });

  it('keeps the control rail rendered with match tools and coach content', () => {
    render(
      <MemoryRouter>
        <AppStateProvider>
          <GameArena aiId="warmup-bot" title="Match" description="Play the bot" />
        </AppStateProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('complementary', { name: 'Match tools' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Controls' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Coach' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show hint' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset board' })).toBeInTheDocument();
  });

  it('shows the cpu reply as a visible dropping chip before the next human turn', async () => {
    const { container } = render(
      <MemoryRouter>
        <AppStateProvider>
          <GameArena aiId="warmup-bot" title="Match" description="Play the bot" />
        </AppStateProvider>
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Drop in column 4' }));
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(520);
    });

    expect(container.querySelector('.board-chip--drop-overlay[data-owner="cpu"]')).not.toBeNull();
  });
});
