import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '../layout/AppShell';
import { AboutPage } from './pages/AboutPage';
import { BattlePage } from './pages/BattlePage';
import { CreditsPage } from './pages/CreditsPage';
import { LearnPage } from './pages/LearnPage';
import { LessonPage } from './pages/LessonPage';
import { ProfilePage } from './pages/ProfilePage';
import { SandboxPage } from './pages/SandboxPage';
import { StrategyPage } from './pages/StrategyPage';

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/learn" replace />} />
          <Route path="play" element={<Navigate to="/battle" replace />} />
          <Route path="play/connect-4-online" element={<Navigate to="/battle" replace />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="learn/connect-4-course" element={<LearnPage />} />
          <Route path="lesson/:lessonId" element={<LessonPage />} />
          <Route path="battle" element={<BattlePage />} />
          <Route path="review" element={<Navigate to="/learn" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="strategy/:slug" element={<StrategyPage />} />
          <Route path="sandbox" element={<SandboxPage />} />
          <Route path="credits" element={<CreditsPage />} />
          <Route path="*" element={<Navigate to="/learn" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
