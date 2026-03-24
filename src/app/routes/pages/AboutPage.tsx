import { Card, CardGrid, PageSection } from './shared';

export function AboutPage() {
  return (
    <PageSection
      eyebrow="About"
      title="A static-first Four in a Row trainer."
      body="Drop Four Academy runs fully client-side: gameplay, lessons, AI, review, audio, settings, and persistence. No accounts, no cloud sync, no analytics, and no external APIs."
    >
      <CardGrid>
        <Card title="Why it exists" body="Most public experiences separate play, puzzles, and strategy notes. This app tries to fuse them into one structured journey." />
        <Card title="Privacy" body="All progress lives in localStorage. Export and import stay manual so nothing leaves the device unless you copy it yourself." />
        <Card title="Deployment" body="Hash-based routing and a relative Vite base keep the app GitHub Pages-safe with no server fallback required." />
      </CardGrid>
    </PageSection>
  );
}
