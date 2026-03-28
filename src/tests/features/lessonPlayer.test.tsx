import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { curriculumLessons } from '../../content';
import { AppStateProvider } from '../../app/state/AppStateContext';
import { LessonPlayer } from '../../features/lesson-player/LessonPlayer';

const firstLesson = curriculumLessons.find((lesson) => lesson.id === 'world-0-board-and-gravity')!;

describe('LessonPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the simplified lesson header and removes old badges/buttons', () => {
    render(
      <MemoryRouter>
        <AppStateProvider>
          <LessonPlayer lesson={firstLesson} />
        </AppStateProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Board and Gravity - Lesson 1 of 3' })).toBeInTheDocument();
    expect(screen.queryByText('Lessons > Board and Gravity')).not.toBeInTheDocument();
    expect(screen.queryByText('3 stars')).not.toBeInTheDocument();
    expect(screen.queryByText('4 min')).not.toBeInTheDocument();
    expect(screen.queryByText('1 / 3')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show hint' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next step' })).not.toBeInTheDocument();
  });

  it('drops the chip first, shows Correct!, and auto-advances to the next step', async () => {
    const { container } = render(
      <MemoryRouter>
        <AppStateProvider>
          <LessonPlayer lesson={firstLesson} />
        </AppStateProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByText('Drop a chip anywhere and watch it settle into the lowest open cell.'),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Drop in column 4' }));
    });

    expect(container.querySelector('.board-chip--drop-overlay')).not.toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(screen.getByText('Correct!')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(
      screen.getByText('Drop in the center again and watch the new chip land on top of the old one.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Board and Gravity - Lesson 2 of 3' }),
    ).toBeInTheDocument();
  });

  it('keeps wrong-answer feedback and hints in the coach rail', async () => {
    render(
      <MemoryRouter>
        <AppStateProvider>
          <LessonPlayer lesson={firstLesson} />
        </AppStateProvider>
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Drop in column 4' }));
      await vi.advanceTimersByTimeAsync(2_000);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Drop in column 1' }));
      await vi.advanceTimersByTimeAsync(1_200);
    });

    expect(screen.getByText('Use the center column and notice the stack grow upward.')).toBeInTheDocument();
    expect(screen.getByText('Hint: column 4.')).toBeInTheDocument();
  });
});
