import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppShell } from '../../app/layout/AppShell';
import { AboutPage } from '../../app/routes/pages/AboutPage';
import { BattlePage } from '../../app/routes/pages/BattlePage';
import { CreditsPage } from '../../app/routes/pages/CreditsPage';
import { HomePage } from '../../app/routes/pages/HomePage';
import { LearnPage } from '../../app/routes/pages/LearnPage';
import { LessonPage } from '../../app/routes/pages/LessonPage';
import { PlayPage } from '../../app/routes/pages/PlayPage';
import { ProfilePage } from '../../app/routes/pages/ProfilePage';
import { ReviewPage } from '../../app/routes/pages/ReviewPage';
import { SandboxPage } from '../../app/routes/pages/SandboxPage';
import { StrategyPage } from '../../app/routes/pages/StrategyPage';
import { AppStateProvider } from '../../app/state/AppStateContext';
import { exportSaveEnvelope, persistSaveEnvelope } from '../../storage/localSave';
import { createDefaultSave } from '../../storage/migrations';

const NOW = new Date('2026-03-24T12:00:00.000Z');

function makeSave() {
  return createDefaultSave(NOW);
}

function renderRoute(initialEntry: string, save = makeSave()) {
  window.localStorage.clear();
  persistSaveEnvelope(save);
  document.head.innerHTML = '<meta name="description" content="">';

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppStateProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="learn" element={<LearnPage />} />
            <Route path="play" element={<PlayPage />} />
            <Route path="battle" element={<BattlePage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="strategy/:slug" element={<StrategyPage />} />
            <Route path="sandbox" element={<SandboxPage />} />
            <Route path="credits" element={<CreditsPage />} />
            <Route path="lesson/:lessonId" element={<LessonPage />} />
          </Route>
        </Routes>
      </AppStateProvider>
    </MemoryRouter>,
  );
}

describe('app routes', () => {
  let dateNowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(NOW.getTime());
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it('updates shell metadata for strategy and lesson routes', async () => {
    renderRoute('/strategy/how-to-win-connect-4');

    await screen.findByRole('heading', { name: 'How to Win Connect Four' });
    expect(document.title).toBe('Strategy - Learn Drop 4');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain(
      'strategy guides',
    );

    renderRoute('/lesson/world-0-board-and-gravity');

    await screen.findByRole('heading', { name: 'The board and gravity' });
    expect(document.title).toBe('Lesson - Learn Drop 4');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain(
      'board-first lesson',
    );
  });

  it('shows an accurate due count on the home page and resumes the next unlocked lesson', async () => {
    const save = makeSave();
    save.progress.completedLessonIds.push('world-0-board-and-gravity');
    save.review.entries.push(
      {
        puzzleId: 'due-item',
        conceptTag: 'review',
        dueAt: '2026-03-24T11:55:00.000Z',
        attempts: 0,
        correct: 0,
        streak: 0,
      },
      {
        puzzleId: 'scheduled-item',
        conceptTag: 'review',
        dueAt: '2026-03-25T12:00:00.000Z',
        attempts: 0,
        correct: 0,
        streak: 0,
      },
    );

    renderRoute('/', save);

    await screen.findByText('Your progress');
    expect(screen.getByText('1 due reviews')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Three win directions' })).toBeInTheDocument();
  });

  it('gates the ladder and the play page to unlocked opponents', async () => {
    renderRoute('/battle');

    await screen.findByRole('heading', { name: 'Named opponents that teach through pressure.' });
    expect(screen.getByText('Center Sentinel')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Unlock in Learn' }).length).toBeGreaterThan(0);

    renderRoute('/play?ai=endgame-engine');

    await screen.findByRole('heading', { name: 'Fast local play against the ladder.' });
    const select = screen.getByLabelText('Choose AI') as HTMLSelectElement;
    expect(select.value).toBe('warmup-bot');
    expect(screen.getByRole('option', { name: 'Endgame Engine (locked)' })).toBeDisabled();
  });

  it('hydrates the profile name from saved progress and round-trips import and export', async () => {
    const save = makeSave();
    save.profile.displayName = 'Quincy';
    const importedSave = makeSave();
    importedSave.profile.displayName = 'Ada';

    renderRoute('/profile', save);

    const nameInput = (await screen.findByLabelText('Name')) as HTMLInputElement;
    expect(nameInput.value).toBe('Quincy');

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    const textarea = screen.getAllByRole('textbox')[1] as HTMLTextAreaElement;
    expect(textarea.value).toContain('"displayName": "Quincy"');

    fireEvent.change(textarea, {
      target: {
        value: exportSaveEnvelope(importedSave),
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(nameInput.value).toBe('Ada');
    });
    expect(screen.getByText('Save imported successfully.')).toBeInTheDocument();
  });

  it('runs a due review drill and reschedules it after a correct answer', async () => {
    const save = makeSave();
    save.review.entries.push({
      puzzleId: 'world-0-first-win-drill-1',
      conceptTag: 'win-in-1',
      dueAt: '2026-03-24T11:45:00.000Z',
      attempts: 0,
      correct: 0,
      streak: 0,
    });

    renderRoute('/review', save);

    await screen.findByText('Review: Your first win');
    fireEvent.click(screen.getByRole('button', { name: 'Drop in column 4' }));

    await screen.findByText('Nothing due right now');
    expect(screen.getAllByText(/Locked in\./).length).toBeGreaterThan(0);
  });

  it('renders the learn, about, credits, sandbox, and strategy surfaces', async () => {
    renderRoute('/learn');
    await screen.findByRole('heading', {
      name: 'A full path from first move to near-perfect practical play.',
    });
    expect(screen.getByText('Zero to First Move')).toBeInTheDocument();

    renderRoute('/about');
    await screen.findByRole('heading', { name: 'A static-first Learn Drop 4 trainer.' });

    renderRoute('/credits');
    await screen.findByRole('heading', { name: 'Spec, strategy research, and SVG asset bundle.' });

    renderRoute('/sandbox');
    await screen.findByRole('heading', { name: 'Open board with undo and coach overlay.' });

    renderRoute('/strategy/play-connect-4-online');
    await screen.findByRole('heading', { name: 'Play Connect 4 Online' });
    expect(screen.getByText('Related lessons')).toBeInTheDocument();
  });
});
