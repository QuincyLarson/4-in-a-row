import type { CSSProperties } from 'react';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { battleAiById, curriculumLessons, curriculumWorlds } from '../../../content';
import { isWorldComplete } from '../../progression';
import { useAppState } from '../../state/useAppState';
import { PageSection } from './shared';

export function LearnPage() {
  const {
    state: { save },
  } = useAppState();

  return (
    <PageSection title="A full curriculum from first move to near-perfect practical play.">
      <div style={learn.timeline}>
        {curriculumWorlds.map((world) => {
          const cleared = isWorldComplete(save, world);
          const lessons = curriculumLessons.filter((lesson) => lesson.worldId === world.id);
          const bossLesson =
            lessons.find((lesson) => lesson.bossAiId === world.bossAiId) ?? lessons.at(-1) ?? null;
          const bossName =
            battleAiById.get(world.bossAiId)?.name ?? bossLesson?.title ?? world.title;
          const lessonPath = lessons.filter((lesson) => lesson.id !== bossLesson?.id).map((lesson) => ({
            id: lesson.id,
            label: lesson.title,
            complete: save.progress.completedLessonIds.includes(lesson.id),
          }));
          const checkpoints = bossLesson
            ? lessonPath.concat({
                id: bossLesson.id,
                label: `Boss: ${bossName}`,
                complete: save.progress.bossWins.includes(world.bossAiId),
              })
            : lessonPath;

          return (
            <section key={world.id} style={learn.chapterRow}>
              <div style={learn.rail}>
                <div
                  role="img"
                  aria-label={cleared ? `Chapter ${world.order + 1} complete` : `Chapter ${world.order + 1}`}
                  style={{
                    ...learn.marker,
                    ...(cleared ? learn.markerComplete : learn.markerPending),
                  }}
                >
                  {cleared ? '✓' : world.order + 1}
                </div>
                {world.order < curriculumWorlds.length - 1 ? <div style={learn.railLine} /> : null}
              </div>
              <article
                style={{
                  ...learn.chapterCard,
                  ...(cleared ? learn.chapterCardComplete : null),
                }}
              >
                <div style={learn.chapterHeader}>
                  <h2 style={learn.chapterTitle}>{world.title}</h2>
                  <p style={learn.chapterSubtitle}>{world.subtitle}</p>
                </div>
                <div style={learn.path}>
                  {checkpoints.map((item, index) => (
                    <Fragment key={item.id}>
                      <Link
                        to={`/lesson/${item.id}`}
                        style={{
                          ...learn.pathLink,
                          ...(item.complete ? learn.pathLinkComplete : null),
                        }}
                      >
                        {item.label}
                      </Link>
                      {index < checkpoints.length - 1 ? <span style={learn.arrow}>→</span> : null}
                    </Fragment>
                  ))}
                </div>
              </article>
            </section>
          );
        })}
      </div>
    </PageSection>
  );
}

const learn: Record<string, CSSProperties> = {
  timeline: {
    display: 'grid',
    gap: '0.8rem',
  },
  chapterRow: {
    display: 'grid',
    gridTemplateColumns: '2.75rem minmax(0, 1fr)',
    gap: '0.85rem',
    alignItems: 'stretch',
  },
  rail: {
    display: 'grid',
    justifyItems: 'center',
    gridTemplateRows: '2.5rem 1fr',
    gap: '0.3rem',
  },
  marker: {
    display: 'grid',
    placeItems: 'center',
    width: '2.25rem',
    height: '2.25rem',
    borderRadius: '999px',
    fontWeight: 800,
    fontSize: '0.98rem',
    boxSizing: 'border-box',
  },
  markerPending: {
    color: 'var(--ink)',
    background: 'var(--surface)',
    border: '1px solid rgba(245, 246, 247, 0.12)',
  },
  markerComplete: {
    color: '#0a0a23',
    background: 'var(--success)',
    border: '1px solid rgba(172, 209, 87, 0.9)',
    boxShadow: '0 10px 24px rgba(172, 209, 87, 0.22)',
  },
  railLine: {
    width: '2px',
    borderRadius: '999px',
    background:
      'linear-gradient(180deg, rgba(241, 190, 50, 0.28) 0%, rgba(153, 201, 255, 0.12) 100%)',
  },
  chapterCard: {
    display: 'grid',
    gap: '0.55rem',
    padding: '0.92rem 1rem',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface)',
    border: '1px solid rgba(245, 246, 247, 0.08)',
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.16)',
  },
  chapterCardComplete: {
    borderColor: 'rgba(172, 209, 87, 0.34)',
  },
  chapterHeader: {
    display: 'grid',
    gap: '0.18rem',
  },
  chapterTitle: {
    margin: 0,
    fontSize: '1rem',
    lineHeight: 1.15,
  },
  chapterSubtitle: {
    margin: 0,
    fontSize: '0.92rem',
    lineHeight: 1.3,
    color: 'var(--muted)',
  },
  path: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.32rem 0.46rem',
    lineHeight: 1.45,
  },
  pathLink: {
    color: 'var(--ink)',
    textDecoration: 'none',
    fontSize: '0.92rem',
    borderBottom: '1px solid rgba(245, 246, 247, 0.14)',
  },
  pathLinkComplete: {
    color: 'var(--success)',
    borderBottomColor: 'rgba(172, 209, 87, 0.42)',
  },
  arrow: {
    color: 'var(--muted)',
    fontSize: '0.86rem',
  },
};
