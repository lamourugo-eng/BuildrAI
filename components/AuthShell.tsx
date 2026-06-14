'use client';

import SiteTopbar from '@/components/SiteTopbar';
import { useCallback } from 'react';

interface AuthShellProps {
  children: React.ReactNode;
}

export default function AuthShell({ children }: AuthShellProps) {
  const navigateSection = useCallback((hash: string) => {
    window.location.href = `/${hash}`;
  }, []);

  return (
    <div className="page-root auth-shell">
      <SiteTopbar
        variant="landing"
        onOpenQuiz={() => {
          window.location.href = '/';
        }}
        onNavigateSection={navigateSection}
      />
      <main className="auth-page auth-page--in-site">{children}</main>
    </div>
  );
}
