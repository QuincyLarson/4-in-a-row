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
      <header style={shellStyles.header}>
        <div style={shellStyles.brandRow}>
          <div style={shellStyles.brandWrap}>
            <span style={shellStyles.eyebrow}>Drop Four Academy</span>
            <h1 style={shellStyles.brand}>Play. Learn. Review.</h1>
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

const shellStyles: Record<string, CSSProperties> = {
  frame: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    minHeight: '100vh',
  },
  header: {
    display: 'grid',
    gap: '0.75rem',
    padding: '1.25rem 1rem 0',
    justifyItems: 'center',
  },
  brandRow: {
    width: '100%',
    maxWidth: 'var(--max-width)',
    padding: '1rem 1.1rem',
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
    margin: 0,
    fontSize: 'clamp(1.45rem, 4vw, 2.2rem)',
    lineHeight: 1,
  },
  nav: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.65rem',
    width: '100%',
    maxWidth: 'var(--max-width)',
  },
  link: {
    padding: '0.75rem 0.95rem',
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
    padding: '1.25rem',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--panel)',
    border: '1px solid rgba(245, 246, 247, 0.08)',
    boxShadow: 'var(--shadow)',
    animation: 'fade-in-up var(--dur-mid) var(--ease-out-quart)',
  },
};
