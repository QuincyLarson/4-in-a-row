import type { CSSProperties } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/learn', label: 'Learn' },
  { to: '/battle', label: 'Battle' },
  { to: '/review', label: 'Review' },
  { to: '/play', label: 'Play' },
  { to: '/profile', label: 'Settings' },
];

export function AppShell() {
  return (
    <div style={shellStyles.frame}>
      <aside style={shellStyles.sidebar}>
        <div style={shellStyles.brandWrap}>
          <span style={shellStyles.eyebrow}>Drop Four Academy</span>
          <h1 style={shellStyles.brand}>Learn the board. Then own it.</h1>
          <p style={shellStyles.copy}>
            A browser-first Connect 4 learning path with arcade feel, instant AI,
            and local-only progress.
          </p>
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
      </aside>
      <main style={shellStyles.main}>
        <div style={shellStyles.hero}>
          <div>
            <div style={shellStyles.pill}>10-hour curriculum</div>
            <h2 style={shellStyles.headline}>
              Fast tactics, vivid lessons, and bosses that teach through pressure.
            </h2>
          </div>
          <p style={shellStyles.lede}>
            The app shell is ready for the full engine, content system, battle
            ladder, review queue, and SVG board scene.
          </p>
        </div>
        <div style={shellStyles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const shellStyles: Record<string, CSSProperties> = {
  frame: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))',
    minHeight: '100vh',
  },
  sidebar: {
    display: 'grid',
    alignContent: 'start',
    gap: '2rem',
    minHeight: '100%',
    padding: '2rem 1.5rem',
    background:
      'linear-gradient(180deg, rgba(7, 15, 27, 0.96), rgba(7, 15, 27, 0.72))',
    backdropFilter: 'blur(18px)',
    borderRight: '1px solid rgba(127, 219, 255, 0.12)',
  },
  brandWrap: {
    display: 'grid',
    gap: '1rem',
  },
  eyebrow: {
    color: 'var(--accent)',
    fontSize: '0.8rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
  },
  brand: {
    margin: 0,
    fontSize: '2.45rem',
    lineHeight: 1,
  },
  copy: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.6,
  },
  nav: {
    display: 'grid',
    gap: '0.8rem',
  },
  link: {
    padding: '0.9rem 1rem',
    borderRadius: '1rem',
    color: 'var(--muted)',
    textDecoration: 'none',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(127, 219, 255, 0.08)',
  },
  linkActive: {
    color: 'var(--ink)',
    background:
      'linear-gradient(135deg, rgba(127, 219, 255, 0.18), rgba(113, 247, 213, 0.08))',
    borderColor: 'rgba(127, 219, 255, 0.28)',
  },
  main: {
    display: 'grid',
    gap: '1.5rem',
    alignContent: 'start',
    padding: '2rem clamp(1rem, 3vw, 2.5rem) 3rem',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))',
    gap: '1.5rem',
    alignItems: 'end',
    padding: '1.6rem',
    borderRadius: '1.75rem',
    background:
      'linear-gradient(135deg, rgba(18, 35, 58, 0.92), rgba(9, 19, 32, 0.88))',
    border: '1px solid rgba(127, 219, 255, 0.14)',
    boxShadow: 'var(--shadow)',
  },
  pill: {
    display: 'inline-flex',
    padding: '0.45rem 0.8rem',
    borderRadius: '999px',
    background: 'rgba(113, 247, 213, 0.12)',
    color: 'var(--accent)',
    marginBottom: '1rem',
  },
  headline: {
    margin: 0,
    fontSize: 'clamp(2.1rem, 4vw, 3.5rem)',
    lineHeight: 1,
  },
  lede: {
    margin: 0,
    maxWidth: '34rem',
    color: 'var(--muted)',
    lineHeight: 1.7,
  },
  content: {
    minHeight: '30rem',
    padding: '1.5rem',
    borderRadius: '1.75rem',
    background: 'rgba(9, 19, 32, 0.72)',
    border: '1px solid rgba(127, 219, 255, 0.12)',
    boxShadow: 'var(--shadow)',
    animation: 'fade-in-up var(--dur-mid) var(--ease-out-quart)',
  },
};
