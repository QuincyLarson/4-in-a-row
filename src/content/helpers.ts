import type {
  AiProfile,
  CoachNote,
  ConceptTag,
  LessonDef,
  LessonStep,
  PositionSpec,
  Side,
  StrategyArticle,
  StrategySection,
  WorldDef,
} from './types';

export const TAGS = {
  rules: 'rules',
  winIn1: 'win-in-1',
  blockIn1: 'block-in-1',
  center: 'center',
  threat: 'threat',
  doubleThreat: 'double-threat',
  diagonal: 'diagonal',
  parity: 'parity',
  opening: 'opening',
  endgame: 'endgame',
  defense: 'defense',
  review: 'review',
  sandbox: 'sandbox',
} as const satisfies Record<string, ConceptTag>;

export const pos = (moves: number[], next: Side, label?: string): PositionSpec => ({
  moves,
  next,
  label,
});

export const note = (id: string, conceptTag: ConceptTag, title: string, body: string): CoachNote => ({
  id,
  conceptTag,
  title,
  body,
});

export const step = (data: LessonStep): LessonStep => data;

export const lesson = (data: LessonDef): LessonDef => data;

export const world = (data: WorldDef): WorldDef => data;

export const ai = (data: AiProfile): AiProfile => data;

export const article = (data: StrategyArticle): StrategyArticle => data;

export const section = (title: string, body: string, bullets?: string[]): StrategySection => ({
  title,
  body,
  bullets,
});

export const byId = <T extends { id?: string; slug?: string }>(items: T[]) =>
  new Map(items.map((item) => [item.id ?? item.slug ?? '', item]));

export const unique = <T>(items: T[]) => Array.from(new Set(items));

export const lessonIds = (lessons: LessonDef[]) => lessons.map((lesson) => lesson.id);

export const makeUnlockChain = (ids: string[]) => ids.map((id, index) => ids[index + 1]).filter(Boolean) as string[];
