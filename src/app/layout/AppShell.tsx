import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { curriculumByLesson, strategyArticleBySlug } from '../../content';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/learn', label: 'Learn' },
  { to: '/play', label: 'Play' },
  { to: '/battle', label: 'Battle' },
  { to: '/review', label: 'Review' },
  { to: '/profile', label: 'Profile' },
];

export function AppShell() {
  const location = useLocation();
  const breadcrumb = breadcrumbForPath(location.pathname);

  useEffect(() => {
    const title = titleForPath(location.pathname);
    document.title = title;

    const description = descriptionForPath(location.pathname);
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', description);
    }
  }, [location.pathname]);

  return (
    <div style={shellStyles.frame}>
      <header style={shellStyles.header}>
        <div style={shellStyles.topBar}>
          <NavLink to="/" style={shellStyles.brand}>
            Learn Drop 4
          </NavLink>
          <div style={shellStyles.breadcrumb}>{breadcrumb}</div>
          <nav aria-label="Primary navigation" style={shellStyles.nav}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  ...shellStyles.link,
                  ...(isActive ? shellStyles.linkActive : {}),
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main style={shellStyles.main}>
        <div style={shellStyles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function titleForPath(pathname: string) {
  if (pathname === '/') {
    return 'Learn Drop 4';
  }
  if (pathname === '/learn' || pathname === '/learn/connect-4-course') {
    return 'Learn - Learn Drop 4';
  }
  if (pathname === '/play' || pathname === '/play/connect-4-online') {
    return 'Play - Learn Drop 4';
  }
  if (pathname.startsWith('/lesson/')) {
    return 'Lesson - Learn Drop 4';
  }
  if (pathname === '/battle') {
    return 'Battle - Learn Drop 4';
  }
  if (pathname === '/review') {
    return 'Review - Learn Drop 4';
  }
  if (pathname === '/profile') {
    return 'Profile - Learn Drop 4';
  }
  if (pathname === '/about') {
    return 'About - Learn Drop 4';
  }
  if (pathname.startsWith('/strategy/')) {
    return 'Strategy - Learn Drop 4';
  }
  if (pathname === '/sandbox') {
    return 'Sandbox - Learn Drop 4';
  }
  if (pathname === '/credits') {
    return 'Credits - Learn Drop 4';
  }
  return 'Learn Drop 4';
}

function descriptionForPath(pathname: string) {
  if (pathname === '/') {
    return 'Learn Drop 4 is a fast, local-only Connect Four trainer with lessons, battles, review, and a full client-side curriculum.';
  }
  if (pathname === '/learn' || pathname === '/learn/connect-4-course') {
    return 'Follow the Learn Drop 4 curriculum from first move to advanced practical play.';
  }
  if (pathname === '/play' || pathname === '/play/connect-4-online') {
    return 'Play quick local matches against the Learn Drop 4 AI ladder.';
  }
  if (pathname.startsWith('/lesson/')) {
    return 'Open a board-first lesson in Learn Drop 4 and work through the concept one move at a time.';
  }
  if (pathname === '/battle') {
    return 'See the full Learn Drop 4 ladder, boss unlocks, and analysis path.';
  }
  if (pathname === '/review') {
    return 'Use the Learn Drop 4 review queue to revisit mistakes until they stick.';
  }
  if (pathname === '/profile') {
    return 'Adjust sound, motion, contrast, and local save settings in Learn Drop 4.';
  }
  if (pathname === '/about') {
    return 'Learn how Learn Drop 4 works fully client-side with no accounts and no server.';
  }
  if (pathname.startsWith('/strategy/')) {
    return 'Read practical Connect Four strategy guides and jump straight into the related Learn Drop 4 lessons.';
  }
  if (pathname === '/sandbox') {
    return 'Test ideas on an open board with local analysis in Learn Drop 4.';
  }
  if (pathname === '/credits') {
    return 'See the references and implementation notes behind Learn Drop 4.';
  }
  return 'Learn Drop 4 is a fast, local-only Connect Four trainer with lessons, battles, and review.';
}

function breadcrumbForPath(pathname: string) {
  if (pathname === '/') {
    return 'Home';
  }
  if (pathname === '/learn' || pathname === '/learn/connect-4-course') {
    return 'Lessons';
  }
  if (pathname.startsWith('/lesson/')) {
    const lessonId = pathname.split('/').at(-1) ?? '';
    const lesson = curriculumByLesson.get(lessonId);
    return lesson ? `Lessons > ${lesson.title}` : 'Lessons';
  }
  if (pathname === '/play' || pathname === '/play/connect-4-online') {
    return 'Play';
  }
  if (pathname === '/battle') {
    return 'Battle';
  }
  if (pathname === '/review') {
    return 'Review';
  }
  if (pathname === '/profile') {
    return 'Profile';
  }
  if (pathname === '/about') {
    return 'About';
  }
  if (pathname.startsWith('/strategy/')) {
    const slug = pathname.split('/').at(-1) ?? '';
    const article = strategyArticleBySlug.get(slug);
    return article ? `Strategy > ${article.title}` : 'Strategy';
  }
  if (pathname === '/sandbox') {
    return 'Sandbox';
  }
  if (pathname === '/credits') {
    return 'Credits';
  }
  return 'Learn Drop 4';
}

const shellStyles: Record<string, CSSProperties> = {
  frame: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    minHeight: '100vh',
  },
  header: {
    padding: '0.8rem 1rem 0',
    justifyItems: 'center',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    maxWidth: 'var(--max-width)',
    padding: '0.75rem 0.9rem',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--panel)',
    border: '1px solid rgba(245, 246, 247, 0.08)',
    boxShadow: 'var(--shadow)',
  },
  brand: {
    color: 'var(--ink)',
    textDecoration: 'none',
    fontSize: '1.1rem',
    fontFamily: 'var(--font-display)',
    whiteSpace: 'nowrap',
  },
  breadcrumb: {
    minWidth: 0,
    flex: '1 1 auto',
    color: 'var(--muted)',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  nav: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: '0.35rem',
  },
  link: {
    padding: '0.55rem 0.7rem',
    borderRadius: '0.75rem',
    color: 'var(--muted)',
    textDecoration: 'none',
    background: 'var(--surface)',
    border: '1px solid rgba(245, 246, 247, 0.08)',
    fontSize: '0.9rem',
  },
  linkActive: {
    color: 'var(--ink)',
    background: 'var(--surface-2)',
    borderColor: 'rgba(241, 190, 50, 0.6)',
    boxShadow: 'inset 0 -2px 0 var(--accent)',
  },
  main: {
    display: 'grid',
    alignContent: 'start',
    justifyItems: 'center',
    padding: '0.85rem 1rem 1.6rem',
  },
  content: {
    width: '100%',
    maxWidth: 'var(--max-width)',
    minHeight: '30rem',
    padding: 'clamp(0.9rem, 1.6vw, 1.2rem)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--panel)',
    border: '1px solid rgba(245, 246, 247, 0.08)',
    boxShadow: 'var(--shadow)',
    animation: 'fade-in-up var(--dur-mid) var(--ease-out-quart)',
  },
};
