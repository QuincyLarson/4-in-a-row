import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '../layout/AppShell';
import { AboutPage } from './pages/AboutPage';
import { BattlePage } from './pages/BattlePage';
import { CreditsPage } from './pages/CreditsPage';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { LessonPage } from './pages/LessonPage';
import { PlayPage } from './pages/PlayPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReviewPage } from './pages/ReviewPage';
import { SandboxPage } from './pages/SandboxPage';
import { StrategyPage } from './pages/StrategyPage';

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="play" element={<PlayPage />} />
          <Route path="play/connect-4-online" element={<PlayPage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="learn/connect-4-course" element={<LearnPage />} />
          <Route path="lesson/:lessonId" element={<LessonPage />} />
          <Route path="battle" element={<BattlePage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="strategy/:slug" element={<StrategyPage />} />
          <Route path="sandbox" element={<SandboxPage />} />
          <Route path="credits" element={<CreditsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
