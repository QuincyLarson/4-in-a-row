import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppShell } from '../../app/layout/AppShell';
import { AboutPage } from '../../app/routes/pages/AboutPage';
import { BattlePage } from '../../app/routes/pages/BattlePage';
import { CreditsPage } from '../../app/routes/pages/CreditsPage';
import { LearnPage } from '../../app/routes/pages/LearnPage';
import { LessonPage } from '../../app/routes/pages/LessonPage';
import { ProfilePage } from '../../app/routes/pages/ProfilePage';
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
            <Route index element={<Navigate to="/learn" replace />} />
            <Route path="learn" element={<LearnPage />} />
            <Route path="play" element={<Navigate to="/battle" replace />} />
            <Route path="battle" element={<BattlePage />} />
            <Route path="review" element={<Navigate to="/learn" replace />} />
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

    await screen.findByRole('heading', { name: 'Board and Gravity - Lesson 1 of 3' });
    expect(screen.queryByText('Lessons > Board and Gravity')).not.toBeInTheDocument();
    expect(document.title).toBe('Lesson - Learn Drop 4');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain(
      'board-first lesson',
    );
  });

  it('redirects the root route to learn', async () => {
    const save = makeSave();

    renderRoute('/', save);

    await screen.findByRole('heading', {
      name: 'Perfect Play curriculum',
    });
  });

  it('gates the ladder and falls back to the first unlocked battle', async () => {
    const firstRender = renderRoute('/battle');

    await screen.findByRole('button', { name: 'Current match' });
    expect(screen.queryByText('Battle the ladder.')).not.toBeInTheDocument();
    expect(screen.queryByText('Current: Level 0')).not.toBeInTheDocument();
    expect(screen.getByText('Level 2: Center Sentinel')).toBeInTheDocument();
    expect(screen.getByText('Status: Ready · Current match')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Beat / }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Current match' })).toBeInTheDocument();

    firstRender.unmount();
    renderRoute('/play?ai=endgame-engine');

    await screen.findByRole('button', { name: 'Current match' });
    expect(screen.getAllByText('Level 0: Warmup Bot').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Current match' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Beat Mirror Master' })).toBeDisabled();
  });

  it('renders the simplified profile settings column and confirms before reset', async () => {
    const save = makeSave();
    const importedSave = makeSave();

    renderRoute('/profile', save);

    await screen.findByText('Completed lessons: 0 of 39');
    expect(
      screen.getByRole('link', { name: 'Read how the coach evaluates moves' }),
    ).toHaveAttribute('href', '/strategy/how-learn-drop-4-coach-evaluates-moves');
    expect(screen.getByText('Completed lessons: 0 of 39')).toBeInTheDocument();
    expect(screen.getByText('Cleared bosses: 0')).toBeInTheDocument();
    expect(screen.queryByText('Local settings, accessibility, and save transfer.')).not.toBeInTheDocument();
    expect(screen.queryByText('Display Name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(screen.queryByText('Sound cues')).not.toBeInTheDocument();
    expect(screen.getByText('Piece styling')).toBeInTheDocument();
    expect(screen.getByText('CPU pace')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Export / Import Progress' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toContain('"version": 1');

    fireEvent.change(textarea, {
      target: {
        value: exportSaveEnvelope(importedSave),
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(screen.getByText('Save imported successfully.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reset progress' }));
    expect(screen.getByRole('dialog', { name: 'Reset progress?' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss reset warning' }));
    expect(screen.queryByRole('dialog', { name: 'Reset progress?' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset progress' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog', { name: 'Reset progress?' })).not.toBeInTheDocument();
  });

  it('redirects the retired review route back to learn', async () => {
    renderRoute('/review');

    await screen.findByRole('heading', {
      name: 'Perfect Play curriculum',
    });
  });

  it('renders the learn, about, credits, sandbox, and strategy surfaces', async () => {
    renderRoute('/learn');
    await screen.findByRole('heading', {
      name: 'Perfect Play curriculum',
    });
    expect(screen.getByText('Zero to First Move')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Chapter 1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Zero to First Move' })).toHaveAttribute(
      'href',
      '/lesson/world-0-board-and-gravity',
    );
    expect(screen.getByText('Boss: Warmup Bot')).toBeInTheDocument();
    expect(screen.getAllByText(/^Learn$/)).toHaveLength(1);
    expect(screen.queryByText('Unlocked')).not.toBeInTheDocument();
    expect(screen.queryByText('Locked')).not.toBeInTheDocument();
    expect(screen.queryByText(/stars/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/lessons/i)).not.toBeInTheDocument();

    renderRoute('/about');
    await screen.findByRole('heading', { name: 'A static-first Learn Drop 4 trainer.' });

    renderRoute('/credits');
    await screen.findByRole('heading', { name: 'Spec, strategy research, and SVG asset bundle.' });

    renderRoute('/sandbox');
    await screen.findByRole('heading', { name: 'Open board with undo and coach overlay.' });

    renderRoute('/strategy/play-connect-4-online');
    await screen.findByRole('heading', { name: 'Play Connect 4 Online' });
    expect(screen.getByText('Related lessons')).toBeInTheDocument();

    renderRoute('/strategy/how-learn-drop-4-coach-evaluates-moves');
    await screen.findByRole('heading', { name: 'How Learn Drop 4 Coach Evaluates Moves' });
    expect(screen.getByText(/re-searches the resulting position from the opponent side/i)).toBeInTheDocument();
    expect(screen.queryByText('connect 4 heuristics')).not.toBeInTheDocument();
    expect(screen.queryByText('move evaluation')).not.toBeInTheDocument();
  });

});
