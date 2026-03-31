import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/learn', label: 'Learn' },
  { to: '/battle', label: 'Battle' },
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
        <div style={shellStyles.topBar}>
          <NavLink to="/learn" style={shellStyles.brand}>
            Learn Drop 4
          </NavLink>
          <div style={shellStyles.spacer} />
          <nav aria-label="Primary navigation" style={shellStyles.nav}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                aria-current={isCurrentSection(item.to, location.pathname) ? 'page' : undefined}
                style={() => ({
                  ...shellStyles.link,
                  ...(isCurrentSection(item.to, location.pathname) ? shellStyles.linkActive : {}),
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
    return 'Learn - Learn Drop 4';
  }
  if (pathname === '/learn' || pathname === '/learn/connect-4-course') {
    return 'Learn - Learn Drop 4';
  }
  if (pathname.startsWith('/lesson/')) {
    return 'Lesson - Learn Drop 4';
  }
  if (pathname === '/battle') {
    return 'Battle - Learn Drop 4';
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
    return 'Follow the Learn Drop 4 curriculum from first move to advanced practical play.';
  }
  if (pathname === '/learn' || pathname === '/learn/connect-4-course') {
    return 'Follow the Learn Drop 4 curriculum from first move to advanced practical play.';
  }
  if (pathname.startsWith('/lesson/')) {
    return 'Open a board-first lesson in Learn Drop 4 and work through the concept one move at a time.';
  }
  if (pathname === '/battle') {
    return 'See the full Learn Drop 4 ladder, boss unlocks, and analysis path.';
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

function isCurrentSection(to: string, pathname: string) {
  if (to === '/learn') {
    return (
      pathname === '/' ||
      pathname === '/learn' ||
      pathname === '/learn/connect-4-course' ||
      pathname.startsWith('/lesson/')
    );
  }

  if (to === '/battle') {
    return pathname === '/battle' || pathname === '/play';
  }

  if (to === '/profile') {
    return pathname === '/profile';
  }

  return pathname === to;
}

const shellStyles: Record<string, CSSProperties> = {
  frame: {
    minHeight: '100vh',
  },
  header: {
    position: 'fixed',
    inset: '0 0 auto',
    zIndex: 30,
    padding: '0 0.9rem',
    background: 'rgba(10, 10, 35, 0.92)',
    backdropFilter: 'blur(14px)',
    borderBottom: '1px solid rgba(245, 246, 247, 0.08)',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    width: '100%',
    maxWidth: 'var(--max-width)',
    minHeight: '3.05rem',
    margin: '0 auto',
  },
  brand: {
    color: 'var(--ink)',
    textDecoration: 'none',
    fontSize: '1rem',
    fontFamily: 'var(--font-display)',
    whiteSpace: 'nowrap',
  },
  spacer: {
    flex: '1 1 auto',
    minWidth: 0,
  },
  nav: {
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    gap: '1rem',
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '3.05rem',
    padding: '0.18rem 0',
    color: 'var(--muted)',
    textDecoration: 'none',
    fontSize: '0.84rem',
    fontWeight: 700,
    borderBottom: '2px solid transparent',
  },
  linkActive: {
    color: 'var(--ink)',
    borderBottomColor: 'var(--accent)',
  },
  main: {
    display: 'grid',
    alignContent: 'start',
    justifyItems: 'center',
    padding: '3.45rem 0.9rem 1rem',
  },
  content: {
    width: '100%',
    maxWidth: 'var(--max-width)',
    minHeight: '30rem',
    padding: 'clamp(0.35rem, 0.9vw, 0.55rem) 0 clamp(0.8rem, 1.1vw, 1rem)',
    animation: 'fade-in-up var(--dur-mid) var(--ease-out-quart)',
  },
};
