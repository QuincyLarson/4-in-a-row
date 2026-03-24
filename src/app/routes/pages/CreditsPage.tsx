import { Card, CardGrid, PageSection } from './shared';

export function CreditsPage() {
  return (
    <PageSection
      eyebrow="Credits"
      title="Spec, strategy research, and SVG asset bundle."
      body="The product shape follows the attached PRD and the provided static SVG asset pack."
    >
      <CardGrid>
        <Card title="Core references" body="Victor Allis, Pascal Pons, Reader’s Digest strategy framing, Base Camp Math, Paper Games, and John Tromp all informed the PRD." />
        <Card title="Asset source" body="The board frame, chips, coach bubble, selection ring, impact ping, confetti, badge, and crown motifs came from the attached `svg-assets` bundle." />
        <Card title="Implementation stance" body="The app favors pure TypeScript modules, SVG DOM animation, worker-backed AI, and client-only persistence over heavier abstractions." />
      </CardGrid>
    </PageSection>
  );
}
