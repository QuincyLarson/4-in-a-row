import type { CSSProperties, PropsWithChildren, ReactNode } from 'react';

export function PageSection({
  eyebrow,
  title,
  body,
  actions,
  children,
}: PropsWithChildren<{
  eyebrow?: string;
  title: string;
  body?: string;
  actions?: ReactNode;
}>) {
  return (
    <section style={shared.pageSection}>
      <div style={shared.header}>
        <div style={shared.headerText}>
          {eyebrow ? <span style={shared.eyebrow}>{eyebrow}</span> : null}
          <h1 style={shared.title}>{title}</h1>
          {body ? <p style={shared.body}>{body}</p> : null}
        </div>
        {actions ? <div style={shared.headerActions}>{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Card({
  title,
  body,
  accent,
  footer,
  children,
}: PropsWithChildren<{
  title: string;
  body?: string;
  accent?: string;
  footer?: ReactNode;
}>) {
  return (
    <article
      style={{
        ...shared.card,
        borderColor: accent ? `${accent}44` : shared.card.borderColor,
        boxShadow: accent
          ? `0 20px 50px color-mix(in srgb, ${accent} 18%, transparent)`
          : shared.card.boxShadow,
      }}
    >
      <div style={shared.cardHeader}>
        <h2 style={shared.cardTitle}>{title}</h2>
        {body ? <p style={shared.cardBody}>{body}</p> : null}
      </div>
      {children}
      {footer ? <div style={shared.cardFooter}>{footer}</div> : null}
    </article>
  );
}

export function Chip({
  children,
  tone = 'default',
}: PropsWithChildren<{ tone?: 'default' | 'success' | 'warning' | 'danger' }>) {
  const tones: Record<string, CSSProperties> = {
    default: {
      background: 'rgba(127, 219, 255, 0.1)',
      color: 'var(--accent-2)',
    },
    success: {
      background: 'rgba(157, 255, 184, 0.12)',
      color: 'var(--success)',
    },
    warning: {
      background: 'rgba(255, 212, 107, 0.12)',
      color: 'var(--warning)',
    },
    danger: {
      background: 'rgba(240, 141, 141, 0.12)',
      color: 'var(--danger)',
    },
  };

  return <span style={{ ...shared.chip, ...tones[tone] }}>{children}</span>;
}

export function InlineButton({
  children,
  onClick,
  disabled,
  tone = 'default',
}: PropsWithChildren<{
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'default' | 'accent' | 'danger';
}>) {
  const tones: Record<string, CSSProperties> = {
    default: {
      background: 'rgba(255, 255, 255, 0.04)',
      borderColor: 'rgba(127, 219, 255, 0.12)',
    },
    accent: {
      background: 'linear-gradient(135deg, rgba(127, 219, 255, 0.22), rgba(113, 247, 213, 0.16))',
      borderColor: 'rgba(127, 219, 255, 0.28)',
    },
    danger: {
      background: 'rgba(240, 141, 141, 0.12)',
      borderColor: 'rgba(240, 141, 141, 0.24)',
    },
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        ...shared.button,
        ...tones[tone],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export function CardGrid({ children }: PropsWithChildren) {
  return <div style={shared.grid}>{children}</div>;
}

const shared: Record<string, CSSProperties> = {
  pageSection: {
    display: 'grid',
    gap: '1.5rem',
  },
  header: {
    display: 'grid',
    gap: '1rem',
  },
  headerText: {
    display: 'grid',
    gap: '0.55rem',
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  eyebrow: {
    fontSize: '0.8rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(1.7rem, 2vw + 1rem, 2.8rem)',
    lineHeight: 1.02,
  },
  body: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.7,
    maxWidth: '52rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
    gap: '1rem',
  },
  card: {
    display: 'grid',
    gap: '1rem',
    padding: '1.15rem',
    borderRadius: '1.2rem',
    background: 'linear-gradient(180deg, rgba(15, 29, 48, 0.9), rgba(9, 19, 32, 0.8))',
    border: '1px solid rgba(127, 219, 255, 0.12)',
    boxShadow: '0 20px 50px rgba(1, 7, 17, 0.2)',
  },
  cardHeader: {
    display: 'grid',
    gap: '0.55rem',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.15rem',
  },
  cardBody: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.6,
  },
  cardFooter: {
    display: 'flex',
    gap: '0.6rem',
    flexWrap: 'wrap',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.35rem 0.65rem',
    borderRadius: '999px',
    fontSize: '0.86rem',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '2.5rem',
    padding: '0.7rem 1rem',
    borderRadius: '0.9rem',
    color: 'var(--ink)',
    border: '1px solid transparent',
  },
  list: {
    display: 'grid',
    gap: '0.75rem',
    padding: 0,
    margin: 0,
    listStyle: 'none',
  },
};
