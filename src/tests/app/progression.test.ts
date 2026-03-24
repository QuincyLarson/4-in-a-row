import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TAGS,
  battleAiById,
  curriculumByWorld,
  curriculumLessons,
  curriculumWorlds,
} from '../../content';
import {
  findReviewTarget,
  isAiUnlocked,
  isWorldComplete,
  isWorldUnlocked,
  lessonSummaryForStep,
  nextLessonForSave,
  nextReviewDueAt,
  reviewBuckets,
} from '../../app/progression';
import { createDefaultSave } from '../../storage/migrations';

const NOW = new Date('2026-03-24T12:00:00.000Z');

function makeSave() {
  return createDefaultSave(NOW);
}

function clearWorld(save: ReturnType<typeof makeSave>, worldId: string) {
  const world = curriculumByWorld.get(worldId)!;
  save.progress.completedLessonIds.push(...world.lessonIds);
  save.progress.bossWins.push(world.bossAiId);
  save.progress.worldUnlocks.push(...world.unlocks);
  return world;
}

describe('progression helpers', () => {
  let dateNowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(NOW.getTime());
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it('locks worlds and battle tiers until the prior world is cleared', () => {
    const save = makeSave();
    const world0 = curriculumByWorld.get('world-0')!;
    const world1 = curriculumByWorld.get('world-1')!;
    const world2 = curriculumByWorld.get('world-2')!;

    expect(isWorldUnlocked(save, world0)).toBe(true);
    expect(isWorldUnlocked(save, world1)).toBe(false);
    expect(isWorldComplete(save, world0)).toBe(false);
    expect(isAiUnlocked(save, battleAiById.get('block-baron')!)).toBe(true);
    expect(isAiUnlocked(save, battleAiById.get('center-sentinel')!)).toBe(false);
    expect(isAiUnlocked(save, battleAiById.get('oracle')!)).toBe(false);

    clearWorld(save, 'world-0');

    expect(isWorldComplete(save, world0)).toBe(true);
    expect(isWorldUnlocked(save, world1)).toBe(true);
    expect(isWorldUnlocked(save, world2)).toBe(false);
    expect(isAiUnlocked(save, battleAiById.get('center-sentinel')!)).toBe(false);

    clearWorld(save, 'world-1');

    expect(isWorldUnlocked(save, world2)).toBe(true);
    expect(isAiUnlocked(save, battleAiById.get('center-sentinel')!)).toBe(true);
  });

  it('returns the next lesson from the first unlocked incomplete world', () => {
    const save = makeSave();
    const world0 = clearWorld(save, 'world-0');
    const world1 = curriculumByWorld.get('world-1')!;

    save.progress.completedLessonIds.push(world1.lessonIds[0]);

    expect(nextLessonForSave(save)?.id).toBe(world1.lessonIds[1]);

    clearWorld(save, 'world-1');
    clearWorld(save, 'world-2');

    expect(nextLessonForSave(save)?.worldId).toBe(curriculumWorlds[3].id);
    expect(isWorldComplete(save, world0)).toBe(true);
  });

  it('maps review items to exact lesson steps or concept fallbacks', () => {
    const exact = findReviewTarget({
      puzzleId: 'world-0-first-win-drill-1',
      conceptTag: TAGS.winIn1,
      dueAt: NOW.toISOString(),
      attempts: 0,
      correct: 0,
      streak: 0,
    });
    expect(exact?.lesson.id).toBe('world-0-first-win');
    expect(exact?.step.id).toBe('world-0-first-win-drill-1');

    const fallback = findReviewTarget({
      puzzleId: 'missing-position',
      conceptTag: TAGS.center,
      dueAt: NOW.toISOString(),
      attempts: 0,
      correct: 0,
      streak: 0,
    });
    expect(fallback).not.toBeNull();
    expect(fallback?.lesson.tags).toContain(TAGS.center);
    expect(fallback?.step.acceptedColumns?.length).toBeGreaterThan(0);
  });

  it('schedules next review dates and classifies bucket membership', () => {
    const entry = {
      puzzleId: 'world-0-first-win-drill-1',
      conceptTag: TAGS.winIn1,
      dueAt: NOW.toISOString(),
      attempts: 1,
      correct: 1,
      streak: 0,
    };

    expect(nextReviewDueAt(entry, false)).toBe('2026-03-24T12:15:00.000Z');
    expect(nextReviewDueAt(entry, true)).toBe('2026-03-25T12:00:00.000Z');
    expect(nextReviewDueAt({ ...entry, streak: 1 }, true)).toBe('2026-03-27T12:00:00.000Z');
    expect(nextReviewDueAt({ ...entry, streak: 2 }, true)).toBe('2026-03-31T12:00:00.000Z');

    const buckets = reviewBuckets([
      { ...entry, puzzleId: 'overdue', dueAt: '2026-03-24T09:30:00.000Z' },
      { ...entry, puzzleId: 'soon', dueAt: '2026-03-24T15:00:00.000Z' },
      { ...entry, puzzleId: 'stable', dueAt: '2026-03-28T12:00:00.000Z', streak: 2 },
    ]);

    expect(buckets.overdue.map((value) => value.puzzleId)).toEqual(['overdue']);
    expect(buckets.dueSoon.map((value) => value.puzzleId)).toEqual(['soon']);
    expect(buckets.stabilizing.map((value) => value.puzzleId)).toEqual(['stable']);
  });

  it('uses the step prompt when present and falls back to the lesson summary otherwise', () => {
    const lesson = curriculumLessons[0];
    expect(lessonSummaryForStep(lesson, lesson.steps[0])).toBe(lesson.steps[0].prompt);
    expect(lessonSummaryForStep(lesson, { ...lesson.steps[0], prompt: '' })).toBe(lesson.summary);
  });
});
