import { Link, useParams } from 'react-router-dom';

import { strategyArticleBySlug } from '../../../content';
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
        <Link to="/learn" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
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
};
