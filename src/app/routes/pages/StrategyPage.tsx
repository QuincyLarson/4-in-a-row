import { Link, useParams } from 'react-router-dom';

import { curriculumByLesson, strategyArticleBySlug } from '../../../content';
import { PageSection } from './shared';

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
    >
      <article style={strategy.article}>
        <p style={strategy.lead}>{article.description}</p>

        {article.sections.map((section) => (
          <section key={section.title} style={strategy.section}>
            <h2 style={strategy.heading}>{section.title}</h2>
            <p style={strategy.copy}>{section.body}</p>
            {section.bullets ? (
              <ul style={strategy.list}>
                {section.bullets.map((bullet) => (
                  <li key={bullet} style={strategy.listItem}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <section style={strategy.section}>
          <h2 style={strategy.heading}>Related lessons</h2>
          <p style={strategy.copy}>
            Turn the article into board reps by jumping straight
            into the matching lesson set.
          </p>
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
        </section>
      </article>
    </PageSection>
  );
}

const strategy = {
  article: {
    display: 'grid',
    gap: '1.2rem',
    maxWidth: '60ch',
  },
  lead: {
    margin: 0,
    color: 'var(--ink)',
    lineHeight: 1.7,
    fontSize: '1.06rem',
  },
  section: {
    display: 'grid',
    gap: '0.55rem',
  },
  heading: {
    margin: 0,
    fontSize: '1.02rem',
    lineHeight: 1.25,
  },
  copy: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.72,
    fontSize: '1rem',
  },
  list: {
    margin: 0,
    paddingLeft: '1rem',
    color: 'var(--muted)',
    lineHeight: 1.72,
    fontSize: '1rem',
  },
  listItem: {
    marginBottom: '0.3rem',
  },
  links: {
    display: 'grid',
    gap: '0.5rem',
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'underline',
    textUnderlineOffset: '0.18em',
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: 1.5,
  },
};
