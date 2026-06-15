'use client';

import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import SideNav, { type SideNavGroup, type SideNavItem } from './SideNav';
import SiteBrand from './SiteBrand';

interface SiteTopbarProps {
  variant: 'quiz' | 'landing';
  userEmail?: string | null;
  onGoHome?: () => void;
  onOpenQuiz?: () => void;
  onOpenLogin?: () => void;
  onNavigateSection?: (hash: string) => void;
}

export default function SiteTopbar({
  variant,
  userEmail = null,
  onGoHome,
  onOpenQuiz,
  onOpenLogin,
  onNavigateSection,
}: SiteTopbarProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [drawerOpen]);

  const handleLogout = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setDrawerOpen(false);
      router.refresh();
    } catch {
      /* Supabase non configuré */
    }
  }, [router]);

  const goToSection = useCallback(
    (hash: string) => {
      setDrawerOpen(false);
      if (variant === 'quiz' && onGoHome) {
        onGoHome();
        setTimeout(() => onNavigateSection?.(hash), 80);
        return;
      }
      onNavigateSection?.(hash);
    },
    [variant, onGoHome, onNavigateSection]
  );

  const navGroups: SideNavGroup[] = [
    {
      id: 'discover',
      label: 'Découvrir',
      items: [
        {
          id: 'home',
          label: 'Accueil',
          icon: 'home',
          onClick: variant === 'quiz' ? onGoHome : undefined,
          href: variant === 'landing' ? '/' : undefined,
        },
        {
          id: 'features',
          label: 'Outils',
          icon: 'grid',
          description: 'Coach, parcours, ville, analyse…',
          onClick: () => goToSection('#features'),
        },
        {
          id: 'pricing',
          label: 'Tarifs',
          icon: 'pricing',
          onClick: () => goToSection('#pricing'),
        },
        {
          id: 'how',
          label: 'Comment ça marche ?',
          icon: 'flow',
          onClick: () => goToSection('#how'),
        },
        {
          id: 'faq',
          label: 'FAQ',
          icon: 'help',
          onClick: () => goToSection('#faq'),
        },
        {
          id: 'assistance',
          label: 'Assistance',
          icon: 'mail',
          description: 'Aide et contact',
          href: '/assistance',
        },
      ],
    },
    {
      id: 'account',
      label: 'Mon parcours',
      items: [
        {
          id: 'quiz',
          label: 'Mon profil',
          icon: 'profile',
          description: 'Questionnaire entrepreneurial',
          onClick: onOpenQuiz,
        },
        {
          id: 'coach',
          label: 'Coach IA',
          icon: 'coach',
          href: userEmail ? '/espace?section=coach' : '/#pricing',
        },
        ...(userEmail
          ? [
              {
                id: 'espace',
                label: 'Mon espace',
                icon: 'space',
                href: '/espace',
              } satisfies SideNavItem,
            ]
          : []),
      ],
    },
  ];

  const footerItems: SideNavItem[] = [
    ...(userEmail
      ? [
          {
            id: 'logout',
            label: 'Déconnexion',
            icon: 'logout',
            onClick: handleLogout,
            danger: true,
          } satisfies SideNavItem,
        ]
      : onOpenLogin
        ? [
            {
              id: 'login',
              label: 'Connexion',
              icon: 'login',
              onClick: onOpenLogin,
            } satisfies SideNavItem,
          ]
        : [
            {
              id: 'login',
              label: 'Connexion',
              icon: 'login',
              href: '/login',
            } satisfies SideNavItem,
          ]),
    {
      id: 'subscribe',
      label: 'Découvrir mon profil',
      primary: true,
      onClick: onOpenQuiz ? onOpenQuiz : () => goToSection('#how'),
    },
  ];

  const userInitial = userEmail ? userEmail[0].toUpperCase() : null;

  return (
    <>
      <header
        className={[
          'site-topbar',
          scrolled ? 'scrolled' : '',
          drawerOpen ? 'menu-open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="container site-topbar-shell">
          <div className="site-topbar-bar">
            <div className="site-topbar-slot site-topbar-slot--start">
              <button
                type="button"
                className={`side-nav-trigger${drawerOpen ? ' is-open' : ''}`}
                aria-expanded={drawerOpen}
                aria-controls="site-side-nav"
                aria-label={drawerOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                onClick={() => setDrawerOpen((open) => !open)}
              >
                <span className="side-nav-trigger-icon" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="side-nav-trigger-label">Menu</span>
              </button>
            </div>

            <div className="site-topbar-slot site-topbar-slot--center">
              <SiteBrand
                href={variant === 'landing' ? '/' : undefined}
                onClick={variant === 'quiz' ? onGoHome : undefined}
              />
            </div>

            <div className="site-topbar-slot site-topbar-slot--end">
              {userEmail ? (
                <Link
                  href="/espace"
                  className="site-topbar-user"
                  title={userEmail}
                  aria-label={`Mon espace. ${userEmail}`}
                >
                  <span className="site-topbar-user-avatar" aria-hidden="true">
                    {userInitial}
                  </span>
                  <span className="site-topbar-user-email">Mon espace</span>
                </Link>
              ) : (
                <>
                  {onOpenLogin ? (
                    <button
                      type="button"
                      className="site-topbar-link site-topbar-link--desktop"
                      onClick={onOpenLogin}
                    >
                      Connexion
                    </button>
                  ) : (
                    <Link href="/login" className="site-topbar-link site-topbar-link--desktop">
                      Connexion
                    </Link>
                  )}
                  <button
                    type="button"
                    className="site-topbar-cta site-topbar-cta--primary"
                    onClick={onOpenQuiz}
                  >
                    <span>Quiz gratuit</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <SideNav
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        groups={navGroups}
        footerItems={footerItems}
        userEmail={userEmail}
        onGoHome={variant === 'quiz' ? onGoHome : undefined}
      />
    </>
  );
}
