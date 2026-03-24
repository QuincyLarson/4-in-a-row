export type Side = 'human' | 'cpu';

export type ConceptTag =
  | 'rules'
  | 'win-in-1'
  | 'block-in-1'
  | 'center'
  | 'threat'
  | 'double-threat'
  | 'diagonal'
  | 'parity'
  | 'opening'
  | 'endgame'
  | 'defense'
  | 'review'
  | 'sandbox';

export type LessonStepType = 'concept' | 'guided' | 'drill' | 'puzzle' | 'battle' | 'boss';

export interface PositionSpec {
  moves: number[];
  next: Side;
  label?: string;
}

export interface CoachNote {
  id: string;
  conceptTag: ConceptTag;
  title: string;
  body: string;
}

export interface LessonStep {
  id: string;
  type: LessonStepType;
  title: string;
  prompt: string;
  position?: PositionSpec;
  acceptedColumns?: number[];
  coachNotes?: CoachNote[];
  hintColumns?: number[];
  successMessage?: string;
  failureMessage?: string;
  reviewTags?: ConceptTag[];
}

export interface LessonDef {
  id: string;
  worldId: string;
  slug: string;
  title: string;
  estMinutes: number;
  tags: ConceptTag[];
  prerequisites: string[];
  steps: LessonStep[];
  bossAiId?: string;
  unlocks?: string[];
  summary: string;
}

export interface WorldDef {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  estHours: number;
  goal: string;
  conceptTags: ConceptTag[];
  bossAiId: string;
  prerequisites: string[];
  unlocks: string[];
  lessonIds: string[];
}

export interface AiProfile {
  id: string;
  level: number;
  name: string;
  role: 'warmup' | 'battle' | 'boss' | 'analysis';
  summary: string;
  strengths: string[];
  tacticalBudgetMs: number;
  searchDepth: number;
  openingBias: string[];
  reviewTags: ConceptTag[];
}

export interface StrategySection {
  title: string;
  body: string;
  bullets?: string[];
}

export interface StrategyArticle {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  sections: StrategySection[];
  relatedLessonIds: string[];
}
