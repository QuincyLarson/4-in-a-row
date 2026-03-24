import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

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
        <div style={shellStyles.brandRow}>
          <div style={shellStyles.brandWrap}>
            <span style={shellStyles.eyebrow}>Learn Drop 4</span>
            <div style={shellStyles.brand}>Play, learn, and review in one place.</div>
            <p style={shellStyles.lede}>
              Fast local play, short lessons, and saved progress without an account.
            </p>
            <div style={shellStyles.meta}>
              <span style={shellStyles.metaChip}>Local save</span>
              <span style={shellStyles.metaChip}>SVG board</span>
              <span style={shellStyles.metaChip}>Worker AI</span>
            </div>
          </div>
        </div>
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

const shellStyles: Record<string, CSSProperties> = {
  frame: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    minHeight: '100vh',
  },
  header: {
    display: 'grid',
    gap: '0.8rem',
    padding: '1rem 1rem 0',
    justifyItems: 'center',
  },
  brandRow: {
    width: '100%',
    maxWidth: 'var(--max-width)',
    padding: '1.1rem 1.2rem',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--panel)',
    border: '1px solid rgba(245, 246, 247, 0.08)',
    boxShadow: 'var(--shadow)',
  },
  brandWrap: {
    display: 'grid',
    gap: '0.35rem',
  },
  eyebrow: {
    color: 'var(--accent-2)',
    fontSize: '0.8rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  brand: {
    fontSize: 'clamp(1.5rem, 4vw, 2.45rem)',
    lineHeight: 1.05,
    fontFamily: 'var(--font-display)',
  },
  lede: {
    margin: 0,
    maxWidth: '42rem',
    color: 'var(--muted)',
    lineHeight: 1.6,
  },
  meta: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
    marginTop: '0.15rem',
  },
  metaChip: {
    padding: '0.35rem 0.7rem',
    borderRadius: '999px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(245, 246, 247, 0.08)',
    color: 'var(--muted)',
    fontSize: '0.82rem',
  },
  nav: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    width: '100%',
    maxWidth: 'var(--max-width)',
  },
  link: {
    padding: '0.72rem 0.92rem',
    borderRadius: 'var(--radius-md)',
    color: 'var(--muted)',
    textDecoration: 'none',
    background: 'var(--surface)',
    border: '1px solid rgba(245, 246, 247, 0.08)',
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
    padding: '1rem 1rem 2rem',
  },
  content: {
    width: '100%',
    maxWidth: 'var(--max-width)',
    minHeight: '30rem',
    padding: 'clamp(1rem, 2vw, 1.5rem)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--panel)',
    border: '1px solid rgba(245, 246, 247, 0.08)',
    boxShadow: 'var(--shadow)',
    animation: 'fade-in-up var(--dur-mid) var(--ease-out-quart)',
  },
};
