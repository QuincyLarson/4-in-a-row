import type { CSSProperties, PropsWithChildren, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

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
          ? `0 6px 18px color-mix(in srgb, ${accent} 8%, transparent)`
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
      background: 'rgba(153, 201, 255, 0.12)',
      color: 'var(--accent-2)',
    },
    success: {
      background: 'rgba(172, 209, 87, 0.14)',
      color: 'var(--success)',
    },
    warning: {
      background: 'rgba(241, 190, 50, 0.14)',
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
      background: 'var(--surface)',
      borderColor: 'rgba(245, 246, 247, 0.1)',
    },
    accent: {
      background: 'var(--accent)',
      color: '#0a0a23',
      borderColor: 'rgba(241, 190, 50, 0.9)',
    },
    danger: {
      background: 'rgba(255, 173, 173, 0.12)',
      borderColor: 'rgba(255, 173, 173, 0.3)',
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

export function RouteButton({
  to,
  children,
  disabled = false,
  tone = 'default',
}: PropsWithChildren<{
  to: string;
  disabled?: boolean;
  tone?: 'default' | 'accent' | 'danger';
}>) {
  const navigate = useNavigate();

  return (
    <InlineButton
      tone={tone}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          navigate(to);
        }
      }}
    >
      {children}
    </InlineButton>
  );
}

export function CardGrid({ children }: PropsWithChildren) {
  return <div style={shared.grid}>{children}</div>;
}

const shared: Record<string, CSSProperties> = {
  pageSection: {
    display: 'grid',
    gap: '0.95rem',
  },
  header: {
    display: 'grid',
    gap: '0.6rem',
  },
  headerText: {
    display: 'grid',
    gap: '0.38rem',
  },
  headerActions: {
    display: 'flex',
    gap: '0.7rem',
    flexWrap: 'wrap',
  },
  eyebrow: {
    fontSize: '0.8rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--accent-2)',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(1.4rem, 1.5vw + 1rem, 2.1rem)',
    lineHeight: 1.06,
  },
  body: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.55,
    maxWidth: '42rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))',
    gap: '0.75rem',
  },
  card: {
    display: 'grid',
    gap: '0.65rem',
    padding: '0.82rem',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)',
    border: '1px solid rgba(245, 246, 247, 0.08)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
  },
  cardHeader: {
    display: 'grid',
    gap: '0.35rem',
  },
  cardTitle: {
    margin: 0,
    fontSize: '0.98rem',
  },
  cardBody: {
    margin: 0,
    color: 'var(--muted)',
    lineHeight: 1.5,
    fontSize: '0.9rem',
  },
  cardFooter: {
    display: 'flex',
    gap: '0.45rem',
    flexWrap: 'wrap',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.22rem 0.48rem',
    borderRadius: '0.55rem',
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    border: '1px solid rgba(245, 246, 247, 0.05)',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '2.25rem',
    padding: '0.52rem 0.78rem',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--ink)',
    border: '1px solid transparent',
    fontWeight: 700,
  },
  list: {
    display: 'grid',
    gap: '0.75rem',
    padding: 0,
    margin: 0,
    listStyle: 'none',
  },
};
