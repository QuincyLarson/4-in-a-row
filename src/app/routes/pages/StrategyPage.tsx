import { Link, useParams } from 'react-router-dom';

import { curriculumByLesson, strategyArticleBySlug } from '../../../content';
import { Card, PageSection } from './shared';

export function StrategyPage() {
  const { slug = '' } = useParams();
  const article = strategyArticleBySlug.get(slug);

  if (!article) {
    return (
      <PageSection
        eyebrow="Strategy"
        title="Article not found"
        body="The static strategy page you asked for is missing from the authored content bundle."
      >
        <Link
          to="/learn"
          style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '0.18em' }}
        >
          Return to Learn
        </Link>
      </PageSection>
    );
  }

  return (
    <PageSection
      eyebrow="Strategy"
      title={article.title}
      body={article.description}
    >
      {article.sections.map((section) => (
        <Card key={section.title} title={section.title} body={section.body}>
          {section.bullets ? (
            <ul style={strategy.list}>
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </Card>
      ))}

      <Card
        title="Related lessons"
        body="Turn the article into board reps by jumping straight into the matching lesson set."
        accent="var(--accent)"
      >
        <div style={strategy.links}>
          {article.relatedLessonIds
            .map((lessonId) => curriculumByLesson.get(lessonId))
            .filter(Boolean)
            .map((lesson) => (
              <Link key={lesson!.id} to={`/lesson/${lesson!.id}`} style={strategy.link}>
                {lesson!.title}
              </Link>
            ))}
        </div>
      </Card>
    </PageSection>
  );
}

const strategy = {
  list: {
    margin: 0,
    paddingLeft: '1rem',
    color: 'var(--muted)',
    lineHeight: 1.7,
  },
  links: {
    display: 'grid',
    gap: '0.65rem',
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'underline',
    textUnderlineOffset: '0.18em',
    fontWeight: 600,
  },
};
