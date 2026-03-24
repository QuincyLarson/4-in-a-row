import { Link } from 'react-router-dom';

import { curriculumLessons, curriculumWorlds } from '../../../content';
import { isWorldComplete, isWorldUnlocked } from '../../progression';
import { useAppState } from '../../state/useAppState';
import { Card, CardGrid, Chip, PageSection } from './shared';

export function LearnPage() {
  const {
    state: { save },
  } = useAppState();

  return (
    <PageSection
      eyebrow="Curriculum"
      title="A full path from first move to near-perfect practical play."
      body="Each world is short, board-first, and focused on one idea at a time. Lessons link into practice, boss battles, and the review queue."
    >
      <CardGrid>
        {curriculumWorlds.map((world) => {
          const unlocked = isWorldUnlocked(save, world);
          const cleared = isWorldComplete(save, world);
          const completedLessons = world.lessonIds.filter((lessonId) =>
            save.progress.completedLessonIds.includes(lessonId),
          ).length;
          const starTotal = world.lessonIds.reduce(
            (sum, lessonId) => sum + (save.progress.lessonStars[lessonId] ?? 0),
            0,
          );
          const lessons = curriculumLessons.filter((lesson) => lesson.worldId === world.id);

          return (
            <Card
              key={world.id}
              title={world.title}
              body={world.subtitle}
              accent={unlocked ? 'var(--accent)' : 'var(--surface-2)'}
              footer={
                <>
                  <Chip tone={cleared ? 'success' : unlocked ? 'default' : 'warning'}>
                    {cleared ? 'Cleared' : unlocked ? 'Unlocked' : 'Locked'}
                  </Chip>
                  <Chip>{completedLessons}/{world.lessonIds.length} lessons</Chip>
                  <Chip>{starTotal} stars</Chip>
                </>
              }
            >
              <p style={learn.goal}>{world.goal}</p>
              <div style={learn.lessonList}>
                {lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    to={`/lesson/${lesson.id}`}
                    style={{
                      ...learn.lessonLink,
                      opacity: unlocked ? 1 : 0.5,
                      pointerEvents: unlocked ? 'auto' : 'none',
                    }}
                  >
                    <span>{lesson.title}</span>
                    <span>{lesson.estMinutes}m</span>
                  </Link>
                ))}
              </div>
            </Card>
          );
        })}
      </CardGrid>
    </PageSection>
  );
}

const learn = {
  goal: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.6,
  },
  lessonList: {
    display: 'grid',
    gap: '0.55rem',
  },
  lessonLink: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '0.8rem 0.95rem',
    borderRadius: '0.9rem',
    textDecoration: 'none',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(127, 219, 255, 0.08)',
    color: 'var(--ink)',
  },
};
