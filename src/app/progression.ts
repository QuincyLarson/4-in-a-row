import {
  battleAis,
  curriculumLessons,
  curriculumWorlds,
  type AiProfile,
  type ConceptTag,
  type LessonDef,
  type LessonStep,
  type WorldDef,
} from '../content';
import type { ReviewEntry, SaveEnvelope } from '../storage/types';

export function isWorldComplete(save: SaveEnvelope, world: WorldDef) {
  const lessonsComplete = world.lessonIds.every((lessonId) =>
    save.progress.completedLessonIds.includes(lessonId),
  );
  const bossComplete = save.progress.bossWins.includes(world.bossAiId);
  return lessonsComplete && bossComplete;
}

export function isWorldUnlocked(save: SaveEnvelope, world: WorldDef) {
  if (world.order === 0) {
    return true;
  }

  if (save.progress.worldUnlocks.includes(world.id)) {
    return true;
  }

  const previous = curriculumWorlds[world.order - 1];
  return previous ? isWorldComplete(save, previous) : false;
}

export function nextLessonForSave(save: SaveEnvelope): LessonDef | null {
  for (const world of curriculumWorlds) {
    if (!isWorldUnlocked(save, world)) {
      continue;
    }

    const nextLesson = world.lessonIds
      .map((lessonId) => curriculumLessons.find((lesson) => lesson.id === lessonId) ?? null)
      .find(
        (lesson): lesson is LessonDef =>
          lesson !== null && !save.progress.completedLessonIds.includes(lesson.id),
      );

    if (nextLesson) {
      return nextLesson;
    }
  }

  return curriculumLessons.find((lesson) => !save.progress.completedLessonIds.includes(lesson.id)) ?? null;
}

export function isAiUnlocked(save: SaveEnvelope, ai: AiProfile) {
  if (ai.level <= 1) {
    return true;
  }

  if (ai.role === 'analysis') {
    const previousAi = previousAiInLadder(ai.id);
    return save.progress.capstonePassed || (previousAi ? hasAiWin(save, previousAi.id) : false);
  }

  const previousAi = previousAiInLadder(ai.id);
  return previousAi ? hasAiWin(save, previousAi.id) : true;
}

export function findReviewTarget(entry: ReviewEntry) {
  const exactLesson = curriculumLessons.find((lesson) =>
    lesson.steps.some((step) => step.id === entry.puzzleId),
  );
  const exactStep = exactLesson?.steps.find((step) => step.id === entry.puzzleId);
  if (exactLesson && exactStep) {
    return { lesson: exactLesson, step: exactStep };
  }

  const fallbackLesson = curriculumLessons.find((lesson) =>
    lesson.tags.includes(entry.conceptTag as ConceptTag),
  );
  const fallbackStep = fallbackLesson?.steps.find(
    (step) => step.position && step.acceptedColumns && step.acceptedColumns.length > 0,
  );

  return fallbackLesson && fallbackStep
    ? { lesson: fallbackLesson, step: fallbackStep }
    : null;
}

export function nextReviewDueAt(entry: ReviewEntry, correct: boolean) {
  const now = Date.now();
  if (!correct) {
    return new Date(now + 15 * 60_000).toISOString();
  }

  const nextStreak = entry.streak + 1;
  const delayMs =
    nextStreak >= 3
      ? 7 * 24 * 60 * 60_000
      : nextStreak >= 2
        ? 3 * 24 * 60 * 60_000
        : 24 * 60 * 60_000;
  return new Date(now + delayMs).toISOString();
}

export function reviewBuckets(entries: ReviewEntry[]) {
  const now = Date.now();
  return {
    overdue: entries.filter((entry) => new Date(entry.dueAt).getTime() < now - 60 * 60_000),
    dueSoon: entries.filter((entry) => {
      const dueAt = new Date(entry.dueAt).getTime();
      return dueAt >= now - 60 * 60_000 && dueAt <= now + 24 * 60 * 60_000;
    }),
    stabilizing: entries.filter((entry) => entry.streak >= 2),
  };
}

export function lessonSummaryForStep(lesson: LessonDef, step: LessonStep) {
  return step.prompt || lesson.summary;
}

function previousAiInLadder(aiId: AiProfile['id']) {
  const index = battleAis.findIndex((profile) => profile.id === aiId);
  return index > 0 ? battleAis[index - 1] : null;
}

function hasAiWin(save: SaveEnvelope, aiId: AiProfile['id']) {
  return (
    save.progress.clearedAiIds.includes(aiId) ||
    save.progress.bossWins.includes(aiId) ||
    save.history.recentGames.some((game) => game.aiId === aiId && game.result === 'win')
  );
}
