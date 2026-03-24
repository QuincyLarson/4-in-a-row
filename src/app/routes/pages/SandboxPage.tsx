import { GameArena } from '../../../features/battle/GameArena';
import { PageSection } from './shared';

export function SandboxPage() {
  return (
    <PageSection
      eyebrow="Sandbox"
      title="Open board with undo and coach overlay."
      body="Use this mode to replay a line, test an idea, or just move both sides yourself with no AI pressure."
    >
      <GameArena
        title="Open sandbox"
        description="Both sides are manual here. Use undo and the coach panel to inspect the structure."
        mode="sandbox"
      />
    </PageSection>
  );
}
