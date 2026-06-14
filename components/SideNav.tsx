'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import SiteBrand from './SiteBrand';

export type SideNavIconId =
  | 'home'
  | 'grid'
  | 'flow'
  | 'pricing'
  | 'help'
  | 'mail'
  | 'profile'
  | 'coach'
  | 'space'
  | 'login'
  | 'logout';

export interface SideNavItem {
  id: string;
  label: string;
  description?: string;
  icon?: SideNavIconId;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
  danger?: boolean;
  active?: boolean;
  locked?: boolean;
  badge?: string;
}

export interface SideNavGroup {
  id: string;
  label: string;
  items: SideNavItem[];
}

export interface SideNavStat {
  label: string;
  value: string;
  hint?: string;
  progress?: number;
  accent?: string;
}

interface SideNavProps {
  open: boolean;
  onClose: () => void;
  groups: SideNavGroup[];
  footerItems?: SideNavItem[];
  userEmail?: string | null;
  userPlan?: string | null;
  stats?: SideNavStat[];
  onGoHome?: () => void;
  showFreeCta?: boolean;
}

function NavIcon({ id }: { id: SideNavIconId }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (id) {
    case 'home':
      return (
        <svg {...props}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'flow':
      return (
        <svg {...props}>
          <path d="M5 7h6M13 7h6M5 12h14M5 17h9M16 17h3" />
          <circle cx="11" cy="7" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="14" cy="17" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'pricing':
      return (
        <svg {...props}>
          <path d="M12 3v18M7.5 7.5h7.5a3 3 0 1 1 0 6H9a3 3 0 1 0 0 6h9.5" />
        </svg>
      );
    case 'help':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.25a2.75 2.75 0 1 1 4.72 1.94c-.98.86-1.72 1.56-1.72 2.81V15" />
          <circle cx="12" cy="18" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...props}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="m4 8 8 5 8-5" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1.6-3.5 4.4-5.5 7-5.5s5.4 2 7 5.5" />
        </svg>
      );
    case 'coach':
      return (
        <svg {...props}>
          <path d="M12 3a7 7 0 0 1 7 7c0 2.8-1.7 5.2-4.1 6.3L12 21l-2.9-4.7A7 7 0 0 1 5 10a7 7 0 0 1 7-7Z" />
          <circle cx="12" cy="10" r="2" />
        </svg>
      );
    case 'space':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 9h8M8 13h5" />
        </svg>
      );
    case 'login':
      return (
        <svg {...props}>
          <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-3-3 3-3M7 13h9" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...props}>
          <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M14 16l3-3-3-3M11 13h6" />
        </svg>
      );
    default:
      return null;
  }
}

function NavItem({
  item,
  onClose,
  index,
}: {
  item: SideNavItem;
  onClose: () => void;
  index: number;
}) {
  const className = [
    'side-nav-link',
    item.primary ? 'primary' : '',
    item.danger ? 'danger' : '',
    item.active ? 'is-active' : '',
    item.locked ? 'is-locked' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {item.icon && (
        <span className="side-nav-link-icon">
          <NavIcon id={item.icon} />
        </span>
      )}
      <span className="side-nav-link-text">
        <strong>
          {item.label}
          {item.badge && <em className="side-nav-link-badge">{item.badge}</em>}
        </strong>
        {item.description && <span>{item.description}</span>}
      </span>
      {item.locked && (
        <span className="side-nav-link-lock" aria-hidden="true">
          🔒
        </span>
      )}
      {!item.primary && !item.locked && (
        <span className="side-nav-link-chevron" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </>
  );

  const style = { '--nav-delay': `${index * 40}ms` } as CSSProperties;

  function handleClick() {
    item.onClick?.();
    onClose();
  }

  if (item.href && !item.onClick) {
    return (
      <Link href={item.href} className={className} style={style} onClick={onClose}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} style={style} onClick={handleClick}>
      {content}
    </button>
  );
}

export default function SideNav({
  open,
  onClose,
  groups,
  footerItems = [],
  userEmail = null,
  userPlan = null,
  stats = [],
  onGoHome,
  showFreeCta = true,
}: SideNavProps) {
  const userInitial = userEmail ? userEmail[0].toUpperCase() : null;
  const primaryCta = footerItems.find((item) => item.primary);
  const secondaryFooter = footerItems.filter((item) => !item.primary);

  let itemIndex = 0;

  return (
    <>
      <button
        type="button"
        className={`side-nav-overlay${open ? ' open' : ''}`}
        aria-label="Fermer le menu"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />
      <aside
        id="site-side-nav"
        className={`side-nav${open ? ' open' : ''}`}
        aria-hidden={!open}
        aria-label="Menu de navigation"
        role="dialog"
      >
        <div className="side-nav-glow side-nav-glow--top" aria-hidden="true" />
        <div className="side-nav-glow side-nav-glow--bottom" aria-hidden="true" />

        <div className="side-nav-header">
          <div className="side-nav-brand">
            {onGoHome ? <SiteBrand onClick={onGoHome} /> : <SiteBrand href="/" />}
          </div>
          <button
            type="button"
            className="side-nav-close"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {userEmail && (
          <div className="side-nav-user">
            <span className="side-nav-user-avatar" aria-hidden="true">
              {userInitial}
            </span>
            <div className="side-nav-user-info">
              <span className="side-nav-user-label">
                {userPlan ? `Plan ${userPlan}` : 'Session active'}
              </span>
              <span className="side-nav-user-email">{userEmail}</span>
            </div>
            <span className="side-nav-user-dot" aria-hidden="true" />
          </div>
        )}

        <div className="side-nav-body">
          {stats.length > 0 && (
            <div className="side-nav-empire">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={`side-nav-empire-row${typeof stat.progress === 'number' ? ' side-nav-empire-row--progress' : ''}`}
                  style={
                    stat.accent
                      ? ({ '--empire-accent': stat.accent } as CSSProperties)
                      : undefined
                  }
                >
                  <span className="side-nav-empire-label">{stat.label}</span>
                  {stat.hint ? (
                    <span className="side-nav-empire-hint">{stat.hint}</span>
                  ) : (
                    <strong className="side-nav-empire-value side-nav-empire-value--inline">
                      {stat.value}
                    </strong>
                  )}
                  {stat.hint && (
                    <strong className="side-nav-empire-value">{stat.value}</strong>
                  )}
                  {typeof stat.progress === 'number' && (
                    <div className="side-nav-empire-progress" aria-hidden="true">
                      <div
                        className="side-nav-empire-progress-fill"
                        style={{ width: `${Math.min(100, Math.max(0, stat.progress))}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {groups.map((group) => (
            <section key={group.id} className="side-nav-group">
              <h2 className="side-nav-group-label">{group.label}</h2>
              <nav className="side-nav-links" aria-label={group.label}>
                {group.items.map((item) => {
                  const node = (
                    <NavItem
                      key={item.id}
                      item={item}
                      onClose={onClose}
                      index={itemIndex}
                    />
                  );
                  itemIndex += 1;
                  return node;
                })}
              </nav>
            </section>
          ))}
        </div>

        {footerItems.length > 0 && (
          <div className="side-nav-footer">
            {primaryCta && showFreeCta && (
              <div className="side-nav-cta">
                <div className="side-nav-cta-badge">Plan gratuit</div>
                <h3>Votre coach IA vous attend</h3>
                <p>Plan d&apos;action personnalisé, suivi et outils premium.</p>
                <NavItem item={primaryCta} onClose={onClose} index={itemIndex} />
              </div>
            )}
            {secondaryFooter.length > 0 && (
              <div className="side-nav-footer-actions">
                {secondaryFooter.map((item) => {
                  itemIndex += 1;
                  return (
                    <NavItem
                      key={item.id}
                      item={item}
                      onClose={onClose}
                      index={itemIndex}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
