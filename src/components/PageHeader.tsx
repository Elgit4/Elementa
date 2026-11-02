import type { ComponentType, ReactNode } from 'react';

/** The one page header every screen uses: optional eyebrow, the page's only h1, a short description, optional actions. */
export function PageHeader({ title, subtitle, eyebrow, Icon, actions }: { title: string; subtitle?: ReactNode; eyebrow?: string; Icon?: ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' }>; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div className="page-head-main">
        {(eyebrow || Icon) && (
          <p className="eyebrow">{Icon && <Icon size={16} aria-hidden="true" />}{eyebrow}</p>
        )}
        <h1>{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export interface Crumb { label: string; href?: string }

/** Where am I? Last crumb is the current page and is not a link. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return <li key={c.label}>{c.href && !last ? <a href={c.href}>{c.label}</a> : <span aria-current={last ? 'page' : undefined}>{c.label}</span>}</li>;
        })}
      </ol>
    </nav>
  );
}
